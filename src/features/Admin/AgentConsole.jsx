import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { startCase } from 'lodash';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Icons
import { RiRobot2Fill, RiMagicLine, RiFileUploadFill, RiCloseLine } from "react-icons/ri";
import { GiTwoCoins } from "react-icons/gi";
import { FaCheckCircle, FaArrowLeft, FaLock, FaUnlock, FaCloudUploadAlt, FaExclamationTriangle } from "react-icons/fa";
import { IoChevronBack } from "react-icons/io5";
import { BsFillFileEarmarkWordFill, BsTranslate } from "react-icons/bs";

// --- QUILL SETUP (Matching EditChapter) ---
const Parchment = Quill.import('parchment');
const TightClass = new Parchment.Attributor.Class('tight', 'tight', {
  scope: Parchment.Scope.BLOCK
});
Quill.register(TightClass, true);

const modules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'], 
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'background': [] }], // Added background color module so Quill keeps our highlights
    [{ 'tight': 'spacing' }],
    ['clean'] 
  ],
  clipboard: { matchVisual: false }
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'code-block',
  'background','tight'
];

// --- VALIDATION SCHEMA FOR PUBLISHING ---
const publishSchema = yup.object().shape({
  isLocked: yup.boolean().default(true),
  coinCost: yup.number().when("isLocked", {
    is: true,
    then: (schema) => schema.required("Coin cost is required").oneOf([10, 20, 30, 40, 50, 60]),
    otherwise: (schema) => schema.notRequired().transform(() => 0),
  }),
});

function AgentConsole() {
  const { bookId } = useParams();
  const { auth } = useAuth();

  // Book State
  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [nextChapterNo, setNextChapterNo] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Workflow State
  const [step, setStep] = useState(1); // 1 = Raw Input, 2 = Preview/Edit
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Step 1: Raw Inputs
  const [rawTitle, setRawTitle] = useState("");
  const [rawContent, setRawContent] = useState("");

  // Step 2: Translated Outputs
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedContent, setTranslatedContent] = useState("");
  const [newVocabItems, setNewVocabItems] = useState([]);
  const [missedTerms, setMissedTerms] = useState([]);

  // --- VOCAB UPLOAD STATE ---
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [vocabFile, setVocabFile] = useState(null);
  const [isUploadingVocab, setIsUploadingVocab] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Quality Scores states
  const [qualityScore, setQualityScore] = useState(null);
  const [scoreReasons, setScoreReasons] = useState([]);

  // --- VOCAB MODAL HANDLERS ---
  const handleCloseModal = () => {
    setIsVocabModalOpen(false);
    setUploadStats(null);
    setUploadError(null);
    setVocabFile(null);
  };

  // React Hook Form (for Monetization settings on Step 2)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(publishSchema),
    defaultValues: { isLocked: true, coinCost: 20 }
  });
  const coinOptions = [10, 20, 30, 40, 50, 60];

  // --- NEW: Helper to extract missed terms from the QA Array ---
  // const extractMissedTerms = (reasons) => {
  //   const terms = [];
  //   reasons.forEach(reason => {
  //     const match = reason.match(/->\s*(.+)$/);
  //     if (match) {
  //       // Matches things like: "First Grade", "Formation Arts"
  //       const extracted = match[1].split(',').map(t => t.trim().replace(/"/g, ''));
  //       terms.push(...extracted);
  //     }
  //   });
  //   return terms;
  // };

  // Helper to format AI text into Quill HTML and apply Fuzzy Highlighting
  const formatContentForEditor = (content) => {
  if (!content) return "";
    let processedContent = content;

    // 1. Safely wrap plain text in HTML paragraphs FIRST
    const isAlreadyHtml = /<p>|<br>/i.test(processedContent);
    if (!isAlreadyHtml) {
      processedContent = processedContent.split(/\r?\n/).map(line => {
          const trimmed = line.trim();
          return trimmed ? `<p>${trimmed}</p>` : '<p><br></p>'; 
      }).join('');
    }

    // // 2. Inject Highlights SECOND
    // if (missedTerms.length > 0) {
    //   missedTerms.forEach(term => {
    //     // Create a fuzzy regex that replaces spaces with an optional hyphen/space matcher
    //     const fuzzyTerm = term
    //       .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    //       .split(/\s+/)
    //       .join('[\\s\\-]+'); 
        
    //     const regex = new RegExp(`(${fuzzyTerm})`, 'gi');
        
    //     // FIX: The style MUST be on a <span> for Quill to recognize the background format!
    //     // We also use rgb(255, 255, 0) and the built-in ql-bg-yellow class to force Quill's hand.
    //     processedContent = processedContent.replace(
    //       regex, 
    //       `<span class="ql-bg-yellow" style="background-color: rgb(255, 255, 0);"><strong>$1</strong></span>`
    //     );
    //   });
    // }
    
    // 3. Inject Red Highlights for Leaked Chinese Characters
    // Matches one or more Chinese characters
    const chineseRegex = /([\u4e00-\u9fa5]+)/g; 
    if (chineseRegex.test(processedContent)) {
      // Wrap them in a bright red background so the admin can't miss them
      processedContent = processedContent.replace(
        chineseRegex, 
        `<span class="ql-bg-red" style="background-color: rgb(255, 153, 153); color: black;"><strong>$1</strong></span>`
      );
    }
    return processedContent;
  };

  // Load Book Details
  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const response = await api.get(`/books/${bookId}`);
        const bookData = response.data.data;
        setBook(bookData);
        setNextChapterNo((bookData?.chapters?.length || 0) + 1);
        
        // Auto-set free/locked status based on freeChapters count
        if (bookData?.chapters && bookData.chapters.length < (bookData.freeChapters || 0)) {
            setValue("isLocked", false);
        }

        setLoadingBook(false);
      } catch (err) {
        console.error("Fetch Book Error:", err.message);
        setError("Failed to load book for agent.");
        setLoadingBook(false);
      }
    };
    fetchBookDetails();
  }, [bookId, setValue]);

  // --- HANDLER: Translate & Preview ---
  const handlePreview = async () => {
    if (!rawTitle.trim() || !rawContent.trim()) {
      setError("Raw Title and Content are required to translate.");
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await api.post('/agent/preview', {
        bookId: book._id,
        rawTitle,
        rawContent
      }, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });

      const { translatedTitle: tTitle, translatedContent: tContent, newVocabItems: vocab, qualityScore: qScore, scoreReasons: qReasons, missedTermsData: mTerms } = response.data.data;

      // // Extract the terms before formatting the content
      // const missedTerms = extractMissedTerms(qReasons || []);

      setMissedTerms(mTerms || []);
      
      setTranslatedTitle(tTitle);
      setTranslatedContent(formatContentForEditor(tContent));
      setNewVocabItems(vocab || []);
      setQualityScore(qScore);
      setScoreReasons(qReasons || []);
      setStep(2); // Move to review step

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  // --- HANDLER: Final Publish ---
  const handlePublish = async (data) => {
    if (!translatedTitle.trim() || !translatedContent.trim()) {
      setError("Translated title and content cannot be empty.");
      return;
    }

    setIsPublishing(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/agent/publish', {
        bookId: book._id,
        title: translatedTitle,
        content: translatedContent,
        isLocked: data.isLocked,
        coinCost: data.isLocked ? data.coinCost : 0,
        newVocabItems // Send back any vocab discovered to save to the DB
      }, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });

      // Clear the form and reset to step 1 for the next chapter!
      setRawTitle("");
      setRawContent("");
      setTranslatedTitle("");
      setTranslatedContent("");
      setNewVocabItems([]);
      setMissedTerms([]);
      setNextChapterNo(prev => prev + 1);
      setStep(1);
      
      // alert(`Chapter published successfully! Ready for Chapter ${nextChapterNo + 1}.`);
      setSuccess("Chapter published 🤘🏼");

    } catch (err) {
      setError(err.response?.data?.error || "Failed to publish chapter.");
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Handle login error timeout separately
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // --- VOCAB HANDLERS ---
  const handleVocabUpload = async (e) => {
    e.preventDefault();
    if (!vocabFile) return;

    const formData = new FormData();
    formData.append('file', vocabFile);
    formData.append('bookId', book._id);

    setIsUploadingVocab(true);
    setUploadError(null);
    setUploadStats(null);

    try {
      const response = await api.post('/vocab/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${auth?.token}`
        }
      });
      setUploadStats(response.data.stats);
      setVocabFile(null);
    } catch (error) {
      setUploadError(error.response?.data?.error || "Upload failed");
    } finally {
      setIsUploadingVocab(false);
    }
  };

  if (loadingBook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-cyan-500"></span>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-gray-100 p-4 md:p-6 max-w-7xl mx-auto">

       {/* Alerts */}
      <div className="fixed left-[42%] top-4 -translate-x-1/2 z-50 animate__animated animate__fadeInDown">
        {success && (
            <div role="alert" className="alert alert-info w-auto max-w-[90vw]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
                <span>{success}</span>
          </div>
        )}
      </div>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-black/40 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 shadow-2xl mb-6">
        <div className="flex gap-4 items-start">
          <div className="relative shadow-xl w-20 overflow-hidden group">
            <div className="overflow-hidden aspect-[3/4] w-full rounded-xl">
              <img src={book?.bookImage} alt={book?.title} className="object-cover h-full w-full rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RiRobot2Fill className="text-cyan-400 text-3xl " />
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">
                AI Translation Agent
              </h1>
            </div>
            <h2 className="text-lg font-semibold text-white capitalize">{startCase(book?.title)}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="badge badge-outline badge-info gap-1 font-bold">
                Targeting: Chapter {nextChapterNo}
              </div>
              <div className={`badge gap-1 ${step === 1 ? 'badge-warning' : 'badge-success'}`}>
                {step === 1 ? 'Step 1: Input Source' : 'Step 2: Review & Publish'}
              </div>
            </div>
          </div>
        </div>


        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => setIsVocabModalOpen(true)} className="btn btn-sm btn-outline btn-warning gap-2" title="Import Word Doc Vocab">
            <RiFileUploadFill /> Import Vocab
          </button>
          <Link to={`/admin/books/${bookId}`} className="btn btn-sm btn-outline btn-ghost gap-2">
            <FaArrowLeft /> Back to Book
          </Link>
        </div>

      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-error shadow-lg mb-6 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">Dismiss</button>
        </div>
      )}

      {/* STEP 1: RAW INPUT */}
      {step === 1 && (
        <div className="bg-gradient-to-br from-gray-800/50 to-black/50 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 shadow-xl animate__animated animate__fadeIn">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-4">
            <BsTranslate className="text-cyan-400 text-2xl" />
            <h2 className="text-xl font-bold text-white">Source Chinese Material</h2>
          </div>

          <div className="space-y-6">
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-semibold text-gray-300">Raw Chapter Title</span></label>
              <input
                type="text"
                placeholder="Paste Chinese title here..."
                value={rawTitle}
                onChange={(e) => setRawTitle(e.target.value)}
                className="input input-bordered w-full bg-black/60 text-white focus:border-cyan-500 font-mono text-sm"
                disabled={isTranslating}
              />
            </div>

            <div className="flex flex-col">
              <label className="label"><span className="label-text font-semibold text-gray-300">Raw Chapter Content</span></label>
              <div className="h-[600px] flex flex-col bg-slate-200 rounded text-black overflow-hidden">
                <ReactQuill 
                  theme="snow"
                  value={rawContent} 
                  onChange={setRawContent}
                  modules={modules}
                  formats={formats}
                  className="h-full flex flex-col"
                  placeholder="Paste raw Chinese prose here..."
                  readOnly={isTranslating}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handlePreview} 
                disabled={isTranslating || !rawTitle || !rawContent}
                className="btn btn-info w-full md:w-64 gap-2"
              >
                {isTranslating ? (
                  <><span className="loading loading-spinner"></span> Running Agent...</>
                ) : (
                  <><RiMagicLine className="text-xl" /> Translate & Preview</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: REVIEW & PUBLISH */}
      {step === 2 && (
        <form onSubmit={handleSubmit(handlePublish)} className="space-y-6 animate__animated animate__fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: THE EDITOR */}
            <div className="lg:col-span-8 bg-gradient-to-br from-gray-800/50 to-black/50 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-xl" />
                  <h2 className="text-xl font-bold text-white">Review Translation</h2>
                </div>
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline btn-ghost">
                  <IoChevronBack /> Edit Raw
                </button>
              </div>

              <div className="space-y-6">
                <div className="form-control w-full">
                  <label className="label"><span className="label-text font-semibold text-gray-300">English Chapter Title</span></label>
                  <input
                    type="text"
                    value={translatedTitle}
                    onChange={(e) => setTranslatedTitle(e.target.value)}
                    className="input input-bordered w-full bg-slate-200 text-black font-semibold focus:border-cyan-500"
                    disabled={isPublishing}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="label"><span className="label-text font-semibold text-gray-300">English Chapter Content</span></label>
                  
                  {/* NEW: Missed Terms Action Banner */}
                  {missedTerms?.length > 0 && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-t-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <FaExclamationTriangle className="text-xl shrink-0" />
                        <span className="text-sm font-bold">Action Required:</span>
                      </div>
                      <span className="text-xs text-yellow-200/80">The AI hallucinated these terms. Please inject them manually:</span>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 sm:ml-auto">
                        
                        {/* Render the term AND the paragraph numbers! */}
                        {missedTerms?.map((item, idx) => (
                          <span key={idx} className="badge badge-warning font-bold text-black shadow-lg">
                            {item.term} {item.paragraphs?.length > 0 ? `(Para ${item.paragraphs.join(', ')})` : ''}
                          </span>
                        ))}

                      </div>
                    </div>
                  )}

                  <div className={`h-[600px] flex flex-col bg-slate-200 text-black overflow-hidden ${missedTerms?.length > 0 ? 'rounded-b' : 'rounded'}`}>
                    <ReactQuill 
                      theme="snow"
                      value={translatedContent} 
                      onChange={setTranslatedContent}
                      modules={modules}
                      formats={formats}
                      className="h-full flex flex-col"
                      readOnly={isPublishing}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CONFIG & PUBLISH */}
            <div className="lg:col-span-4 space-y-6">

              {/* QA Scoring Card */}
              {qualityScore !== null && (
                <div className={`border rounded-2xl p-5 shadow-xl mb-6 ${qualityScore >= 80 ? 'bg-green-900/20 border-green-500/30' : qualityScore >= 60 ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                  <h3 className={`text-lg font-bold flex items-center justify-between mb-2 ${qualityScore >= 80 ? 'text-green-400' : qualityScore >= 60 ? 'text-yellow-400' : 'text-red-400' }`}>
                    <span>Translation Quality</span>
                    <span className="text-2xl">{qualityScore}/100</span>
                  </h3>
                  {qualityScore >= 80 ? (
                    <p className="text-sm text-green-200/80">Excellent translation. Structure and glossary adherence are optimal.</p>
                  ) : qualityScore >= 60 ? (
                    <p className="text-sm text-yellow-200/80">Average translation. Some structure or glossary adherence issues.</p>
                  ) : (
                    <p className="text-sm text-red-200/80 font-bold">Warning: Review required before publishing.</p>
                  )}
                  
                  {scoreReasons.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-gray-400 list-disc list-inside">
                      {scoreReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {/* Pre-Flight Vocab Discovered */}
              <div className="bg-black/40 border border-green-500/30 rounded-2xl p-5 shadow-xl">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 mb-3">
                  <BsFillFileEarmarkWordFill /> New Terminology Found
                </h3>
                {newVocabItems && newVocabItems.length > 0 ? (
                  <ul className="space-y-2 text-sm max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {newVocabItems.map((v, i) => (
                      <li key={i} className="flex justify-between border-b border-gray-700/50 pb-1">
                        <span className="text-gray-400">{v.original}</span>
                        <span className="text-white font-medium">{v.translation}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 italic">No new proper nouns automatically detected in this chapter.</p>
                )}
                <p className="text-[10px] text-gray-500 mt-3 pt-2 border-t border-gray-800">
                  *These terms were applied during translation and will be permanently saved to the Book Glossary upon publishing.
                </p>
              </div>

              {/* Monetization Card */}
              <div className="bg-black/40 border border-gray-700 rounded-2xl p-5 shadow-xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  {watch("isLocked") ? <FaLock className="text-red-500"/> : <FaUnlock className="text-green-500"/>}
                  Release Settings
                </h3>

                <div className="form-control mb-4">
                  <label className="label cursor-pointer p-0">
                    <span className="label-text text-base text-gray-300">Lock Chapter (Premium)</span>
                    <input type="checkbox" {...register("isLocked")} className="toggle toggle-info" disabled={isPublishing} />
                  </label>
                </div>

                {watch("isLocked") && (
                  <div className="animate__animated animate__fadeIn">
                    <label className="label"><span className="label-text font-semibold text-gray-400">Unlock Cost (Coins)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {coinOptions.map((cost) => (
                        <button
                          key={cost}
                          type="button"
                          onClick={() => setValue("coinCost", cost, { shouldValidate: true })}
                          className={`btn btn-sm ${watch("coinCost") === cost ? "btn-info text-white" : "btn-outline border-gray-600 text-gray-400"}`}
                          disabled={isPublishing}
                        >
                          <GiTwoCoins /> {cost}
                        </button>
                      ))}
                    </div>
                    {errors.coinCost && <span className="text-red-500 text-xs mt-2 block">{errors.coinCost.message}</span>}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isPublishing} 
                className="btn w-full btn-success shadow-lg shadow-green-900/50 text-lg h-14"
              >
                {isPublishing ? (
                  <><span className="loading loading-spinner"></span> Publishing...</>
                ) : (
                  <><FaCloudUploadAlt className="text-2xl" /> Publish Chapter</>
                )}
              </button>

            </div>
          </div>
        </form>
      )}


      {/* VOCAB UPLOAD MODAL */}
      {isVocabModalOpen && (
        <div onClick={handleCloseModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer">
            <div onClick={(e) => e.stopPropagation()} className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-white"><RiCloseLine className="text-2xl" /></button>
            <div className="flex items-center gap-3 mb-4">
              <RiFileUploadFill className="text-3xl text-yellow-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Import Vocabulary</h3>
                <p className="text-xs text-gray-400">Upload a .docx file to bulk add terms.</p>
              </div>
            </div>

            {uploadError && (
              <div className="alert alert-error text-xs shadow-lg mb-4 rounded-lg">
                <FaExclamationTriangle /><span>{uploadError}</span>
              </div>
            )}

            {uploadStats ? (
              <div className="space-y-4">
                <div className="alert alert-success bg-green-900/50 border-green-500/50 text-green-200 text-xs shadow-lg rounded-lg">
                  <FaCheckCircle className="text-lg" />
                  <div className="flex flex-col"><span className="font-bold text-sm">Upload Complete!</span><span>Your vocab database has been updated.</span></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/50 p-2 rounded border border-green-500/30"><div className="text-lg font-bold text-green-400">{uploadStats.created}</div><div className="text-[10px] text-gray-400 uppercase">Created</div></div>
                  <div className="bg-black/50 p-2 rounded border border-blue-500/30"><div className="text-lg font-bold text-blue-400">{uploadStats.updated}</div><div className="text-[10px] text-gray-400 uppercase">Updated</div></div>
                  <div className="bg-black/50 p-2 rounded border border-red-500/30"><div className="text-lg font-bold text-red-400">{uploadStats.skipped}</div><div className="text-[10px] text-gray-400 uppercase">Skipped</div></div>
                </div>
                <button onClick={handleCloseModal} className="btn btn-sm btn-success w-full mt-2">Close & Continue</button>
              </div>
            ) : (
              <form onSubmit={handleVocabUpload} className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-gray-300">Select Word Document (.docx)</span></label>
                  <input type="file" accept=".docx" onChange={(e) => setVocabFile(e.target.files[0])} className="file-input file-input-bordered file-input-info w-full bg-black/50 text-xs" required />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">Format: <code className="bg-black/50 p-1 rounded">{"<Chinese Term> translated/translates as <English Term>"}</code></span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={handleCloseModal} className="btn btn-sm btn-ghost">Cancel</button>
                  <button type="submit" disabled={!vocabFile || isUploadingVocab} className="btn btn-sm btn-warning gap-2">
                    {isUploadingVocab ? <span className="loading loading-spinner loading-xs"></span> : <FaCloudUploadAlt />}
                    {isUploadingVocab ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </main>
  );
}

export default AgentConsole;
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../api/axios";
import { CiLock, CiUnlock } from "react-icons/ci";
import { GiTwoCoins } from "react-icons/gi";
import { IoChevronBack } from "react-icons/io5";
import { startCase } from 'lodash';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// import { useAuth } from "../../context/AuthContext";

// REGISTER CUSTOM "TIGHT" FORMAT (Same as AddChapter)
const Parchment = Quill.import('parchment');
const TightClass = new Parchment.Attributor.Class('tight', 'tight', {
  scope: Parchment.Scope.BLOCK
});
Quill.register(TightClass, true);

// DEFINE TOOLBAR (Matches AddChapter)
const modules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'], 
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'tight': 'spacing' }], // Custom Tight Spacing Button
    ['clean'] 
  ],
  clipboard: {
    // This stops Quill from adding extra newlines when pasting from the clipboard to match visual spacing
    matchVisual: false,
  }
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'code-block',
  'tight'
];

const chapterSchema = yup.object().shape({
  title: yup.string().required("Title is required").min(3, "Too Short!").max(1000, "Too long"),
  content: yup.string().required("Content is required").min(20, "Content must be at least 20 characters"),
  isLocked: yup.boolean(),
  coinCost: yup.number().when("isLocked", {
    is: true,
    then: (schema) => schema.required("Coin cost is required for locked chapters").oneOf([10, 20, 30, 40, 50, 60]),
    otherwise: (schema) => schema.notRequired().transform(() => 0),
  }),
});

function EditChapter() {
  const { bookId, chapterId } = useParams();
  const navigate = useNavigate();
  // const { auth } = useAuth();
  
  const [loading, setLoading] = useState(false); // For saving
  const [fetchLoading, setFetchLoading] = useState(true); // For initial data
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
	const [chapterNo, setChapterNo] = useState(null);
	const [bookTitle, setBookTitle] = useState("");
  
  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      isLocked: false,
      coinCost: 0,
    },
  });

  const coinOptions = [10, 20, 30, 40, 50, 60];

  // 1. Fetch Existing Chapter Data
  useEffect(() => {
    const fetchChapterData = async () => {
      setFetchLoading(true);
      try {
        const response = await api.get(`/admin/chapters/${chapterId}`);
        const chapterData = response.data.data;
        
				setChapterNo(chapterData.chapterNo);

				// 2. Set the book title (safely check if book object exists)
        if (chapterData.book && chapterData.book.title) {
            setBookTitle(chapterData.book.title);
        }       

				// Populate Form
        reset({
          title: chapterData.title,
          content: chapterData.content,
          isLocked: chapterData.isLocked,
          coinCost: chapterData.coinCost || 0,
        });
        
        setFetchLoading(false);
      } catch (err) {
				console.error(err.message);
        setError("Failed to load chapter details.");
        setFetchLoading(false);
      }
    };

    fetchChapterData();
  }, [chapterId, reset]);

  // 2. Handle Update
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
			await api.put(
        `/admin/chapters/${chapterId}`,
        {
          title: data.title,
          content: data.content,
          isLocked: data.isLocked,
          coinCost: data.isLocked ? data.coinCost : 0,
        }
      );

      setSuccess("Chapter updated 🤘🏼");
      
      // Optional: Redirect back to book details after short delay
      setTimeout(() => {
        navigate(`/admin/books/${bookId}`);
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update chapter.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-info"></span>
      </div>
    );
  }

  return (
    <div className="relative p-6 max-w-5xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={`/admin/books/${bookId}`} className="btn btn-circle btn-ghost">
            <IoChevronBack className="text-2xl" />
        </Link>
        <div>
            <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">
            Edit Chapter {chapterNo} of {startCase(bookTitle)}
            </h2>
            <p className="text-sm text-gray-400">Update content and monetization settings</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="fixed left-[42%] top-4 -translate-x-1/2 z-50 animate__animated animate__fadeInDown">
        {error && (
          <div role="alert" className="alert alert-error w-auto max-w-[90vw]">
              <svg
                  className="h-6 w-6 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
              >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
              </svg>
              <span>{error}</span>
          </div>
        )}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title Input */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold text-lg">Chapter Title</span>
          </label>
          <input
            type="text"
            placeholder="Enter chapter title..."
            {...register("title")}
            className={`input input-bordered w-full bg-slate-200 text-black placeholder-gray-500 focus:outline-none focus:border-cyan-500 ${errors.title ? "input-error" : ""}`}
          />
          {errors.title && <span className="text-red-500 text-sm mt-1">{errors.title.message}</span>}
        </div>

        {/* Content Editor - REACT QUILL */}
        <div className="flex flex-col">
          <label className="label">
            <span className="label-text font-semibold text-lg">Content</span>
          </label>
          <div className="h-[600px] flex flex-col bg-slate-200 rounded text-black overflow-hidden">
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <ReactQuill 
                      theme="snow"
                      value={field.value} 
                      onChange={field.onChange}
                      modules={modules}
                      formats={formats}
                      className="h-full flex flex-col" // Fill container
                      placeholder="Write or paste your chapter content here..."
                      readOnly={fetchLoading || !!error}
                    />
                  )}
                />
            </div>
					{errors.content && <span className="text-red-500 text-sm mt-1">{errors.content.message}</span>}
        </div>

        {/* Monetization Settings Card */}
        <div className="card bg-base-200 border border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                {watch("isLocked") ? <CiLock className="text-red-500"/> : <CiUnlock className="text-green-500"/>}
                Premium Settings
            </h3>
            
            <div className="flex flex-col md:flex-row gap-8">
                {/* Lock Toggle */}
                <div className="form-control">
                    <label className="label cursor-pointer flex gap-4">
                        <span className="label-text text-base">Lock Chapter (Premium)</span>
                        <input
                            type="checkbox"
                            {...register("isLocked")}
                            className="checkbox checkbox-info checkbox-lg"
                        />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        Locked chapters require coins to unlock.
                    </p>
                </div>

                {/* Coin Selection (Conditional) */}
                {watch("isLocked") && (
                    <div className="animate__animated animate__fadeIn">
                        <label className="label">
                            <span className="label-text font-semibold">Unlock Cost (Coins)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {coinOptions.map((cost) => (
                            <button
                                key={cost}
                                type="button"
                                onClick={() => setValue("coinCost", cost, { shouldValidate: true })}
                                className={`btn btn-sm ${watch("coinCost") === cost ? "btn-info text-white" : "btn-outline"}`}
                            >
                                <GiTwoCoins /> {cost}
                            </button>
                            ))}
                        </div>
                        {errors.coinCost && <span className="text-red-500 text-sm">{errors.coinCost.message}</span>}
                    </div>
                )}
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
            <button 
                type="button" 
                onClick={() => navigate(`/admin/books/${bookId}`)}
                className="btn btn-ghost"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                className="btn btn-info w-40"
                disabled={loading}
            >
                {loading ? <span className="loading loading-spinner"></span> : "Save Changes"}
            </button>
        </div>
      </form>
    </div>
  );
}

export default EditChapter;
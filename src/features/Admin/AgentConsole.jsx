import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

// Icons
import { RiRobot2Fill, RiSettings3Fill, RiFileUploadFill, RiCloseLine, RiInformationFill } from "react-icons/ri";
import { GiTwoCoins } from "react-icons/gi";
import { FaCheckCircle, FaArrowLeft, FaLock, FaUnlock, FaCloudUploadAlt, FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { MdPendingActions, MdErrorOutline } from "react-icons/md";
import { BsFillFileEarmarkWordFill } from "react-icons/bs";

// Validation Schema
const schema = yup.object().shape({
  startUrl: yup.string().url("Must be a valid URL").required("Start URL is required"),
  limit: yup.number().min(1).max(50).default(1),
  coinCost: yup.number().default(20),
  isLocked: yup.boolean().default(true),
});

function AgentConsole() {
  const { bookId } = useParams();
  const { auth } = useAuth();

  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [nextChapterNo, setNextChapterNo] = useState(1);

  // --- MISSION TRACKING STATE ---
  const [activeMissionId, setActiveMissionId] = useState(null);
  const [missionStatus, setMissionStatus] = useState("idle"); // idle, running, completed, failed
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // The 4 Core Metrics
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    total: 0,
    totalVocab: 0 
  });

  // --- VOCAB UPLOAD STATE ---
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [vocabFile, setVocabFile] = useState(null);
  const [isUploadingVocab, setIsUploadingVocab] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [showWarning, setShowWarning] = useState(true);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { limit: 1, coinCost: 20, isLocked: true }
  });

  const isLockedValue = watch("isLocked");

  // Load Book Details
  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const response = await api.get(`/books/${bookId}`);
        const bookData = response.data.data;
        setBook(bookData);
        setNextChapterNo(bookData.chapters ? bookData.chapters.length + 1 : 1);
        setLoadingBook(false);
      } catch (error) {
        console.error("Failed to load book for agent:", error);
      }
    };
    fetchBookDetails();
  }, [bookId]);

  // --- THE POLLING MECHANISM ---
  useEffect(() => {
    let pollInterval;

    const fetchMissionStatus = async () => {
      if (!activeMissionId) return;

      try {
        const response = await api.get(`/agent/mission/${activeMissionId}`, {
          headers: { Authorization: `Bearer ${auth?.token}` }
        });
        const data = response.data.mission;

        setStats({
          pending: data.pending,
          active: data.active,
          completed: data.completed,
          failed: data.failed,
          total: data.total
        });

        if (data.status === 'completed' || data.status === 'failed') {
          setMissionStatus(data.status);
          setActiveMissionId(null); // Stop polling
        }
      } catch (error) {
        console.error("Failed to fetch mission status:", error);
      }
    };

    // If a mission is running, poll every 3 seconds
    if (activeMissionId && missionStatus === "running") {
      pollInterval = setInterval(fetchMissionStatus, 3000);
    }

    return () => clearInterval(pollInterval);
  }, [activeMissionId, missionStatus, auth?.token]);

  // --- STOPWATCH LOGIC ---
  useEffect(() => {
    let interval;
    if (missionStatus === "running" && startTime) {
      interval = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [missionStatus, startTime]);


  // --- FIRE & FORGET HANDLER ---
  const handleRunAgent = async (data) => {
    setMissionStatus("running");
    setStartTime(Date.now());
    setElapsedMs(0);
    
    // Optimistically set stats based on input
    setStats({ pending: data.limit, active: 0, completed: 0, failed: 0, total: data.limit });

    try {
      const response = await api.post('/agent/bulk-inngest', { ...data, bookId }, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      
      // Save ID to trigger the polling effect
      setActiveMissionId(response.data.missionId);

    } catch (error) {
      console.error("Failed to start mission:", error);
      setMissionStatus("failed");
    }
  };

  // --- RETRY FAILED HANDLER ---
  const handleRetryFailed = async () => {
    setMissionStatus("running");
    setStartTime(Date.now());
    setElapsedMs(0);
    
    // Reset stats to 0 while we wait for the server to count the failed chapters
    setStats({ pending: 0, active: 0, completed: 0, failed: 0, total: 0, totalVocab: stats.totalVocab });

    try {
      const response = await api.post('/agent/retry-failed', { 
        bookId,
        coinCost: watch("coinCost"),
        isLocked: watch("isLocked")
      }, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      
      // Save ID to trigger the polling effect
      setActiveMissionId(response.data.missionId);

    } catch (error) {
      console.error("Failed to start retry mission:", error);
      setMissionStatus("idle");
      // Optional: You can swap this for a nice Toast notification if you have one installed
      alert(error.response?.data?.error || "No failed chapters found to retry.");
    }
  };

  // --- VOCAB HANDLERS ---
  const handleCloseModal = () => {
    setIsVocabModalOpen(false);
    setUploadStats(null);
    setUploadError(null);
    setVocabFile(null);
  };

  const handleVocabUpload = async (e) => {
    e.preventDefault();
    if (!vocabFile) return;

    const formData = new FormData();
    formData.append('file', vocabFile);
    formData.append('bookId', bookId);

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
      
      // this instantly update the UI count!
      setStats(prev => ({
        ...prev,
        totalVocab: prev.totalVocab + (response.data.stats.created || 0)
      }));

    } catch (error) {
      setUploadError(error.response?.data?.error || "Upload failed");
    } finally {
      setIsUploadingVocab(false);
    }
  };

  const formatDuration = (ms) => {
    if (!ms || isNaN(ms)) return "0s"; 
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hrs = Math.floor(minutes / 60);
    if (hrs > 0) return `${hrs}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loadingBook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-cyan-500"></span>
      </div>
    );
  }

  const progressPercent = stats.total > 0 ? Math.floor((stats.completed / stats.total) * 100) : 0;
  const isRunning = missionStatus === "running";

  return (
    <main className="min-h-screen text-gray-100 p-4 md:p-6">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-black/40 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex gap-4 items-start">
            <div className="relative shadow-xl w-20 overflow-hidden group">
              <div className="overflow-hidden aspect-[3/4]  w-full rounded-xl">
                <img src={book?.bookImage} alt={book?.title} className="object-cover h-full w-full rounded-xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <RiRobot2Fill className="text-cyan-400 text-3xl " />
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">
                  AI Translation Console
                </h1>
              </div>
              <h2 className="text-lg font-semibold text-white capitalize">{book?.title}</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="badge badge-outline badge-info gap-1 text-xs">
                  Next Chapter: Ch. {nextChapterNo}
                </div>
                <div className={`badge gap-1 text-xs ${isRunning ? 'badge-info' : missionStatus === 'completed' ? 'badge-success' : missionStatus === 'failed' ? 'badge-error' : 'badge-ghost'}`}>
                  {isRunning ? 'ACTIVE' : missionStatus === 'completed' ? 'COMPLETE' : missionStatus === 'failed' ? 'FAILED' : 'STANDBY'}
                </div>
              </div>
            </div>
          </div>

          <Link to={`/admin/books/${bookId}`} className="btn btn-sm btn-outline btn-ghost gap-2">
            <FaArrowLeft /> Back to Book
          </Link>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: CONFIG PANEL */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-gray-800/50 to-black/50 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <RiSettings3Fill className="text-cyan-400 text-xl" />
                <h2 className="text-lg font-bold text-cyan-400 uppercase tracking-wide">Config</h2>
              </div>
              <button onClick={() => setIsVocabModalOpen(true)} disabled={isRunning} className="btn btn-xs btn-outline btn-warning gap-1" title="Import Word Doc Vocab">
                <RiFileUploadFill /> Import Vocab
              </button>
            </div>

            {/* SYSTEM NOTICE BANNER */}
            {showWarning && (
              <div className="mb-5 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 relative">
                <button onClick={() => setShowWarning(false)} className="absolute top-2 right-2 text-yellow-500/50 hover:text-yellow-400">
                  <RiCloseLine />
                </button>
                <div className="flex gap-3">
                  <RiInformationFill className="text-yellow-500 text-xl shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-200/80">
                    <strong className="block text-yellow-400 mb-1">Pre-Flight Optimization</strong>
                    For the highest fidelity output, manually seed your core 10-15 vocab terms using the Import Vocab tool before initiating a bulk sequence.
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(handleRunAgent)} className="space-y-4">
              <div>
                <label className="label py-1">
                  <span className="label-text text-gray-300 text-xs">SOURCE URL (Start at Chapter {nextChapterNo})</span>
                </label>
                <input
                  {...register("startUrl")}
                  type="text"
                  placeholder="https://www.69shuba.com/..."
                  className="input input-sm w-full bg-black/60 border-cyan-500/10 focus:border-cyan-900 font-mono text-xs text-gray-300"
                  disabled={isRunning}
                />
                {errors.startUrl && <span className="text-red-400 text-xs mt-1 block">{errors.startUrl.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label py-1"><span className="label-text text-gray-300 text-xs">Batch Size</span></label>
                  <input {...register("limit")} type="number" className="input input-sm w-full bg-black/60 border-cyan-500/10 font-bold" disabled={isRunning} />
                </div>
                <div>
                  <label className="label py-1"><span className="label-text text-gray-300 text-xs">Coin Cost</span></label>
                  <div className="relative">
                    <GiTwoCoins className="absolute left-3 top-2.5 text-yellow-400 z-10" />
                    <input {...register("coinCost")} type="number" className="input input-sm w-full pl-9 bg-black/60 border-cyan-500/10 font-bold" disabled={isRunning} />
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-cyan-900 rounded-lg p-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input {...register("isLocked")} type="checkbox" className="checkbox checkbox-info checkbox-sm" disabled={isRunning} />
                  <div className="flex items-center gap-2">
                    {isLockedValue ? <FaLock className="text-red-500" /> : <FaUnlock className="text-green-500" />}
                    <span className="text-sm">{isLockedValue ? 'Premium Chapters' : 'Free Chapters'}</span>
                  </div>
                </label>
              </div>

              <button type="submit" disabled={isRunning} className={`btn w-full ${isRunning ? 'btn-disabled' : 'btn-info btn-outline'}`}>
                {isRunning ? (
                  <><span className="loading loading-spinner loading-sm"></span> Mission Active</>
                ) : (
                  <><RiRobot2Fill className="text-lg" /> Initiate Sequence</>
                )}
              </button>

              {/* NEW: RETRY BUTTON */}
              <button 
                type="button" 
                onClick={handleRetryFailed} 
                disabled={isRunning} 
                className={`btn w-full btn-sm mt-3 ${isRunning ? 'btn-disabled' : 'btn-error btn-outline border-red-900/50 hover:bg-red-900/20 text-red-400'}`}
              >
                <MdErrorOutline className="text-lg" /> Scan & Retry Failed
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: THE NEW TASK QUEUE DASHBOARD */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Top Metric Strip */}
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Batch Execution Status</h2>
              <p className="text-sm text-gray-400">Monitoring background translation queue.</p>
            </div>
            
            <div className="flex gap-8 text-right">
              {/* Restored Total Vocab Metric */}
              <div>
                <div className="text-3xl font-mono text-green-400 font-bold flex items-center justify-end gap-2">
                  <BsFillFileEarmarkWordFill className="text-green-500/50 text-xl" />
                  {stats.totalVocab}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Book Vocab</div>
              </div>

              {/* Elapsed Time Metric */}
              <div>
                <div className="text-3xl font-mono text-cyan-400 font-bold">
                  {formatDuration(elapsedMs)}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Elapsed Time</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-300 font-semibold">Overall Progress</span>
              <span className="text-cyan-400 font-bold">{stats.completed} / {stats.total} Chapters</span>
            </div>
            <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
              <div
                className={`h-full transition-all duration-500 ease-out relative overflow-hidden ${
                  missionStatus === 'failed' ? 'bg-red-600' : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              >
                {isRunning && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
              </div>
            </div>
          </div>

          {/* The 4-Card Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-black/40 border border-gray-600/50 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
              <MdPendingActions className="absolute -right-2 -bottom-2 text-6xl text-gray-600/10" />
              <div className="text-4xl font-bold text-gray-300 font-mono mb-1">{stats.pending}</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Pending</div>
            </div>

            <div className={`bg-black/40 border rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden transition-all ${stats.active > 0 ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-blue-900/30'}`}>
              <FaSpinner className={`absolute -right-2 -bottom-2 text-6xl text-blue-500/10 ${stats.active > 0 ? 'animate-spin' : ''}`} />
              <div className="text-4xl font-bold text-blue-400 font-mono mb-1">{stats.active}</div>
              <div className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold">Active</div>
            </div>

            <div className="bg-black/40 border border-green-900/50 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
              <FaCheckCircle className="absolute -right-2 -bottom-2 text-6xl text-green-500/10" />
              <div className="text-4xl font-bold text-green-400 font-mono mb-1">{stats.completed}</div>
              <div className="text-xs text-green-500/70 uppercase tracking-widest font-semibold">Completed</div>
            </div>

            <div className={`bg-black/40 border rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden transition-all ${stats.failed > 0 ? 'border-red-500 bg-red-900/10' : 'border-red-900/30'}`}>
              <MdErrorOutline className="absolute -right-2 -bottom-2 text-6xl text-red-500/10" />
              <div className={`text-4xl font-bold font-mono mb-1 ${stats.failed > 0 ? 'text-red-500' : 'text-red-900/50'}`}>{stats.failed}</div>
              <div className={`text-xs uppercase tracking-widest font-semibold ${stats.failed > 0 ? 'text-red-400' : 'text-red-900/50'}`}>Failed</div>
            </div>

          </div>
        </div>

        {/* VOCAB UPLOAD MODAL (Unchanged Logic) */}
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

      </div>
    </main>
  );
}

export default AgentConsole;
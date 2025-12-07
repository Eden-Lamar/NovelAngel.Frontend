import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import api from "../../api/axios";
import { CiLock, CiUnlock } from "react-icons/ci";
import { GiTwoCoins } from "react-icons/gi";
import { IoChevronBack } from "react-icons/io5";
import { startCase } from 'lodash';
// import { useAuth } from "../../context/AuthContext";

// Reuse the same schema as AddChapter
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

      setSuccess("Chapter updated successfully!");
      
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
      <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
        {error && (
            <div className="alert alert-error shadow-lg animate__animated animate__fadeInDown mb-2">
            <span>{error}</span>
            </div>
        )}
        {success && (
            <div className="alert alert-success shadow-lg animate__animated animate__fadeInDown mb-2">
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

        {/* Content Textarea */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold text-lg">Content</span>
          </label>
          <textarea
            {...register("content")}
            className={`textarea textarea-bordered w-full h-[600px] bg-slate-200 text-black placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-base leading-relaxed ${errors.content ? "textarea-error" : ""}`}
            placeholder="Write your chapter content here..."
          ></textarea>
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
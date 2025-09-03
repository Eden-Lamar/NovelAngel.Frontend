import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

// Define validation schema with Yup
const chapterSchema = yup.object().shape({
  title: yup.string().required("Title is required").min(3, "Too Short!").max(80, "Too Long!"),
  content: yup.string().required("Content is required").min(20, "Content must be at least 20 characters"),
  isLocked: yup.boolean(),
});

function AddChapter() {
  // Initialize form with React Hook Form
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm({
    resolver: yupResolver(chapterSchema),
		 defaultValues: {
			title: "",
			content: "",
			isLocked: false,
		},
  });

  // Get auth context and bookId from URL
  const { auth } = useAuth();
  const { bookId } = useParams();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [book, setBook] = useState(null);
  const [chapterCount, setChapterCount] = useState(0);
  const [fetchError, setFetchError] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch book details (including chapters)
  useEffect(() => {
    const fetchBookData = async () => {
      setFetchLoading(true); // Start loading
      try {
        const response = await axios.get(`http://localhost:3000/api/v1/books/${bookId}`);
        console.log("Book data fetched successfully:", response.data);
        if (!response.data.data) {
          throw new Error("Book data not found in response");
        }
        setBook(response.data.data);
        setChapterCount(response.data.data.chapters.length);
        setFetchError(null);
      } catch (err) {
        const errorMessage = err.response?.status === 404 
          ? "Book not found. Please check the book ID."
          : err.message || "Failed to load book details.";
        setFetchError(errorMessage);
        console.error("Error fetching book data:", errorMessage);
      } finally {
        setFetchLoading(false); // End loading
      }
    };
    fetchBookData();
  }, [bookId]);

  // Handle form submission
  const onSubmit = async (data) => {
    setLoading(true); // Show spinner
    try {
      const response = await axios.post(
        `http://localhost:3000/api/v1/admin/books/${bookId}/chapters`,
        {
          title: data.title,
          content: data.content,
          isLocked: data.isLocked,
        },
        {
          headers: {
            "Authorization": `Bearer ${auth?.token}`,
          },
        }
      );
      console.log("Chapter created successfully:", response.data);
      setSuccess("Chapter created successfully!");
      setError(null); // Clear any previous errors
      // Reset form field
      reset();
      // Update chapter count
      setChapterCount((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to create chapter. Please try again.";
      setError(errorMessage);
      console.error("Error creating chapter:", errorMessage);
      setSuccess(null); // Clear any previous success message
    } finally {
      setLoading(false); // Hide spinner
    }
  };

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (fetchError || success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
        setFetchError(null);
      }, 5000);
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [success, error, fetchError]);

  return (
    <div className="relative add-chapter-form p-6">
      {/* Display fetch error if book data fails to load */}
      {!fetchLoading && fetchError && (
        <div className="w-1/2 mt-3 mx-auto block animate__animated animate__fadeInDown">
          <div role="alert" className="alert alert-error">
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
            <span>{fetchError}</span>
          </div>
        </div>
      )}
      
      {/* Display success or error messages */}
      <div className={`fixed top-14 left-1/2 transform -translate-x-1/2 mt-3 w-1/2 ${success || error ? "block animate__animated animate__fadeInDown" : "hidden"}`} style={{ marginLeft: '-210px' }}>
        {success && (
          <div role="alert" className="alert alert-success w-full text-center">
            <svg
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div role="alert" className="alert alert-error w-full text-center">
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
      </div>
      <h2 className="text-2xl font-bold mb-4">Add Chapter {chapterCount + 1}</h2>

      <div className="flex space-x-5">
        {/* Display book details */}
        {!fetchLoading && book && (        
          <div className="card bg-base-50 image-full shadow-xl w-2/5 h-1/5">
            <figure>
              <img
                src={book.bookImage}
                alt={book.title}
                // height={100}
                // width={150}
                className="object-cover h-48 w-full"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title text-white">{book.title}</h2>
              <p className="text-white">Chapter {chapterCount + 1}</p>
              
            </div>
          </div>

        )}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 w-8/12 mx-auto">
          <div>
            <label htmlFor="title" className="block mb-1 font-semibold">Chapter Title</label>
            <input
              type="text"
              {...register("title")}
              className="w-full p-2 border rounded text-black outline-none bg-slate-200"
              disabled={fetchLoading || !!fetchError}
            />
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="content" className="block mb-1 font-semibold">Content</label>
            <textarea
              {...register("content")}
              className="w-full p-2 border rounded text-black outline-none bg-slate-200 h-[1056px]"
              disabled={fetchLoading || !!fetchError}

            />
            {errors.content && <p className="text-red-500">{errors.content.message}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isLocked")}
                className="checkbox checkbox-info"
                disabled={fetchLoading || !!fetchError}
              />
              <span>Lock Chapter (Premium Content)</span>
            </label>
            {errors.isLocked && <p className="text-red-500">{errors.isLocked.message}</p>}
          </div>

          <div className="flex justify-center">
            <button 
              type="submit" 
              className="btn btn-outline btn-info w-3/4 flex items-center gap-2  disabled:opacity-100 disabled:cursor-not-allowed"
              disabled={loading || fetchLoading || !!fetchError}
            >
              {loading && <span className="loading loading-spinner"></span>}
              Add Chapter
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

export default AddChapter;
// CreateBook.jsx
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Select } from "antd";
import "antd/dist/reset.css"; // Ensure Ant Design styles are imported
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const { Option } = Select;

const ALL_TAGS = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Romance', 'Sci-fi',
  'Horror', 'Thriller', 'Revenge', 'Female Protagonist', 'Fantasy',
  'Male Protagonist', 'Historical', 'Mystery', 'Supernatural', 'Mature'
];

// Define validation schema with Yup
const bookSchema = yup.object().shape({
  title: yup.string().required("Title is required").min(6, 'Too Short!').max(80, 'Too Long!'),
  author: yup.string().required("Author is required").min(3, 'Too Short!').max(50, 'Too Long!'),
  description: yup.string().required("Description is required").min(20, 'Too Short!').max(1000, 'Too Long!'),
  category: yup.string().required("Category is required"),
  country: yup.string().required("Country is required"),
  tags: yup.string().required("Tags are required"),
  bookImage: yup
    .mixed()
    .required("Book Image is required")
    .test("fileExists", "Book Image is required", (value) => value && value[0])
    .test("fileType", "Only image files (JPEG, PNG, GIF, WebP) are allowed", 
      (value) => value && value[0] && ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(value[0].type))
    .test("fileSize", "File size must be less than 3MB", 
      (value) => value && value[0] && value[0].size <= 3000000),
});

function CreateBook() {
  // Initialize form with React Hook Form
  const { 
    register, 
    handleSubmit, 
    control,
    setValue,
    reset,
    // getValues, 
    formState: { errors } 
  } = useForm({
    resolver: yupResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      category: "",
      country: "",
      tags: "Action",
      bookImage: null,
    },
  });
  
  const { auth } = useAuth(); // Get auth context for token
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const onSubmit = async (data) => {
    setLoading(true); // Show spinner
    console.log("Form data:", data);

    // Adjust form data for API compatibility
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("author", data.author);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("country", data.country)
    formData.append("tags", data.tags); // Already a comma-separated string
    formData.append("bookImage", data.bookImage[0]); // Send file

    try {
      const response = await api.post(
        "/admin/books",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${auth?.token}`,
          },
        }
      );
      console.log("Book created successfully:", response.data);
      setSuccess("Book created successfully!");
      setError(null); // Clear any previous errors
      reset(); // Reset form fields

      // Redirect to add-chapter with bookId
      setTimeout(() => {
        navigate(`/admin/add-chapter/${response.data.data._id}`);
      }, 3000); // Delay redirect to show success message

    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to create book. Please try again.";
      setError(errorMessage);
      console.error("Error creating book:", errorMessage);
      setSuccess(null); // Clear any previous success message
    } finally {
      setLoading(false); // Hide spinner
    }
  };
  
  // Clear success/error messages and redirect after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer); // Cleanup timer prolactin

    }
  }, [success, error]);

  return (
    <div className="create-book-form">
      {/* Display success or error messages */}
      <div className={`w-1/2 mt-3 mx-auto ${success || error ? "block animate__animated animate__fadeInDown" : "hidden"}`}>
        {success && (
          <div role="alert" className="alert alert-success">
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
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* FORM */}
      <h2 className="text-2xl font-bold mb-4">Create New Book</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
		
        <div>
          <label htmlFor="title" className="block mb-1 font-semibold">Title</label>
          <input
            type="text"
            {...register("title")}
            className="w-full p-2 border rounded text-black outline-none bg-slate-200"
          />
          {errors.title && <p className="text-red-500">{errors.title.message}</p>}
        </div>
		
        <div>
          <label htmlFor="author" className="block mb-1 font-semibold">Author</label>
          <input
            type="text"
            {...register("author")}
            className="w-full p-2 border rounded text-black outline-none bg-slate-200"
          />
          {errors.author && <p className="text-red-500">{errors.author.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block mb-1 font-semibold">Category</label>
          <select {...register("category")} className="w-full p-2 border rounded text-black outline-none bg-slate-200">
            <option value="">Select category</option>
            <option value="BL">BL</option>
            <option value="GL">GL</option>
            <option value="BG">BG</option>
            <option value="No CP">No CP</option>
          </select>
          {errors.category && <p className="text-red-500">{errors.category.message}</p>}
        </div>

        <div>
        <label htmlFor="country" className="block mb-1 font-semibold">Country</label>
        <select {...register("country")} className="w-full p-2 border rounded text-black outline-none bg-slate-200">
          <option value="">Select country</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
          <option value="South Korean">South Korean</option>
        </select>
        {errors.country && <p className="text-red-500">{errors.country.message}</p>}
      </div>

        <div>
          <label htmlFor="tags" className="block mb-1 font-semibold">Tags</label>
          <Controller
            name="tags"
            control={control}
            defaultValue={ALL_TAGS[0]}               // first tag as default (you had "Action")
            render={({ field }) => (
              <Select
                mode="tags"
                style={{ width: "100%" }}
                placeholder="Select or type tags…"
                onChange={(value) => {
                  const tagsString = value.join(","); // Convert array to comma-separated string
                  field.onChange(tagsString);
                  setValue("tags", tagsString); // Update form state
                }}
                value={field.value?.split(",") ?? []} // Convert comma-separated string back to array for Select
              >
                {ALL_TAGS.map((tag) => (
                  <Option key={tag} value={tag}>
                    {tag}
                  </Option>
                ))}
              </Select>
            )}
          />
          {errors.tags && <p className="text-red-500">{errors.tags.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block mb-1 font-semibold">Description</label>
          <textarea
            {...register("description")}
            className="w-full p-2 border rounded text-black outline-none bg-slate-200"
          />
          {errors.description && <p className="text-red-500">{errors.description.message}</p>}
        </div>
       
        <div>
          <label htmlFor="bookImage" className="block mb-1 font-semibold">Book Image</label>
          <input type="file" {...register("bookImage")} className="file-input file-input-bordered file-input-info file-input-lg w-full max-w-xs" />
            <p className="label text-white text-sm">Max size 3MB</p>

          {errors.bookImage && <p className="text-red-500">{errors.bookImage.message}</p>}
        </div>

        <div className="flex justify-center col-span-2">
          <button type="submit" className="btn btn-outline btn-info w-1/2 flex items-center gap-2 disabled:opacity-100 disabled:cursor-not-allowed" disabled={loading} >
            {loading && <span className="loading loading-spinner"></span>}
            Create Book
          </button>
        </div>
      </form>

    </div>
  );
}

export default CreateBook;

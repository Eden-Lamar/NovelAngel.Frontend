import { useState, useEffect, useRef  } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Select } from "antd";
import axios from "axios";
import { capitalize } from 'lodash';
import { useNavigate, useParams } from "react-router-dom";
import { FiUpload } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getCountryFlagCode } from "../../helperFunction";
import "antd/dist/reset.css";

const { Option } = Select;

const ALL_TAGS = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Romance', 'Sci-fi',
  'Horror', 'Thriller', 'Revenge', 'Female Protagonist', 'Fantasy',
  'Male Protagonist', 'Historical', 'Mystery', 'Supernatural', 'Mature'
];

const bookSchema = yup.object().shape({
  title: yup.string().required("Title is required").min(6, "Too Short!").max(80, "Too Long!"),
  author: yup.string().required("Author is required").min(3, "Too Short!").max(50, "Too Long!"),
  description: yup.string().required("Description is required").min(20, "Too Short!").max(1000, "Too Long!"),
  category: yup.string().required("Category is required"),
  country: yup.string().required("Country is required"),
  tags: yup.string().required("Tags are required"),
  status: yup.string().required("Status is required"),
  bookImage: yup
    .mixed()
    .nullable()
    .test("fileType", "Only image files (JPEG, PNG, GIF, WebP) are allowed", 
      (value) => !value || !value[0] || ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(value[0].type))
    .test("fileSize", "File size must be less than 3MB", 
      (value) => !value || !value[0] || value[0].size <= 3000000),
});

function EditBook() {
  const { auth } = useAuth();
  const { bookId } = useParams();
  const navigate = useNavigate();
	const prevObjectUrlRef = useRef(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [initialBookData, setInitialBookData] = useState(null); // Store initial book data

  const { register, handleSubmit, control, setValue, formState: { errors, isDirty }, watch } = useForm({
    resolver: yupResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      category: "",
      country: "",
      tags: "Action",
      status: "ongoing",
      bookImage: null,
    },
  });

  const { onChange: bookImageOnChange, ...bookImageProps } = register("bookImage"); // Extract and rename for clarity
  const bookImage = watch("bookImage"); // Watch bookImage field for changes
  const currentStatus = watch("status"); // Watch status for toggle
  const currentCountry = watch("country"); // Watch country for flag display


  // Fetch book data
  useEffect(() => {
    const fetchBook = async () => {
      setFetchLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/api/v1/books/${bookId}`);
        const book = response.data.data;
        setValue("title", book.title);
        setValue("author", book.author);
        setValue("description", book.description);
        setValue("category", book.category);
        setValue("country", book.country || "");
        setValue("tags", book.tags.join(","));
        setValue("status", book.status);
      
        // show existing image
        setPreviewUrl(book.bookImage || null);
        
        setInitialBookData({
          title: book.title,
          author: book.author,
          description: book.description,
          category: book.category,
          country: book.country || "",
          tags: book.tags.join(","),
          status: book.status,
          bookImage: book.bookImage || null,
        });

        setFetchLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load book details.");
        setFetchLoading(false);
      }
    };
    fetchBook();
		// cleanup of any created object URL on unmount
    return () => {
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
        prevObjectUrlRef.current = null;
      }
    };
  }, [bookId, setValue]);

  // Release previously created object URL, set new preview
  const handleLocalFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // revoke previous
    if (prevObjectUrlRef.current) {
      URL.revokeObjectURL(prevObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    prevObjectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  };

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Determine if the form has changes
  const hasImageChange = () => {
    if (!initialBookData) return false;
    if (bookImage && bookImage.length > 0) return true; // New image uploaded
    return false;
  };

  const isFormChanged = isDirty || hasImageChange();

  const handleStatusToggle = (e) => {
    const newStatus = e.target.checked ? "completed" : "ongoing";
    setValue("status", newStatus, { shouldDirty: true });
  };

  const onSubmit = async (data) => {
    setLoading(true);
		const formData = new FormData(); // ⬅️ create fresh instance here

    formData.append("title", data.title);
    formData.append("author", data.author);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("country", data.country);

    if (data.tags) {
		// backend expects stringified array in your code
    const tagsArray = [...new Set(data.tags.split(",").map(tag => tag.trim()).filter(tag => tag))];
    formData.append("tags", JSON.stringify(tagsArray))
		};

    formData.append("status", data.status);

		// Append file only if user selected a new one
		if (data.bookImage && data.bookImage.length > 0) {
			formData.append("bookImage", data.bookImage[0]);
		}

    try {
			// IMPORTANT: DO NOT set Content-Type header manually. Let the browser set boundary.
      const response = await axios.put(
        `http://localhost:3000/api/v1/admin/books/${bookId}`,
        formData,
        {
          headers: {
            // "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${auth?.token}`,
          },
        }
      );
      setSuccess("Book updated successfully!");
      setError(null);

			// Reload form values with updated book (instead of reset)
			const updated = response.data.data;
			setValue("title", updated.title);
			setValue("author", updated.author);
			setValue("description", updated.description);
			setValue("category", updated.category);
      setValue("country", updated.country || "");
			setValue("tags", updated.tags.join(","));
			setValue("status", updated.status);

			// ✅ Show the new image if updated  (or null if removed)
			setPreviewUrl(updated.bookImage || null);

      setInitialBookData({
        title: updated.title,
        author: updated.author,
        description: updated.description,
        category: updated.category,
        country: updated.country || "",
        tags: updated.tags.join(","),
        status: updated.status,
        bookImage: updated.bookImage || null,
      });

			// Redirect after a short delay
			setTimeout(() => navigate(`/admin/books/${bookId}`), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update book.");
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container p-4">
      {(success || error) && (
        <div >
          {success && (
            <div className="fixed left-auto lg:left-1/3 -translate-x-1/2 w-4/5 lg:w-1/2 z-50 animate__animated animate__fadeInDown">
                    <div role="alert" className="alert alert-info flex">
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
                </div>
          )}
          {error && (
            <div className="fixed top-16 left-auto lg:left-1/3 -translate-x-1/2 w-4/5 lg:w-1/2 z-50 animate__animated animate__fadeInDown">
                    <div role="alert" className="alert alert-error flex">
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
          </div>
          )}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 text-[#FFD700]">Edit Book</h2>
      {fetchLoading ? (
      <div className="space-y-6">
          {/* Image and Fields Side by Side */}
          <div className="grid grid-cols-3 gap-6">
            {/* Image Column - 1 column */}
            <div>
              <div className="skeleton h-4 w-16 mb-1"></div>
              <div className="skeleton aspect-[3/4] rounded-xl"></div>
            </div>
            {/* Form Fields Column - 2 columns */}
            <div className="col-span-2 space-y-2">
              {/* Title */}
              <div>
                <div className="skeleton h-4 w-16 mb-1"></div>
                <div className="skeleton h-10 w-full rounded-xl"></div>
              </div>
              {/* Author and Category (2-column grid) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="skeleton h-4 w-16 mb-1"></div>
                  <div className="skeleton h-10 w-full rounded-xl"></div>
                </div>
                <div>
                  <div className="skeleton h-4 w-16 mb-1"></div>
                  <div className="skeleton h-10 w-full rounded-xl"></div>
                </div>
              </div>
              {/* Country and Status (2-column grid) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="skeleton h-4 w-16 mb-1"></div>
                  <div className="skeleton h-10 w-full rounded-xl"></div>
                </div>
                <div>
                  <div className="skeleton h-4 w-16 mb-1"></div>
                  <div className="skeleton h-10 w-full rounded-xl"></div>
                </div>
              </div>
              {/* Tags */}
              <div>
                <div className="skeleton h-4 w-16 mb-1"></div>
                <div className="skeleton h-10 w-full rounded-xl"></div>
              </div>
              {/* Description */}
              <div>
                <div className="skeleton h-4 w-16 mb-1"></div>
                <div className="skeleton h-40 w-full rounded-xl"></div>
              </div>
            </div>
          </div>
          {/* Button Row */}
          <div className="flex justify-center">
            <div className="skeleton h-10 w-1/2 rounded-xl"></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">    
        {/* Main Content: Image and Fields Side by Side */}
        <div className="grid grid-cols-3 gap-6">
          {/* Image Column - Takes 1 column */}
          <div className="">
            <label htmlFor="bookImage" className="block mb-1 font-semibold text-white text-sm">Book Image</label>
            <div className="relative aspect-[3/4] sm:aspect-[2/2.5] md:aspect-[3/4] rounded-xl shadow-xl group overflow-hidden">
              <img
                src={previewUrl || "https://via.placeholder.com/120"}
                alt="Book preview"
                className="object-cover w-full h-full transform transition-transform duration-300 ease-in-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent bg-opacity-100"></div>
                
               {/* Status Badge */}
              <div className={`absolute top-2 left-2 text-white text-sm font-medium rounded-full px-2 py-1 ${currentStatus === 'ongoing' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                {capitalize(currentStatus)}
              </div>

              {/* Country Flag */}
              {currentCountry && (
                <div className="absolute bottom-3 left-4">
                  <div className="w-8 h-8 shadow-sm">
                    <img
                      src={`https://hatscripts.github.io/circle-flags/flags/${getCountryFlagCode(currentCountry)}.svg`}
                      alt={`${currentCountry} flag`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://hatscripts.github.io/circle-flags/flags/un.svg';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex justify-between items-center gap-2 bg-cyan-800/80 p-4 h-5 rounded-full">
                <input
                  type="file"
                  {...bookImageProps}
                  className="hidden"
                  id="bookImage"
                  accept="image/*"
                  onChange={(e) => {
                    bookImageOnChange(e); // Call RHF's onChange first
                    const files = e.target.files;
                    if (files && files.length > 0) handleLocalFileSelect(files);
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("bookImage").click()}
                  className="text-white text-sm hover:text-[#FFD700]"
                  aria-label="Upload new book image"
                >
                  <FiUpload />
                </button>
              
              </div>
            </div>
            <p className="text-white text-sm mt-1">Max size 3MB</p>
            {errors.bookImage && <p className="text-red-500">{errors.bookImage.message}</p>}
          </div>

          {/* Form Fields Column - Takes 2 columns */}
          <div className="col-span-2 space-y-2">
          <div>
            <label htmlFor="title" className="block mb-1 font-semibold text-white text-sm">Title</label>
            <input
              type="text"
              {...register("title")}
              className="w-full p-2 rounded-xl text-white outline-none focus:outline-[#FFD700] bg-[#090a0b]"
            />
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="author" className="block mb-1 font-semibold text-white text-sm">Author</label>
              <input
                type="text"
                {...register("author")}
                className="w-full py-2 px-2 rounded-xl text-white outline-none focus:outline-[#FFD700] bg-[#090a0b]"
              />
              {errors.author && <p className="text-red-500">{errors.author.message}</p>}
            </div>
            
            <div>
              <label htmlFor="category" className="block mb-1 font-semibold text-white text-sm">Category</label>
              <select {...register("category")} className="w-full p-2 rounded-xl text-white outline-none focus:outline-[#FFD700] bg-[#090a0b]">
                <option value="">Select category</option>
                <option value="BL">BL</option>
                <option value="GL">GL</option>
                <option value="BG">BG</option>
                <option value="No CP">No CP</option>
              </select>
              {errors.category && <p className="text-red-500">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="country" className="block mb-1 font-semibold text-white text-sm">Country</label>
              <select {...register("country")} className="w-full p-2 rounded-xl text-white outline-none focus:outline-[#FFD700] bg-[#090a0b]">
                <option value="">Select country</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="South Korean">South Korean</option>
              </select>
              {errors.country && <p className="text-red-500">{errors.country.message}</p>}
            </div>
            
            <div>
              <label htmlFor="status" className="block mb-1 font-semibold text-white text-sm">Status</label>
              <div className="flex items-center gap-3 p-2">
                <span className={`text-base ${currentStatus === 'ongoing' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  Ongoing
                </span>
                <input
                  type="checkbox"
                  checked={currentStatus === 'completed'}
                  onChange={handleStatusToggle}
                  className={`toggle ${currentStatus === 'completed' ? 'toggle-success' : 'toggle-warning'}`}
                />
                <span className={`text-base ${currentStatus === 'completed' ? 'text-green-400' : 'text-gray-400'}`}>
                  Completed
                </span>
              </div>
              {errors.status && <p className="text-red-500">{errors.status.message}</p>}
            </div>
          </div>
          
          <div>
            <label htmlFor="tags" className="block mb-1 font-semibold text-white text-sm">Tags</label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Select
                  mode="tags"
                  style={{ width: "100%" }}
                  className="w-full p-2 rounded-xl text-white outline-none focus:outline-[#FFD700] bg-[#090a0b]"
                  placeholder="Select or type tags…"
                  onChange={(value) => {
                    const tagsString = value.join(",");
                    field.onChange(tagsString);
                    setValue("tags", tagsString);
                  }}
                  value={field.value?.split(",") ?? []}
                >
                  {ALL_TAGS.map((tag) => (
                    <Option key={tag} value={tag}>{tag}</Option>
                  ))}
                </Select>
              )}
            />
            {errors.tags && <p className="text-red-500">{errors.tags.message}</p>}
          </div>

          
          <div>
            <label htmlFor="description" className="block mb-1 font-semibold text-white text-sm">Description</label>
            <textarea
              {...register("description")}
              className="w-full p-3 h-40 rounded-xl text-white outline-none focus:outline-[#FFD700] bg-[#090a0b]"
            />
            {errors.description && <p className="text-red-500">{errors.description.message}</p>}
          </div>
        </div>
        </div>

        {/* Button Row - Centered Below Both Columns */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="btn btn-outline btn-info w-1/2 flex items-center gap-2 disabled:opacity-100 disabled:cursor-not-allowed"
            disabled={loading || fetchLoading || !isFormChanged}
            aria-label="Save book changes"
          >
            {loading && <span className="loading loading-spinner"></span>}
            Save Changes
          </button>
        </div>
      </form>
      )}
    </div>
  );
}

export default EditBook;
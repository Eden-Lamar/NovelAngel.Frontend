// CreateBook.jsx
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Select } from "antd";
import "antd/dist/reset.css"; // Ensure Ant Design styles are imported

const { Option } = Select;

// Define validation schema with Yup
const bookSchema = yup.object().shape({
  title: yup.string().required("Title is required").min(6, 'Too Short!').max(80, 'Too Long!'),
  author: yup.string().required("Author is required").min(3, 'Too Short!').max(50, 'Too Long!'),
  description: yup.string().required("Description is required").min(20, 'Too Short!').max(200, 'Too Long!'),
  category: yup.string().required("Category is required"),
  tags: yup.string().required("Tags are required"),
  bookImage: yup.string().required("Book Image is required"),
});

function CreateBook() {
  // Initialize form with React Hook Form
  const { 
    register, 
    handleSubmit, 
    control,
    setValue,
    // getValues, 
    formState: { errors } 
  } = useForm({
    resolver: yupResolver(bookSchema),
  });

  // Handle form submission
  const onSubmit = (data) => {
    console.log("Form data:", data);

    // Adjust form data for API compatibility
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("author", data.author);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("tags", data.tags); // Already a comma-separated string
    formData.append("bookImage", data.bookImage[0]); // Send file
    console.log("FormData for API:", formData);

    // Here, you can use `fetch` or `axios` to send `formData` to the API
  };

  return (
    <div className="create-book-form">
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
            <option value="Translation">Translation</option>
            <option value="Original stories">Original stories</option>
            <option value="Fanfiction">Fanfiction</option>
          </select>
          {errors.category && <p className="text-red-500">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="tags" className="block mb-1 font-semibold">Tags</label>
          <Controller
            name="tags"
            control={control}
            defaultValue="Action"
            render={({ field }) => (
              <Select
                mode="tags"
                style={{ width: "100%" }}
                placeholder="e.g., Action, Romance, Adventure"
                onChange={(value) => {
                  const tagsString = value.join(","); // Convert array to comma-separated string
                  field.onChange(tagsString);
                  setValue("tags", tagsString); // Update form state
                }}
                value={field.value.split(",")} // Convert comma-separated string back to array for Select
              >
                {["Action", "Romance", "Adventure", "Fantasy", "Drama", "Revenge"].map((tag) => (
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

          {errors.bookImage && <p className="text-red-500">{errors.bookImage.message}</p>}
        </div>

        <div className="flex justify-center col-span-2">
          <button type="submit" className="btn btn-outline btn-info w-1/2">
            Create Book
          </button>
        </div>
      </form>

    </div>
  );
}

export default CreateBook;

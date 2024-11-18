// CreateBook.jsx
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Define validation schema with Yup
const bookSchema = yup.object().shape({
  title: yup.string().required("Title is required").min(6, 'Too Short!').max(80, 'Too Long!'),
  author: yup.string().required("Author is required").min(3, 'Too Short!').max(50, 'Too Long!'),
  description: yup.string().required("Description is required").min(20, 'Too Short!').max(200, 'Too Long!'),
  category: yup.string().required("Category is required"),
  tags: yup.string().required("Tags are required"),
//   bookImage: yup.string().required("Book Image is required"),
});

function CreateBook() {
  // Initialize form with React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(bookSchema),
  });

  // Handle form submission
  const onSubmit = (data) => {
    console.log("Form data:", data);
    // Implement form submission logic here, e.g., call an API endpoint
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
            className="w-full p-2 border rounded text-black outline-none"
          />
          {errors.title && <p className="text-red-500">{errors.title.message}</p>}
        </div>
		
        <div>
          <label htmlFor="author" className="block mb-1 font-semibold">Author</label>
          <input
            type="text"
            {...register("author")}
            className="w-full p-2 border rounded text-black outline-none"
          />
          {errors.author && <p className="text-red-500">{errors.author.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block mb-1 font-semibold">Category</label>
          <select {...register("category")} className="w-full p-2 border rounded text-black outline-none">
            <option value="">Select category</option>
            <option value="Translation">Translation</option>
            <option value="Original stories">Original stories</option>
            <option value="Fanfiction">Fanfiction</option>
          </select>
          {errors.category && <p className="text-red-500">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="tags" className="block mb-1 font-semibold">Tags</label>
          <input
            type="text"
            {...register("tags")}
            className="w-full p-2 border rounded text-black outline-none"
            placeholder="e.g., Action, Romance, Adventure"
          />
          {errors.tags && <p className="text-red-500">{errors.tags.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block mb-1 font-semibold">Description</label>
          <textarea
            {...register("description")}
            className="w-full p-2 border rounded text-black outline-none"
          />
          {errors.description && <p className="text-red-500">{errors.description.message}</p>}
        </div>

        <div className="col-span-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
            Create Book
          </button>
        </div>
      </form>

    </div>
  );
}

export default CreateBook;

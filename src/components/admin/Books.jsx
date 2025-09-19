import { useState, useEffect } from "react";
import axios from "axios";
import { capitalize, truncate, startCase } from 'lodash';
import Tippy from '@tippyjs/react';
import { FaHeart, FaRegEye, FaRegEdit } from 'react-icons/fa';
import { LuTrash2 } from "react-icons/lu";
import { Link } from "react-router-dom";
import { BiBookContent } from "react-icons/bi";
import 'tippy.js/dist/tippy.css';
import { useAuth } from "../../context/AuthContext";

function Books() {
    const { auth } = useAuth();
    const [books, setBooks] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        currentPage: 1,
        totalPages: 1
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
		const [deleteBookId, setDeleteBookId] = useState(null);
    const limit = 12; // Books per page

    // Fetch books with pagination
    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:3000/api/v1/books?page=${pagination.currentPage}&limit=${limit}`);
                console.log("Books response:", response.data);
                setBooks(response.data.data);
                setPagination({
                    total: response.data.pagination.total,
                    currentPage: response.data.pagination.currentPage,
                    totalPages: response.data.pagination.totalPages
                });
                setError(null);
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Failed to load books.";
                setError(errorMessage);
                console.error("Error fetching books:", errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, [pagination.currentPage]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, currentPage: page }));
        }
    };
    // console.log(books);
		
	// Handle book deletion
		const handleDelete = async () => {
        try {
            await axios.delete(`http://localhost:3000/api/v1/admin/books/${deleteBookId}`, {
                headers: { Authorization: `Bearer ${auth?.token}` }
            });
            setBooks(books.filter(book => book._id !== deleteBookId));
            setError(null);
            document.getElementById('delete-book-modal').close();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete book.");
        }
    };

    return (
        <main className="main-container p-4">
            <div className="main-title text-xl font-bold mb-4">
                <h3>All Books</h3>
            </div>

            {/* Error Alert */}
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

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(12).fill().map((_, index) => (
                        <div key={index} className="card card-side bg-base-100 shadow-xl glass w-full h-60">
                            <div className="skeleton h-60 w-1/2"></div>
                            <div className="card-body p-3 w-1/2">
                                <div className="skeleton h-6 w-3/4"></div>
                                <div className="skeleton h-4 w-1/2 mt-2"></div>
                                <div className="skeleton h-4 w-1/2 mt-2"></div>
                                <div className="flex gap-2 mt-2">
                                    <div className="skeleton h-8 w-16"></div>
                                    <div className="skeleton h-8 w-16"></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) :(
                    books.map((book) => (
                        <Link to={`/admin/books/${book._id}`} key={book._id} className="card card-side bg-base-100 shadow-xl glass group w-full h-60">
                            <figure className="relative overflow-hidden w-1/2 rounded-e-xl">
                                <img
                                    src={book.bookImage || 'https://via.placeholder.com/300x200'}
                                    alt={book.title}
                                    decoding="async"
                                    className="object-cover h-60 w-full transform transition-transform duration-300 ease-in-out group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-transparent to-transparent bg-opacity-100"></div>{/* Background overlay */}

                                {/* Edit/Delete overlay buttons */}
                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex justify-between opacity-100 transition-opacity duration-300 px-4 z-30">
                                    <Link
                                        to={`/admin/books/${book._id}/edit`}
                                        className="badge badge-outline text-blue-500 hover:bg-blue-500 hover:text-black hover:border-blue-500 transition-colors duration-300"
                                        aria-label="Edit book"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FaRegEdit />
                                    </Link>
                                    <button
                                        className="badge badge-outline text-red-500 hover:bg-red-500 hover:text-black hover:border-red-500 transition-colors duration-300"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteBookId(book._id);
                                            document.getElementById('delete-book-modal').showModal();
                                        }}
                                        aria-label="Delete book"
                                    >
                                        <LuTrash2 />
                                    </button>
                                </div>
                            </figure>
                            <div className="card-body p-3 w-1/2 flex flex-col justify-between">
                                <div className="">
                                    <Tippy content={startCase(book.title)} placement="top" arrow={false}>
                                        <h2 className="card-title text-base text-white cursor-pointer group-hover:text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">
                                            {truncate(startCase(book.title))}
                                        </h2>
                                    </Tippy>
                                </div>
                                <div className="text-xs max-w-full h-28 text-gray-300">
                                    {truncate(capitalize(book.description), {length:110})}
                                </div>
                                    <div className="flex justify-between">
                                        <p className="text-[#FFD700] text-sm flex items-center">
                                                <FaHeart className="mr-1" /> {book.likeCount || 0}
                                        </p>

                                        <p className="text-gray-400 text-sm flex items-center">
                                                <FaRegEye className="mr-1" /> {book.views || 0}
                                        </p>
                                        
                                        <p className="text-cyan-500 text-sm flex items-center">
                                                <BiBookContent className="mr-1" /> {book.chapters.length || 0}
                                        </p>
                                    </div>    
                                
                            </div>
                        </Link>
                    ))
                )}
            </div>

						<dialog id="delete-book-modal" className="modal">
                <div className="modal-box bg-base-100">
                    <h3 className="font-bold text-lg text-[#FFD700]">Confirm Deletion</h3>
                    <p className="py-4 text-white">Are you sure you want to delete this book? This will also delete all associated chapters.</p>
                    <div className="modal-action">
                        <button
                            className="btn btn-outline btn-error"
                            onClick={handleDelete}
                            aria-label="Confirm delete book"
                        >
                            Confirm
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={() => document.getElementById('delete-book-modal').close()}
                            aria-label="Cancel delete book"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </dialog>

            {/* Pagination Controls */}
            {!loading && (
                <div className="flex justify-center mt-6">
                    <div className="btn-group space-x-2">
                        <button
                            className="btn btn-outline"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                        >
                            Previous
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                key={page}
                                className={`btn btn-outline ${pagination.currentPage === page ? 'btn-active ' : ''}`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className="btn btn-outline"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Books;
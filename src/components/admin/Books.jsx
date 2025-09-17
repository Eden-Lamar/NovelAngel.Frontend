import { useState, useEffect } from "react";
import axios from "axios";
import { capitalize, truncate, startCase } from 'lodash';
import Tippy from '@tippyjs/react';
import { FaHeart, FaRegEye } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { BiBookContent } from "react-icons/bi";
import 'tippy.js/dist/tippy.css';

function Books() {
    const [books, setBooks] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        currentPage: 1,
        totalPages: 1
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                                <div className="skeleton h-4 w-1/2 mt-2"></div>
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
                                    className="object-cover h-60 w-full transform transition-transform duration-300 ease-in-out group-hover:scale-110"
                                />
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
                                <div className="flex">
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
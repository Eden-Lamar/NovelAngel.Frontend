import { useState, useEffect } from "react";
import api from "../../api/axios";
import { capitalize, truncate, startCase } from 'lodash';
import Tippy from '@tippyjs/react';
import { FaHeart, FaRegEye, FaRegEdit } from 'react-icons/fa';

import { LuTrash2, LuCalendarClock } from "react-icons/lu";
import { Link, useSearchParams } from "react-router-dom";
import { BiBookContent } from "react-icons/bi";
import 'tippy.js/dist/tippy.css';
import { useAuth } from "../../context/AuthContext";
import { getCountryFlagCode } from "../../helperFunction";


function Books() {
    const { auth } = useAuth();
    const [searchParams] = useSearchParams(); // NEW: Hook to get URL parameters
    const [books, setBooks] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        currentPage: 1,
        totalPages: 1
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteBookId, setDeleteBookId] = useState(null);

    // NEW: State for Auto-Unlock Modal
    const [selectedUnlockBook, setSelectedUnlockBook] = useState(null);
    const [isSavingUnlock, setIsSavingUnlock] = useState(false);
    const [unlockSettings, setUnlockSettings] = useState({
        isEnabled: false,
        count: 1,
        time: "00:00"
    });

    const limit = 12; // Books per page

		// NEW: Check if the URL has ?autoUnlock=true
    const isAutoUnlockFilter = searchParams.get("autoUnlock") === "true";

    // Fetch books with pagination
    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            try {
							// MODIFIED: Append autoUnlock parameter if it exists
                let url = `/books?page=${pagination.currentPage}&limit=${limit}`;
                if (isAutoUnlockFilter) {
                    url += `&autoUnlock=true`;
                }

                const response = await api.get(url);
                // console.log("Books response:", response.data);
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
                // console.error("Error fetching books:", errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, [pagination.currentPage, isAutoUnlockFilter]);

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
            await api.delete(`/admin/books/${deleteBookId}`, {
                headers: { Authorization: `Bearer ${auth?.token}` }
            });
            setBooks(books.filter(book => book._id !== deleteBookId));
            setError(null);
            document.getElementById('delete-book-modal').close();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete book.");
        }
    };

		// NEW: Open modal and populate with book's current settings
    const openUnlockModal = (book) => {
        setSelectedUnlockBook(book);
        setUnlockSettings({
            isEnabled: book.isAutoUnlockEnabled || false,
            count: book.autoUnlockCount || 1,
            time: book.autoUnlockTime || "00:00"
        });
        document.getElementById('auto-unlock-modal').showModal();
    };

    // NEW: Submit updated settings to backend
    const handleSaveUnlockSettings = async () => {
        setIsSavingUnlock(true);
        try {
            await api.patch(`/books/${selectedUnlockBook._id}/toggle-auto-unlock`, unlockSettings, {
                headers: { Authorization: `Bearer ${auth?.token}` }
            });
            
            // Update the local state so the UI reflects changes instantly without a refresh
            setBooks(books.map(b => 
                b._id === selectedUnlockBook._id 
                ? { ...b, isAutoUnlockEnabled: unlockSettings.isEnabled, autoUnlockCount: unlockSettings.count, autoUnlockTime: unlockSettings.time } 
                : b
            ));
            
            document.getElementById('auto-unlock-modal').close();
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update unlock settings.");
            document.getElementById('auto-unlock-modal').close();
        } finally {
            setIsSavingUnlock(false);
        }
    };

    return (
        <main className="main-container p-4">
            <div className="main-title text-xl font-bold mb-4">
                {/* MODIFIED: Dynamically change title and add a "Clear Filter" button */}
                <h3 className="text-xl font-bold text-[#FFD700] py-2">
                    {isAutoUnlockFilter ? "Auto-Unlocking Books" : "All Books"}
                </h3>
                
                {isAutoUnlockFilter && (
                    <Link to="/admin/books" className="btn btn-sm btn-outline btn-error">
                        Clear Filter
                    </Link>
                )}
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
                ): books.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-10 bg-gray-800/30 rounded-xl border border-gray-700">
                        <p className="text-gray-400 text-lg">No books found.</p>
                        {isAutoUnlockFilter && (
                            <p className="text-gray-500 text-sm mt-2">There are currently no books configured for daily auto-unlock.</p>
                        )}
                    </div>
                ) : (
                    books.map((book) => (
                        <div key={book._id} className="card card-side bg-base-100 shadow-xl glass group w-full h-60">
                            <figure className="relative overflow-hidden w-1/2 rounded-e-xl">
                                <img
                                    src={book.bookImage || 'https://via.placeholder.com/300x200'}
                                    alt={book.title}
                                    decoding="async"
                                    className="object-cover h-60 w-full transform transition-transform duration-300 ease-in-out group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-transparent to-transparent bg-opacity-100"></div>{/* Background overlay */}

                                {/* Edit/schedule/Delete overlay buttons */}
                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex justify-between opacity-100 transition-opacity duration-300 px-4 z-30 w-full">
                                    <Link
                                        to={`/admin/books/${book._id}/edit`}
                                        className="badge badge-outline text-blue-500 hover:bg-blue-500 hover:text-black hover:border-blue-500 transition-colors duration-300"
                                        aria-label="Edit book"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FaRegEdit />
                                    </Link>
																		
																		<button
                                        className={`badge badge-outline transition-colors duration-300 bg-black/50 ${book.isAutoUnlockEnabled ? 'text-green-400 hover:bg-green-400 border-green-400' : 'text-purple-400 hover:bg-purple-400 border-purple-400'} hover:text-black`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openUnlockModal(book);
                                        }}
                                        aria-label="Auto-unlock settings"
                                    >
                                        <LuCalendarClock  />
                                    </button>

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

                                 {/* Country Flag (bottom-left) */}
                                {book.country && (
                                    <div className="absolute bottom-2 left-2 w-6 h-6 shadow-sm">
                                    <img
                                        src={`https://hatscripts.github.io/circle-flags/flags/${getCountryFlagCode(book.country)}.svg`}
                                        alt={`${book.country} flag`}
                                        className="w-full h-full object-cover rounded-full"
                                        onError={(e) => {
                                        e.target.src = 'https://hatscripts.github.io/circle-flags/flags/un.svg';
                                        }}
                                    />
                                    </div>
                                )}
                            </figure>
                            <div className="card-body p-3 w-1/2 flex flex-col justify-between">
                                <div className="">
                                    <Tippy content={startCase(book.title)} placement="top" arrow={false}>
                                        <Link to={`/admin/books/${book._id}`}>
                                            <h2 className="card-title text-base text-white cursor-pointer group-hover:text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">
                                                {truncate(startCase(book.title))}
                                            </h2>
                                        </Link>
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
                        </div>
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

						{/* NEW: Auto-Unlock Settings Modal */}
            <dialog id="auto-unlock-modal" className="modal">
                <div className="modal-box bg-gray-900 border border-gray-700">
                    <h3 className="font-bold text-xl text-[#FFD700] mb-2">
                        Auto-Unlock Settings
                    </h3>
                    {selectedUnlockBook && (
                        <p className="text-gray-400 text-sm mb-6">
                            Configure daily releases for <span className="text-white italic">{selectedUnlockBook.title}</span>.
                        </p>
                    )}

                    <div className="space-y-6">
                        {/* Toggle Switch */}
                        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <div>
                                <span className="block text-white font-medium">Enable Auto-Unlock</span>
                                <span className="block text-xs text-gray-400 mt-1">Automatically release chapters on a schedule.</span>
                            </div>
                            <input 
                                type="checkbox" 
                                className="toggle toggle-success" 
                                checked={unlockSettings.isEnabled} 
                                onChange={(e) => setUnlockSettings({...unlockSettings, isEnabled: e.target.checked})} 
                            />
                        </div>

                        {/* Slide-down Configuration (Only visible if enabled) */}
                        <div className={`space-y-4 overflow-hidden transition-all duration-300 ${unlockSettings.isEnabled ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                            
                            {/* Chapter Count Input */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-gray-300 font-medium">Chapters to release per day</span>
                                </label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    className="input input-bordered bg-gray-800 text-white border-gray-700 focus:border-[#FFD700]" 
                                    value={unlockSettings.count} 
                                    onChange={(e) => setUnlockSettings({...unlockSettings, count: e.target.value})} 
                                />
                            </div>

                            {/* Time Picker Input */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-gray-300 font-medium">Release Time (WAT - Africa/Lagos)</span>
                                </label>
                                <input 
                                    type="time" 
                                    className="input input-bordered bg-gray-800 text-white border-gray-700 focus:border-[#FFD700] [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" 
                                    value={unlockSettings.time} 
                                    onChange={(e) => setUnlockSettings({...unlockSettings, time: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-action mt-8">
                        <button 
                            className="btn bg-[#FFD700] text-black hover:bg-yellow-500 border-none w-32" 
                            onClick={handleSaveUnlockSettings}
                            disabled={isSavingUnlock}
                        >
                            {isSavingUnlock ? <span className="loading loading-spinner"></span> : "Save"}
                        </button>
                        <button 
                            className="btn btn-outline text-gray-300 hover:bg-gray-800" 
                            onClick={() => document.getElementById('auto-unlock-modal').close()}
                            disabled={isSavingUnlock}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </dialog>

        </main>
    );
}

export default Books;
import { useState, useEffect } from "react";
import {BsPeopleFill } from "react-icons/bs"
import { ImBooks } from "react-icons/im";
import { GrInProgress } from "react-icons/gr";
import { IoCheckmarkDoneCircle } from "react-icons/io5"
import axios from "axios";
import { Link } from "react-router-dom";
import { startCase, truncate } from 'lodash';
import { useAuth } from "../context/AuthContext";


function AdminDashboard() {
    const { auth } = useAuth(); // Get auth context for token
    const [stats, setStats] = useState({
        totalBooks: 0,
        ongoingBooks: 0,
        completedBooks: 0,
        totalCustomers: 0
    });
    const [books, setBooks] = useState([]);
    const [booksError, setBooksError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

     // Fetch dashboard stats
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [statsResponse, booksResponse] = await Promise.all([
                    axios.get("http://localhost:3000/api/v1/admin/dashboard", {
                        headers: {
                            Authorization: `Bearer ${auth?.token}`,
                            "Cache-Control": "no-cache"
                        }
                    }),
                    axios.get("http://localhost:3000/api/v1/books?limit=6", {
                        headers: {
                            "Cache-Control": "no-cache"
                        }
                    })
                ]);

                console.log("Dashboard stats response:", statsResponse.data);
                console.log("Books response:", booksResponse.data);
                setStats(statsResponse.data.data);
                setBooks(booksResponse.data.data);
                setError(null);
                setBooksError(null);
            } catch (err) {
                if (err.response?.config?.url.includes("/admin/dashboard")) {
                    const errorMessage = err.response?.data?.error || "Failed to load dashboard stats.";
                    setError(errorMessage);
                    console.error("Error fetching dashboard stats:", errorMessage);
                } else {
                    const errorMessage = err.response?.data?.message || "Failed to load books.";
                    setBooksError(errorMessage);
                    console.error("Error fetching books:", errorMessage);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [auth?.token]);

    // Clear error messages after 5 seconds
    useEffect(() => {
        if (error || booksError) {
            const timer = setTimeout(() => {
                setError(null);
                setBooksError(null);
            }, 5000);
            return () => clearTimeout(timer); // Cleanup on unmount or new error
        }
    }, [error, booksError]);

    return (
	<main className="main-container">
        <div className="main-title text-xl font-bold">
            <h3>DASHBOARD</h3>
        </div>

    {/* Error Alert */}
    {(error || booksError) && (
        <div className="fixed top-16 left-1/3 -translate-x-1/2 w-1/2 z-50 animate__animated animate__fadeInDown">
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
                <span>{error || booksError}</span>
            </div>
        </div>
    )}

    <div className='main-cards'>
            <div className='card p-4 bg-blue-800'>
                <div className='flex justify-between items-center text-2xl'>
                    <h3 className="text-lg font-semibold">BOOKS</h3>
                    <ImBooks className='card_icon'/>
                </div>
                <div className="mt-8">
                    {loading ? (
                        <div className="skeleton h-10 w-16"></div>
                    ) : (
                        <h1 className="text-3xl font-bold">{stats.totalBooks}</h1>
                    )}
                </div>
            </div>

            <div className='card p-4 bg-yellow-600'>
                <div className='flex justify-between items-center text-xl'>
                    <h3 className="text-lg font-semibold">ONGOING</h3>
                    <GrInProgress className='card_icon'/>
                </div>
                <div className="mt-8">
                    {loading ? (
                        <div className="skeleton h-10 w-16"></div>
                    ) : (
                        <h1 className="text-3xl font-bold">{stats.ongoingBooks}</h1>
                    )}
                </div>
            </div>

            <div className='card p-4 bg-green-700'>
                <div className='flex justify-between items-center text-2xl'>
                    <h3 className="text-lg font-semibold">COMPLETED</h3>
                    <IoCheckmarkDoneCircle className='card_icon'/>
                </div>
                <div className="mt-8">
                    {loading ? (
                        <div className="skeleton h-10 w-16"></div>
                    ) : (
                        <h1 className="text-3xl font-bold">{stats.completedBooks}</h1>
                    )}
                </div>
            </div>

            <div className='card p-4 bg-rose-800'>
                <div className='flex justify-between items-center text-2xl'>
                    <h3 className="text-lg font-semibold">CUSTOMERS</h3>
                    <BsPeopleFill className='card_icon'/>
                </div>
                <div className="mt-8">
                    {loading ? (
                        <div className="skeleton h-10 w-16"></div>
                    ) : (
                        <h1 className="text-3xl font-bold">{stats.totalCustomers}</h1>
                    )}
                </div>
            </div>
        </div>

        {/* Recent Books Section */}
            <div className="mt-10">
                <h3 className="text-xl font-bold mb-4">Recent Books</h3>
                <div className="flex flex-row gap-4 overflow-x-auto scrollbar-hidden">
                    {loading ? (
                        Array(6).fill().map((_, index) => (
                            <div key={index} className="card bg-base-50 shadow-xl w-48 h-64 flex-shrink-0">
                                <div className="skeleton h-40 w-full"></div>
                                <div className="card-body p-4">
                                    <div className="skeleton h-6 w-3/4"></div>
                                    <div className="skeleton h-4 w-1/2 mt-2"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        books.map((book) => (
                            <div key={book._id} className="card bg-base-50 image-full shadow-xl w-48 h-72 flex-shrink-0 group">
                                <figure className="relative overflow-hidden">
                                    <img
                                        src={book.bookImage}
                                        alt={book.title}
                                        className="object-cover h-40 w-full transform transition-transform duration-300 ease-in-out group-hover:scale-110"
                                    />
                                </figure>
                                <div className="card-body p-4">
                                    <h2 className="card-title text-white text-base">{truncate(startCase(book.title))}</h2>
                                    <p className="text-white text-sm">Chapters: {book.chapters.length}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <Link to="/admin/books" className="btn btn-outline btn-info flex-shrink-0 self-center ml-4">
                        Show More
                    </Link>
                </div>
            </div>

    </main>
    )
}

export default AdminDashboard
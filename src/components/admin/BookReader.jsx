import { useState, useEffect } from "react";
import axios from "axios";
import { startCase } from 'lodash';
import { useParams, useSearchParams, Link } from "react-router-dom";
import { FaBookOpen, FaLock } from "react-icons/fa";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import 'animate.css';
import { useAuth } from "../../context/AuthContext";

function BookReader() {
		const { auth } = useAuth(); // Get auth context for token
    const { bookId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const chapterId = searchParams.get('chapterId');
    const [chapterData, setChapterData] = useState(null);
    const [bookChapters, setBookChapters] = useState([]);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(-1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
			console.log("book:", bookChapters, "chapter:", chapterData);

    // Fetch book and chapter details
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch book to get chapters array
                const bookResponse = await axios.get(`http://localhost:3000/api/v1/books/${bookId}`, {
                    headers: { Authorization: `Bearer ${auth?.token}` }
                });
                setBookChapters(bookResponse.data.data.chapters);

                // Fetch chapter if chapterId is provided
                if (chapterId) {
                    const chapterResponse = await axios.get(`http://localhost:3000/api/v1/books/${bookId}/chapters/${chapterId}`, {
                        headers: { Authorization: `Bearer ${auth?.token}` }
                    });
                    setChapterData(chapterResponse.data.data);
                    const index = bookResponse.data.data.chapters.findIndex(ch => ch._id === chapterId);
                    setCurrentChapterIndex(index);
                } else {
                    // Default to first chapter
                    const firstChapter = bookResponse.data.data.chapters[0];
                    if (firstChapter) {
                        const chapterResponse = await axios.get(`http://localhost:3000/api/v1/books/${bookId}/chapters/${firstChapter._id}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        });
                        setChapterData(chapterResponse.data.data);
                        setCurrentChapterIndex(0);
                        setSearchParams({ chapterId: firstChapter._id });
                    }
                }
                setError(null);
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Failed to load chapter.";
                setError(errorMessage);
                console.error("Error fetching data:", errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [bookId, chapterId, setSearchParams, auth?.token]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Navigate to previous/next chapter
    const handleNavigation = (direction) => {
        const newIndex = direction === 'next' ? currentChapterIndex + 1 : currentChapterIndex - 1;
        if (newIndex >= 0 && newIndex < bookChapters.length) {
            setSearchParams({ chapterId: bookChapters[newIndex]._id });
        }
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <main className="main-container p-4">
            {/* Error Alert */}
            {error && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 w-1/2 z-50 animate__animated animate__fadeInDown">
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
                </div>
            )}

            <div className="flex flex-col gap-6">
                {/* Header */}
                {loading ? (
                    <div className="flex justify-between items-center">
                        <div className="skeleton h-8 w-3/4"></div>
                        <div className="skeleton h-10 w-24"></div>
                    </div>
                ) : chapterData ? (
                    <div className="group">
											<Link to={`/admin/books/${bookId}`} className="flex items-center">
												<RiArrowLeftSLine className="text-[#FFD700] text-2xl mt-1 group-hover:mr-2 transition-all duration-200" />
                        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">
                            {startCase(chapterData.bookTitle)}
                        </h2>
											</Link>
                    </div>
                ) : null}

                {/* Chapter Content */}
                <div className="card w-full p-4 border border-blue-500 shadow-md shadow-cyan-500/50 bg-custom-striped">
                    {loading ? (
                        <div className="card-body p-4">
                            <div className="skeleton h-6 w-1/2 mb-2"></div>
                            <div className="skeleton h-4 w-3/4 mb-2"></div>
                            <div className="skeleton h-32 w-full mb-4"></div>
                            <div className="flex justify-between">
                                <div className="skeleton h-10 w-24"></div>
                                <div className="skeleton h-10 w-24"></div>
                            </div>
                        </div>
                    ) : chapterData && chapterData.chapter ? (
                        <div className="card-body p-4">
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center w-8 h-8 border-2 ${chapterData.chapter.isLocked ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-cyan-500 shadow-lg shadow-cyan-500/50'} rounded-full`}>
                                    {chapterData.chapter.isLocked ? (
                                        <FaLock className="text-red-500 text-sm" />
                                    ) : (
                                        <FaBookOpen className="text-blue-500 text-sm" />
                                    )}
                                </div>
                                <h3 className="text-2xl font-semibold text-[#FFD700]">
                                    Chapter {chapterData.chapter.chapterNo}: {startCase(chapterData.chapter.title)}
                                </h3>
                            </div>
                            <p className="text-sm text-[#b9b9b9]">
                                Released: {formatDate(chapterData.chapter.createdAt)}
                            </p>
                            {chapterData.chapter.isLocked ? (
                                <div className="mt-4 text-center text-red-500">
                                    <FaLock className="inline-block text-2xl mb-2" />
                                    <p>This chapter is locked. Please unlock to continue reading.</p>
                                </div>
                            ) : (
                                <p className="text-white text-xl mt-4 whitespace-pre-wrap">
                                    {chapterData.chapter.content}
                                </p>
                            )}
                            <div className="flex justify-between mt-4">
                                <button
                                    className="btn btn-outline btn-info"
                                    onClick={() => handleNavigation('prev')}
                                    disabled={currentChapterIndex <= 0}
                                >
																	<RiArrowLeftSLine className="text-xl"/>
                                    Previous Chapter
                                </button>
                                <button
                                    className="btn btn-outline btn-info"
                                    onClick={() => handleNavigation('next')}
                                    disabled={currentChapterIndex >= bookChapters.length - 1}
                                >
                                    Next Chapter
																	<RiArrowRightSLine className="text-xl"/>
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </main>
    );
}

export default BookReader;
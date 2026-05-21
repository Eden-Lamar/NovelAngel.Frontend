import { useState, useEffect } from "react";
import api from "../../api/axios";
import { startCase, truncate, capitalize } from 'lodash';
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaHeart, FaRegEye, FaBookOpen, FaBookReader, FaLock, FaUnlock, FaEdit, FaBookmark } from "react-icons/fa";
import { RiArrowDownWideFill, RiStickyNoteAddFill, RiFileEditFill, RiRobot2Fill } from "react-icons/ri";
import { LuTrash2 } from "react-icons/lu";
import { GiTwoCoins } from "react-icons/gi";
// import { PiBooksDuotone } from "react-icons/pi";
// import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { useAuth } from "../../context/AuthContext";
import { getCountryFlagCode } from "../../helperFunction";

function BookDetails() {
    const { id } = useParams();
		const { auth } = useAuth();
		const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
		const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
		const [deleteLoading, setDeleteLoading] = useState(false);

		// NEW: State for Auto-Unlock Modal
    const [isSavingUnlock, setIsSavingUnlock] = useState(false);
    const [unlockSettings, setUnlockSettings] = useState({
        isEnabled: false,
        count: 1,
        time: "00:00"
    });

    const [prevLikeCount, setPrevLikeCount] = useState(null); // Stores prevIsLiked and prevCount to revert on failure.

    // Fetch book details and like/bookmark status
    useEffect(() => {
        const fetchBook = async () => {
            setLoading(true);
            try {
                const [bookResponse, likeResponse, bookmarkResponse] = await Promise.all([
                    api.get(`/books/${id}`),
                    auth?.token
                        ? api.get(`/books/${id}/like-status`, {
														headers: { Authorization: `Bearer ${auth?.token}` }
												})
                        : Promise.resolve({ data: { isLiked: false } }),
                    auth?.token
                        ? api.get(`/books/${id}/bookmark-status`, {
                              headers: { Authorization: `Bearer ${auth?.token}` }
                          })
                        : Promise.resolve({ data: { isBookmarked: false } })
                ]);
                // console.log("Book details response:", bookResponse.data);
                setBook(bookResponse.data.data);
                setIsLiked(likeResponse.data.isLiked);
                setIsBookmarked(bookmarkResponse.data.isBookmarked);
                setPrevLikeCount(bookResponse.data.data.likeCount);
                setError(null);
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Failed to load book details.";
                setError(errorMessage);
                // console.error("Error fetching book details:", errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id, auth?.token]);
				
    // Clear error after 10 seconds
    useEffect(() => {
			if (error) {
				const timer = setTimeout(() => setError(null), 10000);
				return () => clearTimeout(timer);
			}
    }, [error]);
		
		
		// Toggle Like
		const handleToggleLike = async () => {
			if (!auth?.token) {
            setError("Please log in to like this book.");
            navigate('/login', { state: { from: `/admin/books/${id}` } });
            return;
        }
        setLikeLoading(true);
        const prevIsLiked = isLiked;
        const prevCount = book.likeCount;
        // Optimistic update
        setIsLiked(!isLiked);
        setBook((prev) => ({
            ...prev,
            likeCount: isLiked ? prev.likeCount - 1 : prev.likeCount + 1
			}));

			try {
				const response = await api.post(
					`/books/${id}/toggle-like`,
					{},
					{ headers: { Authorization: `Bearer ${auth?.token}` } }
				);
					setError(null);
					setPrevLikeCount(response.data.likeCount);
			}  catch (err) {
					// Revert on failure
					setIsLiked(prevIsLiked);
					setBook((prev) => ({ ...prev, likeCount: prevCount }));
					setError(err.response?.data?.error || "Failed to toggle like.");
        } finally {
					setLikeLoading(false);
        }
		};
		
		// Toggle Bookmark
		const handleToggleBookmark = async () => {
			if (!auth?.token) {
            setError("Please log in to bookmark this book.");
            navigate('/login', { state: { from: `/admin/books/${id}` } });
            return;
        }
        setBookmarkLoading(true);
        const prevIsBookmarked = isBookmarked;
        setIsBookmarked(!isBookmarked);
        try {
            await api.post(
                `/books/${id}/toggle-bookmark`,
                {},
                { headers: { Authorization:  `Bearer ${auth?.token}` } }
            );
            setError(null);
        } catch (err) {
            setIsBookmarked(prevIsBookmarked);
            setError(err.response?.data?.error || "Failed to toggle bookmark.");
        } finally {
            setBookmarkLoading(false);
        }
		};

		// Delete book
		const handleDelete = async () => {
			setDeleteLoading(true);
			try {
					await api.delete(`/admin/books/${id}`, {
							headers: { Authorization: `Bearer ${auth?.token}` }
					});
					setError(null);
					document.getElementById('delete-book-modal').close();
					navigate('/admin/books');
			} catch (err) {
					setError(err.response?.data?.error || "Failed to delete book.");
					setDeleteLoading(false);
			}
    };

		// NEW: Open modal and populate with book's current settings
    const openUnlockModal = () => {
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
            await api.patch(`/books/${id}/toggle-auto-unlock`, unlockSettings, {
                headers: { Authorization: `Bearer ${auth?.token}` }
            });
            // Update the local state with the new values
            setBook((prev) => ({
                ...prev,
                isAutoUnlockEnabled: unlockSettings.isEnabled,
                autoUnlockCount: unlockSettings.count,
                autoUnlockTime: unlockSettings.time
            }));
            document.getElementById('auto-unlock-modal').close();
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to toggle auto-unlock.");
        } finally {
            setIsSavingUnlock(false);
        }
    };

    // Calculate free and locked chapters
    const getChapterStats = (chapters) => {
        // return freeChapters
        const free = chapters.filter(ch => ch.isLocked === false).length;

        const locked = chapters.length - free;
        return { free, locked };
    };

    // Format release date get just the year and the full date
    const formatDate = (date) => {
        const fullDate = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const year = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric'
        });
        return { fullDate, year }
    };
		console.log(prevLikeCount);
    return (
        <main className="main-container p-4">
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

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Div: Image and Details */}
                <div className="w-full lg:w-1/3 flex flex-col gap-2">
                    {/* Book Image Card */}
                    {loading ? (
                        /* Skeleton Loader */
                        <div className="relative aspect-[3/4] sm:aspect-[2/2.5] md:aspect-[3/4] rounded-xl shadow-xl overflow-hidden">
                            <div className="skeleton w-full h-full"></div>
                            <div className="absolute top-2 left-2 skeleton h-6 w-16 rounded-full"></div>
                            <div className="flex justify-between absolute bottom-0 left-0 p-4 w-full">
                                <div className="skeleton h-4 w-12"></div>
                                <div className="skeleton h-4 w-12"></div>
                            </div>
                        </div>
                    ) : book ? (
                        <div className="relative aspect-[3/4] sm:aspect-[2/2.5] md:aspect-[3/4] rounded-xl shadow-xl group overflow-hidden">
                                <img
                                    src={book.bookImage}
                                    alt={book.title}
                                    width={300}
                                    height={400}
                                    decoding="async"
                                    className="object-cover w-full h-full transform transition-transform duration-300 ease-in-out group-hover:scale-105"
                                />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent bg-opacity-100"></div>

														{/* Badge for book status */}
                            <div className={`absolute top-2 left-2 text-white text-sm font-medium rounded-full px-2 py-1 ${ book.status === 'ongoing' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                                {capitalize(book.status)}
                            </div>
                                
                                {/* Views and Likes div */}
                            <div className="flex justify-between absolute bottom-0 left-0 p-4 w-full">
                                <p className="text-[#FFD700] text-sm sm:text-base md:text-lg flex items-center">
                                    <FaHeart className="mr-1" /> {book.likeCount || 0}
                                </p>
                                <p className="text-gray-400 text-sm sm:text-base md:text-lg flex items-center">
                                    <FaRegEye className="mr-1" /> {book.views || 0}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {/* Tags */}
                    {loading ? (
                        /* Skeleton Loader */
                        <div className="flex gap-2 flex-wrap w-full p-2">
                            {Array(3).fill().map((_, index) => (
                                <div key={index} className="skeleton h-6 w-16 rounded-xl badge-outline"></div>
                            ))}
                        </div>
                    ) : book ? (
                        <div className="flex gap-2 flex-wrap w-full p-2">
                            {book.tags.map((tag, index) => (
                                <span key={index} className="badge badge-outline badge-primary shadow-xl font-medium">{startCase(tag)}</span>
                            ))}
                        </div>
                    ) : null}

                    {/* Book Details Card */}
                    {loading ? (
                        /* Skeleton Loader */
                        <div className="card w-full p-4 border-2 border-blue-500 shadow-md shadow-cyan-500/50">
                            <div className="card-body sm:grid grid-cols-2 gap-4 p-1">
                                {Array(6).fill().map((_, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="skeleton h-4 w-16"></div>
                                        <div className="skeleton h-4 w-24"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="card-actions justify-end mt-2">
                                <div className="skeleton h-10 w-32"></div>
                            </div>
                        </div>
                    ) : book ? (
                        <div className="card w-full p-4 border-2 border-cyan-500 shadow-md shadow-cyan-500/50">
                            <div className="card-body sm:grid grid-cols-2 gap-4 p-1 rounded-xl">
                                <div className="space-y-1">
                                <p className="text-sm text-[#afafaf]">Author</p><p className="font-medium text-sm 2xl:text-sm">{startCase(book.author)}
                                </p>
                                </div>

                                <div className="space-y-1">
                                <p className="text-sm text-[#afafaf]">Released</p><p className="font-medium text-sm 2xl:text-sm">{formatDate(book.createdAt).year}</p>
                                </div>

                                <div className="space-y-1">
                                <p className="text-sm text-[#afafaf]">Chapters</p><p className="font-medium  text-sm 2xl:text-sm">{book.chapters.length}</p>
                                </div>

                                <div className="space-y-1">
                                <p className="text-sm text-[#afafaf]">Free Chapters</p><p className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-gold to-blue-500 text-sm 2xl:text-sm">{getChapterStats(book.chapters).free}</p>
                                </div> 
                            
                                <div className="space-y-1">
                                    <p className="text-sm text-[#afafaf]">Category</p><p className="font-medium  text-sm 2xl:text-sm">{startCase(book.category)}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm text-[#afafaf]">Uploaded By</p><p className="font-medium  text-sm 2xl:text-sm">{startCase(book.uploadedBy.username)}</p>
                                </div>

																{/* MODIFIED: Added dynamic text for the new time/count fields */}
                                <div className="space-y-1 col-span-2 mt-2 pt-2 border-t border-gray-700/50">
                                    <p className="text-sm text-[#afafaf]">Daily Auto-Unlock</p>
                                    <p className={`font-medium text-sm 2xl:text-sm ${book.isAutoUnlockEnabled ? 'text-green-400' : 'text-gray-500'}`}>
																			{book.isAutoUnlockEnabled ? `Active (${book.autoUnlockCount || 1} chapter(s) daily at ${book.autoUnlockTime || '00:00'})` : 'Inactive'}
                                    </p>
                                </div>

                            </div>

                            <div>

												<div className="card-actions mt-2 flex items-center justify-between">
													{/* Country Flag */}
													{book.country && (
														<div className="w-8 h-8">
															<img
																src={`https://hatscripts.github.io/circle-flags/flags/${getCountryFlagCode(book.country)}.svg`}
																alt={`${book.country} flag`}
																className="w-full h-full object-cover rounded-full"
																onError={(e) => {
																	e.target.src =
																		'https://hatscripts.github.io/circle-flags/flags/un.svg';
																}}
															/>
														</div>
													)}

                        {/* Start Reading button */}
                                    <Link to={`/admin/books/${book._id}/read`} className="btn btn-outline btn-info flex items-center">
                                        <FaBookOpen className="mr-2" /> Start Reading
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : null}

										<div className="card-actions justify-between mt-2">
                                <button
                                    className={`btn  ${isBookmarked ? 'btn-success' : 'btn-outline'}  flex items-center whitespace-nowrap animate__animated ${bookmarkLoading ? '' : 'animate__pulse'}`}
                                    onClick={handleToggleBookmark}
                                    disabled={bookmarkLoading || !auth?.token}
                                    aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                                >
                                    {bookmarkLoading ? (
                                        <span className="loading loading-spinner"></span>
                                    ) : (
                                        <FaBookmark className="" />
                                    )}
                                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                                </button>
                                <button
                                    className={`btn btn-outline ${isLiked ? 'btn-error' : 'btn'} btn flex items-center whitespace-nowrap animate__animated ${likeLoading ? '' : 'animate__pulse'}`}
                                    onClick={handleToggleLike}
                                    disabled={likeLoading || !auth?.token}
                                    aria-label={isLiked ? "Unlike book" : "Like book"}
                                >
                                    {likeLoading ? (
																			<span className="loading loading-spinner"></span>
                                    ) : (
                                        <FaHeart className="" />
                                    )}
                                    {isLiked ? `Liked` : `Like`}
                                </button>
                            </div>
                </div>

                {/* Right Div: Title and Tabs */}
                <div className="w-full lg:w-2/3">
                {/* Skeleton Loader */}
                    {loading ? (
                        <div className="shadow-xl w-full p-4">
                            <div className="skeleton h-8 w-3/4 mb-4"></div>
                            <div className="flex gap-2 mb-4">
                                <div className="skeleton h-10 w-24 rounded"></div>
                                <div className="skeleton h-10 w-24 rounded"></div>
                            </div>
                            <div className="border-[1px] border-gray-700 rounded-lg p-4">
                                {activeTab === 'summary' ? (
                                    <div>
                                        <div className="skeleton h-4 w-full mb-2"></div>
                                        <div className="skeleton h-4 w-3/4 mb-2"></div>
                                        <div className="skeleton h-4 w-1/2"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="table w-full">
                                            <thead>
                                                <tr>
                                                    <th><div className="skeleton h-6 w-24"></div></th>
                                                    <th></th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array(3).fill().map((_, index) => (
                                                    <tr key={index}>
                                                        <td className="flex items-center gap-2">
                                                            <div className="skeleton w-8 h-8 rounded-full"></div>
                                                            <div>
                                                                <div className="skeleton h-4 w-32 mb-1"></div>
                                                                <div className="skeleton h-3 w-24"></div>
                                                            </div>
                                                        </td>
                                                        <td></td>
                                                        <td><div className="skeleton h-8 w-16"></div></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : book ? (
                        <div className="shadow-xl w-full p-4">
                            <div className="p-4 bg-custom-striped">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <h2 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500 break-words max-w-[600px]">
                                        {startCase(book.title)}
                                    </h2>
                                    <div className="flex gap-2 shrink-0">
																			
																				{/* MODIFIED: Opens modal instead of executing immediately */}
                                        <button
                                            className={`btn btn-sm flex items-center whitespace-nowrap ${book.isAutoUnlockEnabled ? 'btn-success text-white' : 'btn-outline btn-warning'}`}
                                            onClick={openUnlockModal}
                                            aria-label="Toggle Auto Unlock"
                                        >
                                            {book.isAutoUnlockEnabled ? (
                                                <FaUnlock className="mr-2" />
                                            ) : (
                                                <FaLock className="mr-2" />
                                            )}
                                            {book.isAutoUnlockEnabled ? 'Auto-Unlock: ON' : 'Auto-Unlock: OFF'}
                                        </button>

                                        <Link
                                            to={`/admin/books/${book._id}/edit`}
                                            className="btn btn-outline btn-info btn-sm flex items-center whitespace-nowrap"
                                            aria-label="Edit book"
                                        >
                                            <FaEdit className="mr-2" /> Edit Book
                                        </Link>
                                        <button
                                            className="btn btn-outline btn-error btn-sm flex items-center whitespace-nowrap"
                                            onClick={() => document.getElementById('delete-book-modal').showModal()}
                                            aria-label="Delete book"
                                        >
                                            <LuTrash2 className="mr-2" /> Delete Book
                                        </button>
                                    </div>
																</div>
                                <div className="tabs tabs-boxed mt-4 ">
                                    <button
                                        className={`tab ${activeTab === 'summary' ? 'bg-cyan-500 text-black' : ''}`}
                                        onClick={() => setActiveTab('summary')}
                                    >
                                        Summary
                                    </button>
                                    <button
                                        className={`tab ${activeTab === 'chapters' ? 'bg-cyan-500 text-black' : ''}`}
                                        onClick={() => setActiveTab('chapters')}
                                    >
                                        Chapters
                                    </button>
                                </div>
                                {activeTab === 'summary' && (
                                    <div className="mt-4">
                                        <p className="text-white text-base whitespace-pre-wrap">
                                            {showFullDescription
                                                ? book.description
                                                : truncate(book.description, { length: 150 })}
                                        </p>
                                        {book.description.length > 150 && !showFullDescription && (
                                            <button
                                                className="flex items-center gap-1 text-cyan-500 mt-2"
                                                onClick={() => setShowFullDescription(true)}
                                            >
                                                Show More
                                                <RiArrowDownWideFill className="text-xl" />
                                            </button>
                                        )}
                                    </div>
                                )}
																	{activeTab === 'chapters' && (
																			<div className="mt-4">
																					{/* 1. NEW RESPONSIVE HEADER (Outside the table) */}
																					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
																							<h3 className="text-white text-lg font-semibold pl-1">
																									Chapters
																							</h3>
																							
																							<div className="flex gap-4">
																								<Link
																										to={`/admin/add-chapter/${book._id}`}
																										className="btn btn-outline btn-success btn-sm w-full sm:w-auto"
																								>
																										<RiStickyNoteAddFill className="text-lg" />
																										<span>Add Chapter</span>
																								</Link>

																								<Link to={`/admin/books/${book._id}/agent`} className="btn btn-outline btn-primary btn-sm w-full sm:w-auto">
																									<RiRobot2Fill className="mr-2"/> Agent Console
																								</Link>

																							</div>
																					</div>

																					{/* 2. TABLE CONTAINER (Only holds the data list now) */}
																					<div className="overflow-x-auto border-[1px] border-gray-700 rounded-lg">
																							<table className="table w-full">
																									{/* Optional: Simple header just for column labels if you want, 
																											or remove <thead> entirely since we have the title above */}
																									
																									<tbody className="text-white text-base font-medium">
																											{book.chapters.map((chapter) => (
																													<tr key={chapter._id} className="hover:bg-gray-800/50 transition-colors border-b border-gray-700/50 last:border-none">
																															{/* Column 1: Chapter Info */}
																															<td className="align-middle">
																																	<div className="flex items-start gap-3">
																																			{/* Icon */}
																																			<div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 min-w-[2rem] min-h-[2rem] border-2 ${chapter.isLocked ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-cyan-500 shadow-lg shadow-cyan-500/50'} rounded-full`}>
																																					{chapter.isLocked ? (
																																							<FaLock className="text-red-500 text-sm" />
																																					) : (
																																							<FaBookReader className="text-blue-500 text-sm" />
																																					)}
																																			</div>

																																			{/* Text */}
																																			<div className="flex-1 min-w-0">
																																					<div className="font-medium text-white break-words">
																																							Chapter {chapter.chapterNo}: {startCase(chapter.title)}
																																					</div>
																																					<div className="text-sm font-light mt-1">
																																							<span className="text-gray-300">Released: </span>
																																							<span className="text-xs text-[#b9b9b9] font-normal">
																																									{formatDate(chapter.createdAt).fullDate}
																																							</span>
																																					</div>
																																			</div>
																																	</div>
																															</td>

																															{/* Column 2: Spacer (Optional, or just merge with col 3) */}
																															<td></td>

																															{/* Column 3: Action Buttons */}
																															<td className="text-right align-middle w-auto">
																																	<div className="flex justify-end gap-2">
																																			{/* EDIT BUTTON */}
																																			<Link
																																					to={`/admin/books/${book._id}/chapters/${chapter._id}/edit`}
																																					className="btn btn-outline btn-accent btn-sm"
																																					title="Edit Chapter"
																																			>
																																					<RiFileEditFill />
																																			</Link>

																																			{/* READ BUTTON */}
																																			<Link
																																					to={`/admin/books/${book._id}/read?chapterId=${chapter._id}`}
																																					className="btn btn-outline btn-info btn-sm min-w-[80px]"
																																					title="Read Chapter"
																																			>
																																					{chapter.coinCost && chapter.isLocked ? (
																																							<>
																																									<GiTwoCoins className="inline-block" />
																																									{chapter.coinCost}
																																							</>
																																					) : "Read"}
																																			</Link>
																																	</div>
																															</td>
																													</tr>
																											))}
																									</tbody>
																							</table>
																							
																							{/* Empty State Check */}
																							{book.chapters.length === 0 && (
																									<div className="p-8 text-center text-gray-500">
																											No chapters uploaded yet.
																									</div>
																							)}
																					</div>
																			</div>
																	)}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

						<dialog id="delete-book-modal" className="modal">
                <div className="modal-box bg-base-100">
                    <h3 className="font-bold text-lg text-[#FFD700]">Confirm Deletion</h3>
                    <p className="py-4 text-white">Are you sure you want to delete this book? This will also delete all associated chapters and Vocabs.</p>
                    <div className="modal-action">
                        <button
                            className="btn btn-outline btn-error"
                            onClick={handleDelete}
														disabled={deleteLoading}
                            aria-label="Confirm delete book"
                        >
                          {deleteLoading && <span className="loading loading-spinner loading-sm"></span>}
                            {deleteLoading ? "Deleting..." : "Confirm"}
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

						{/* NEW: Auto-Unlock Settings Modal */}
            <dialog id="auto-unlock-modal" className="modal">
                <div className="modal-box bg-gray-900 border border-gray-700">
                    <h3 className="font-bold text-xl text-[#FFD700] mb-2">
                        Auto-Unlock Settings
                    </h3>
                    {book && (
                        <p className="text-gray-400 text-sm mb-6">
                            Configure daily releases for <span className="text-white italic">{book.title}</span>.
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

export default BookDetails;
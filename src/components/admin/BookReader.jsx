import { useState, useEffect } from "react";
import axios from "axios";
import { startCase } from 'lodash';
import { useParams, useSearchParams, Link } from "react-router-dom";
import { FaBookOpen, FaLock } from "react-icons/fa";
import { RiArrowLeftSLine, RiArrowRightSLine, RiSettings3Line, RiCloseLine  } from "react-icons/ri";
import { GiTwoCoins } from "react-icons/gi";
import { LuCalendarRange } from "react-icons/lu";
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
		const [unlockLoading, setUnlockLoading] = useState(false);
		const [unlockError, setUnlockError] = useState(null)
			console.log("chapter:", chapterData);

   // Reading Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('text');
    const [readingSettings, setReadingSettings] = useState({
        fontSize: 20,
        fontFamily: 'serif',
        lineSpacing: 1.6,
        backgroundGradient: true,
        textAlignment: 'left',
        letterSpacing: 0,
        wordSpacing: 0,
    });

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
                console.error("Error fetching data:", err.response);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [bookId, chapterId, setSearchParams, auth?.token]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error || unlockError) {
            const timer = setTimeout(() =>{
							setError(null),
							setUnlockError(null);
						}, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, unlockError]);

		// Handle unlock chapter
    const handleUnlockChapter = async () => {
        setUnlockLoading(true);
        setUnlockError(null);
        try {
							await axios.post(
                `http://localhost:3000/api/v1/books/${bookId}/chapters/${chapterId}/unlock`,
                {},
                {
                    headers: { Authorization: `Bearer ${auth?.token}` }
                }
            );
            // Refetch chapter to update isLocked status
            const chapterResponse = await axios.get(`http://localhost:3000/api/v1/books/${bookId}/chapters/${chapterId}`, {
                headers: { Authorization: `Bearer ${auth?.token}` }
            });
            setChapterData(chapterResponse.data.data);
            document.getElementById('purchase-chapter-modal').close();
        } catch (err) {
						document.getElementById('purchase-chapter-modal').close();
            const errorMessage = err.response?.data?.message || "Failed to unlock chapter.";
            setUnlockError(errorMessage);
            console.error("Error unlocking chapter:", err.response);
        } finally {
            setUnlockLoading(false);
        }
    };

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

		  // Calculate estimated reading time
    const calculateReadingTime = (content) => {
        if (!content) return "0 min";
        
        const wordsPerMinute = 200; // Average reading speed
        const words = content.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        
        if (minutes < 1) return "Less than 1 min";
        if (minutes === 1) return "1 min";
        return `${minutes} mins`;
    };


		// Update reading settings
    const updateSetting = (key, value) => {
        setReadingSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

		// Generate dynamic styles for chapter content
    const getContentStyles = () => {
			const fontFamilyMap = {
					serif: 'serif',
					'sans-serif': 'sans-serif',
					monospace: 'monospace'
			};

			return {
            fontSize: `${readingSettings.fontSize}px`,
            fontFamily: fontFamilyMap[readingSettings.fontFamily],
            lineHeight: readingSettings.lineSpacing,
            textAlign: readingSettings.textAlignment,
            letterSpacing: `${readingSettings.letterSpacing}px`,
            wordSpacing: `${readingSettings.wordSpacing}px`,
        };
    };

    return (
        <main className="main-container p-4">
            {/* Error Alert */}
            {error || unlockError && (
                <div className="fixed left-1/2 top-4 -translate-x-1/2 z-50 animate__animated animate__fadeInDown">
                    <div role="alert" className="alert alert-error w-auto max-w-[90vw] lg:max-w-[60vw]">
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
                        <span>{error ? error : unlockError ? unlockError : null}</span>
                    </div>
                </div>
            )}

            {/* Settings Sidebar */}
            {isSettingsOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                        onClick={() => setIsSettingsOpen(false)}
                    />
                    
                    {/* Settings Panel */}
                    <div className="fixed right-0 top-0 h-full w-96 bg-[#1a1b23] border-l border-cyan-500 shadow-lg shadow-cyan-500/20 z-50 transform transition-transform duration-300 ease-in-out">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-xl font-semibold text-[#FFD700]">Reading Settings</h3>
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="btn btn-ghost btn-sm text-gray-400 hover:text-white"
                            >
                                <RiCloseLine className="text-xl" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-700">
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                    activeTab === 'text' 
                                        ? 'text-[#FFD700] border-b-2 border-[#FFD700] bg-gray-800' 
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Text
                            </button>
                            <button
                                onClick={() => setActiveTab('appearance')}
                                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                    activeTab === 'appearance' 
                                        ? 'text-[#FFD700] border-b-2 border-[#FFD700] bg-gray-800' 
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Appearance
                            </button>
                        </div>

                        {/* Settings Content */}
                        <div className="p-4 space-y-6 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
                            {activeTab === 'text' && (
                                <>
                                    {/* Text Size */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-300">Text Size</label>
                                            <span className="text-sm text-[#FFD700]">{readingSettings.fontSize}px</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500">A</span>
                                            <input
                                                type="range"
                                                min="12"
                                                max="32"
                                                value={readingSettings.fontSize}
                                                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                                                className="range range-warning flex-1"
                                            />
                                            <span className="text-lg text-gray-500">A</span>
                                        </div>
                                    </div>

                                    {/* Font Family */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Font</label>
                                        <select
                                            value={readingSettings.fontFamily}
                                            onChange={(e) => updateSetting('fontFamily', e.target.value)}
                                            className="select select-bordered w-full bg-gray-800 border-gray-600 text-white"
                                        >
                                            <option value="serif">Serif</option>
                                            <option value="sans-serif">Sans Serif</option>
                                            <option value="monospace">Monospace</option>
                                        </select>
                                    </div>

                                    {/* Line Spacing */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-300">Line Spacing</label>
                                            <span className="text-sm text-[#FFD700]">{readingSettings.lineSpacing}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.1"
                                            value={readingSettings.lineSpacing}
                                            onChange={(e) => updateSetting('lineSpacing', parseFloat(e.target.value))}
                                            className="range range-warning w-full"
                                        />
                                    </div>

                                      {/* Background Gradient */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-300">Background Gradient</label>
                                            <input
                                                type="checkbox"
                                                checked={readingSettings.backgroundGradient}
                                                onChange={(e) => updateSetting('backgroundGradient', e.target.checked)}
                                                className="toggle toggle-warning"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Enable striped gradient background</p>
                                    </div>

                                    {/* Text Alignment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">Text Alignment</label>
                                        <div className="flex gap-2">
                                            {['left', 'center', 'justify'].map((align) => (
                                                <button
                                                    key={align}
                                                    onClick={() => updateSetting('textAlignment', align)}
                                                    className={`btn btn-sm flex-1 ${
                                                        readingSettings.textAlignment === align
                                                            ? 'btn-warning text-black'
                                                            : 'btn-outline btn-warning'
                                                    }`}
                                                >
                                                    {startCase(align)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Letter Spacing */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-300">Letter Spacing</label>
                                            <span className="text-sm text-[#FFD700]">{readingSettings.letterSpacing}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="5"
                                            step="0.5"
                                            value={readingSettings.letterSpacing}
                                            onChange={(e) => updateSetting('letterSpacing', parseFloat(e.target.value))}
                                            className="range range-warning w-full"
                                        />
                                    </div>

                                    {/* Word Spacing */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-300">Word Spacing</label>
                                            <span className="text-sm text-[#FFD700]">{readingSettings.wordSpacing}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="10"
                                            step="0.5"
                                            value={readingSettings.wordSpacing}
                                            onChange={(e) => updateSetting('wordSpacing', parseFloat(e.target.value))}
                                            className="range range-warning w-full"
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="text-center text-gray-500 py-8">
                                    <p>Appearance settings coming soon...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <div className="flex flex-col gap-6">
                {/* Header */}
                {loading ? (
                    <div className="flex justify-between items-center">
                        <div className="skeleton h-8 w-3/4"></div>
                        <div className="skeleton h-10 w-24"></div>
                    </div>
                ) : chapterData ? (
                    <div className="flex justify-between items-center border border-gray-800 p-4 rounded-xl">
											<Link to={`/admin/books/${bookId}`} className="flex items-center group">
												<RiArrowLeftSLine className="text-[#FFD700] text-2xl mt-1 group-hover:mr-2 transition-all duration-200" />
                        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">
                            {startCase(chapterData.bookTitle)}
                        </h2>
											</Link>

											  {/* Settings Icon */}
												{!chapterData.chapter.isLocked ? (
													<button
															onClick={() => setIsSettingsOpen(true)}
															className="btn btn-ghost btn-sm text-[#FFD700] hover:text-white hover:bg-gray-700 transition-colors"
															title="Reading Settings"
													>
															<RiSettings3Line className="text-xl" />
													</button>
												) : null}
                    </div>
                ) : null}

                {/* Chapter Content */}
                <div className={`card w-full p-4 border border-blue-500 shadow-md shadow-cyan-500/50 ${readingSettings.backgroundGradient ? 'bg-custom-striped' : 'bg-gray-800'}`}>
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
                                <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 border-2 ${chapterData.chapter.isLocked ? 'border-red-500 shadow-lg shadow-red-500/50' : 'border-cyan-500 shadow-lg shadow-cyan-500/50'} rounded-full`}>
                                    {chapterData.chapter.isLocked ? (
                                        <FaLock className="text-red-500 text-sm" />
                                    ) : (
                                        <FaBookOpen className="text-blue-500 text-sm" />
                                    )}
                                </div>
                                <h3 className="text-2xl sm:text-5xl lg:text-3xl tracking-tight font-extrabold text-[#FFD700] flex gap-1">
																	{/* Chapter number: never wrap */}
                                    <span  className="whitespace-nowrap">{chapterData.chapter.chapterNo}.</span> 

																		{/* Title: wraps normally but stays aligned on its own axis */}
																		<span className="break-words text-[#f59f0a]">{startCase(chapterData.chapter.title)}</span>
                                </h3>
                            </div>
                            <p className="text-sm text-[#b9b9b9] flex items-center gap-1">
                                <LuCalendarRange />
																<span>{formatDate(chapterData.chapter.createdAt)}</span>
                            </p>
														<p className="text-sm text-[#b9b9b9] flex items-center gap-1">
                                <span>📖</span>
                                Estimated reading time: {calculateReadingTime(chapterData.chapter.content)}
                            </p>

                            {chapterData.chapter.isLocked ? (
                                <div className="mt-4 flex flex-col items-center gap-2 text-red-500">
                                    <div className="flex items-center justify-center w-14 h-14 border-2 border-red-500 shadow-lg shadow-red-500/50 rounded-full">
																			<FaLock className="inline-block text-3xl" />
																		</div>
																		<h3 className="text-2xl font-bold tracking-tight">Chapter Locked</h3>
                                    <p className="text-gray-400 mb-4">Unlock with coins to continue reading</p>
																		<button
                                        className="btn btn-info w-2/5"
																				onClick={() => document.getElementById('purchase-chapter-modal').showModal()}
                                        disabled={unlockLoading}
                                    >
                                        Unlock this chapter -
                                        <GiTwoCoins className="text-[#FFD700] text-xl" />
                                        {chapterData?.chapter?.coinCost}
                                    </button>
                                </div>
                            ) : (
                                <div
																		draggable="false" // Prevent dragging text
                                    className="text-white mt-4 whitespace-pre-wrap"
                                    style={{
                                        ...getContentStyles(),
																				userSelect: 'none', // Prevent text selection                               
                                    }}
																		onContextMenu={(e) => e.preventDefault()} // Disable right-click context menu
                                >
                                    {chapterData.chapter.content}
                                </div>
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
						
						{/* Purchase Confirmation Modal */}
						<dialog id="purchase-chapter-modal" className="modal">
                <form method="dialog" className="modal-box max-w-lg w-full-base-300">
                    <h3 className="font-bold text-xl text-[#FFD700]">Confirm Purchase</h3>
                    <p className="py-2 text-gray-400 text-sm">
											Are you sure you want to purchase this chapter for <GiTwoCoins className="inline-block text-[#FFD700]" /> {chapterData?.chapter?.coinCost}  ?
										</p>
                
                    <div className="modal-action gap-4">
                        <button
                            className="btn btn-outline btn-info"
                            onClick={handleUnlockChapter}
                            aria-label="Confirm purchase"
														disabled={unlockLoading}
                        >
														{unlockLoading && <span className="loading loading-spinner"></span>}
                            Purchase
                        </button>
												
                        <button
                            className="btn btn-outline"
                            onClick={() => document.getElementById('purchase-chapter-modal').close()}
                            aria-label="Cancel purchase"
														disabled={unlockLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </dialog>
				</main>
    );
}

export default BookReader;
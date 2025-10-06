import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { startCase, capitalize, truncate } from 'lodash';
import { Link } from "react-router-dom";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { FiUpload } from "react-icons/fi";
import { LuTrash2, LuMail } from "react-icons/lu";
import { GoPerson, GoHistory  } from "react-icons/go";
import { RiBook2Line } from "react-icons/ri";
import { GiBookshelf } from "react-icons/gi";
import { PiCoinsFill } from "react-icons/pi";

import { useAuth } from "../../context/AuthContext";
import 'animate.css';

function Profile() {
    const { auth } = useAuth();
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', avatar: null, removeAvatar: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [previewUrl, setPreviewUrl] = useState(null);

    const DEFAULT_AVATAR = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`; 
    // you can also use: https://api.dicebear.com/6.x/initials/svg?seed=User
    // you can also use: https://robohash.org/default?set=set4


    // Fetch user profile and reading history
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch profile
                const profileResponse = await axios.get('http://localhost:3000/api/v1/user/profile', {
                    headers: { Authorization: `Bearer ${auth?.token}` }
                });
                setUser(profileResponse.data.data);
                setFormData({
                    username: profileResponse.data.data.username,
                    email: profileResponse.data.data.email,
                    avatar: null
                });

                // Fetch reading history
                const historyResponse = await axios.get('http://localhost:3000/api/v1/user/history', {
                    headers: { Authorization: `Bearer ${auth?.token}` }
                });
                setHistory(historyResponse.data.data);
                setError(null);
            } catch (err) {
                const errorMessage = err.response?.data?.message || "Failed to load profile.";
                setError(errorMessage);
                console.error("Error fetching data:", errorMessage);
            } finally {
                setLoading(false);
            }
        };
        if (auth?.token) fetchData();
    }, [auth?.token]);

    
    // Watch avatar changes for live preview
    useEffect(() => {
        if (formData.avatar) {
            const objectUrl = URL.createObjectURL(formData.avatar);
            setPreviewUrl(objectUrl);

            // Cleanup when avatar changes or component unmounts
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [formData.avatar]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    // Handle profile update
    const handleSave = async () => {
        try {
            setSaving(true);
            const data = new FormData();
            data.append('username', formData.username);
            data.append('email', formData.email);
        
						if (formData.avatar) {
							data.append('avatar', formData.avatar);
						} else if (formData.removeAvatar) {
							data.append('removeAvatar', true); // send flag to backend
						}


            const response = await axios.put('http://localhost:3000/api/v1/user/profile', data, {
                headers: {
                    Authorization: `Bearer ${auth?.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setUser(response.data.data);
            setIsEditing(false);

						// ✅ Reset avatar-related state after successful save
						setFormData((prev) => ({
							...prev,
							avatar: null,
							removeAvatar: false,
						}));
						setPreviewUrl(null);
        

            setError(null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Failed to update profile.";
            setError(errorMessage);
            console.error("Error updating profile:", errorMessage);
        }finally {
            setSaving(false);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            username: user?.username || '',
            email: user?.email || '',
            avatar: null,
						removeAvatar: false,
        });
				setPreviewUrl(null); // revert preview to saved avatar (or default if none)
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const fileInputRef = useRef(null);

    const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setFormData((prev) => ({
        ...prev,
        avatar: file,
        removeAvatar: false,
        }));
    }
    };


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

            <div className="flex flex-col gap-6">
                {/* Top Div: Avatar, Username/Email, Edit Button */}
                {loading ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-custom-striped">
                        <div className="relative">
                            <div className="skeleton w-[120px] h-[120px] rounded-full"></div>
                            <div className="skeleton absolute bottom-2 left-1/2 -translate-x-1/2 h-8 w-16 rounded-full"></div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-1">
                                <div className="skeleton w-4 h-4"></div>
                                <div className="skeleton h-6 w-1/3"></div>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="skeleton w-4 h-4"></div>
                                <div className="skeleton h-4 w-1/2"></div>
                            </div>
                        </div>
                        <div className="skeleton h-8 w-24"></div>
                    </div>
                ) : user ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-custom-striped rounded-xl">
                    <div className="relative bg-gray-800 rounded-full p-1">
                        {/* Avatar Image */}
                        <img
                            src={   
                                previewUrl // live preview of new upload
                                    ? previewUrl
                                        : formData.removeAvatar
                                    ? DEFAULT_AVATAR // if marked for removal, show default
                                        : user.avatar || DEFAULT_AVATAR // existing avatar if not use a default
                                }
                            alt="Avatar"
                            className="w-[120px] h-[120px] aspect-[1/1] rounded-full object-cover"
                        />
                     {/* Badge only visible in edit mode */}
                        {isEditing && (
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-4 bg-gray-800/80 px-2 sm:px-3 py-1 sm:py-2 rounded-full">
                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleAvatarChange}
                            />

                            {/* Upload button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-white text-sm hover:text-[#FFD700] hover:font-medium hover:text-base"
                            >
                                <FiUpload />
                            </button>

                            {/* Remove button - shows if avatar exists (either in DB or just uploaded) */}
                            {(previewUrl || formData.avatar || user.avatar) && (
                                <button
                                type="button"
                                onClick={() => {
                                setFormData((prev) => ({
                                    ...prev,
                                    avatar: null,
                                    removeAvatar: true,
                                }));
                                    setPreviewUrl(null); // clear preview
                            
                            }}
                                className="text-white text-sm hover:text-red-500 hover:font-medium hover:text-base"
                                >
                                    <LuTrash2 />
                                </button>
                            )}
                            </div>
                        )}
                        </div>

                        <div className="flex-1 space-y-1">
                            <h2 className="text-xl font-semibold text-[#FFD700]">{capitalize(user.username)}</h2>
                            <p className="flex items-center gap-1 text-[#b9b9b9] text-sm"><LuMail /><span>{user.email}</span></p>
                            <span className="flex items-center gap-1 text-[#b9b9b9] text-sm">
                                <PiCoinsFill className="text-[#f59f0a] text-lg" /> 
                                <span className="">{user.coinBalance.toLocaleString() || 0}</span>
                            </span>
                        </div>
                        <button
                            className="btn btn-outline btn-info btn-sm flex items-center"
                            onClick={() => setIsEditing(true)}
                        >
                            <FaEdit /> Edit Profile
                        </button>
                    </div>
                ) : null}

                {/* Tabs: Profile and Reading History */}
                <div className="w-full p-4 border-2 border-gray-800 rounded-lg">
                    <div className="tabs tabs-boxed mb-4">
                        <button
                            className={`gap-2 text-base tab ${activeTab === 'profile' ? 'bg-cyan-500 text-black' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <GoPerson /> <span>Profile</span>
                        </button>
                        <button
                            className={`gap-2 text-base tab ${activeTab === 'history' ? 'bg-cyan-500 text-black' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <GoHistory /> <span>History</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-4">
                            {activeTab === 'profile' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="skeleton w-6 h-6"></div>
                                        <div className="skeleton h-6 w-1/2"></div>
                                    </div>
                                    <div className="skeleton h-4 w-1/3 italic"></div>
                                    <div>
                                        <div className="skeleton h-4 w-16 mb-1"></div>
                                        <div className="skeleton h-10 w-full"></div>
                                    </div>
                                    <div>
                                        <div className="skeleton h-4 w-16 mb-1"></div>
                                        <div className="skeleton h-10 w-full"></div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="skeleton w-6 h-6"></div>
                                        <div className="skeleton h-6 w-1/2"></div>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto py-4">
                                        {Array(3).fill().map((_, index) => (
                                            <div key={index} className="skeleton w-60 h-64 rounded-lg flex-shrink-0">
                                                <div className="skeleton h-32 w-full rounded-t-lg"></div>
                                                <div className="p-4 space-y-2">
                                                    <div className="skeleton h-4 w-3/4"></div>
                                                    <div className="skeleton h-4 w-1/2"></div>
                                                    <div className="skeleton h-3 w-1/3"></div>
                                                    <div className="skeleton h-8 w-16 ml-auto"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4">
                            {activeTab === 'profile' && user ? (
                                <div className="space-y-4 ">
                                    <div className="flex-col items-center">
                                        <h3 className="text-2xl gap-2 flex items-center font-semibold text-[#FFD700]"><GoPerson /><span>Profile Information</span></h3>
                                        <p className="text-base italic">Manage your personal details</p>
                                    </div>

                                    <div>
                                        <label className={`text-sm ${isEditing ? 'text-white font-medium' : 'text-[#7e7e7e]'}`}>Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="input input-bordered w-full"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div>
                                        <label className={`text-sm ${isEditing ? 'text-white font-medium' : 'text-[#7e7e7e]'}`}>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="input input-bordered w-full"
                                            disabled={!isEditing}
                                        />
                                    </div>
                        
                                    {isEditing && (
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-outline btn-info flex items-center"
                                                onClick={handleSave}
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                                ) : (
                                                    <FaSave className="mr-2" />
                                                )}
                                                {saving ? "Saving..." : "Save Changes"}
                                            </button>

                                            <button
                                                className="btn btn-outline btn-error flex items-center"
                                                onClick={handleCancel}
                                            >
                                                <FaTimes className="mr-2" /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) :
                                activeTab === 'history' ? (
                                    <>
                                        <div className="flex-col items-center">
                                                        <h3 className="text-2xl gap-2 flex items-center font-semibold text-[#FFD700]"><GoHistory /><span>Reading History</span>
                                                        </h3>
                                                        {history.length === 0 && (
                                                                <p className="text-sm italic text-[#b9b9b9]">
                                                                    Your reading activity and history will appear here
                                                                </p>
                                                            )}
                                        </div>
                                        <div className="overflow-x-auto">
                                        {history.length > 0 ? (
                                            <div className="flex gap-4 overflow-x-auto py-4">
                                                {history.map((entry, index) => (
                                                    <div
                                                        key={index}
                                                        className="card card-compact glass w-60 h-64 bg-base-100 shadow-md flex-shrink-0"
                                                    >
                                                        <figure className="h-full w-full overflow-hidden">
                                                            <img
                                                                src={entry.book?.bookImage || "https://via.placeholder.com/150"}
                                                                alt={entry.book?.title}
                                                                className="object-cover h-full w-full"
                                                            />
                                                        </figure>

                                                        <div className="flex flex-col gap-1 p-4">
                                                            <h2 className="card-title text-base  text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500 truncate">
                                                                {truncate(startCase(entry.book?.title))}
                                                            </h2>
                                                            <p className="text-sm text-gray-300">
                                                                Chapter {entry.lastChapterRead?.chapterNo}:{" "}
                                                                {truncate(startCase(entry.lastChapterRead?.title), {length: 25})}
                                                            </p>
                                                            <p className="text-xs text-[#b9b9b9]">
                                                                last read on {formatDate(entry.createdAt)}
                                                            </p>
                                                            <div className="card-actions justify-end">
                                                                <Link
                                                                    to={`/admin/books/${entry.book?._id}/read?chapterId=${entry.lastChapterRead?._id}`}
                                                                    className="btn btn-sm btn-outline btn-info"
                                                                >
                                                                    Read
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                                <RiBook2Line  className="text-5xl text-gray-500" />
                                                <p className="text-lg">No reading history available</p>
                                                <p className="text-base italic text-[#b9b9b9]">
                                                    Books and the last chapter you read will appear here 
                                                </p>

                                                <Link
                                                    to="/admin/books"
                                                    className="btn btn-sm btn-outline flex items-center gap-2"
                                                >
                                                    <GiBookshelf className="text-lg" />
                                                    Browse Books
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                    </>
                                ) : null}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default Profile;
import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Customers() {
    const { auth } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        currentPage: 1,
        totalPages: 1
    });

    const limit = 15;

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/user/customers?page=${pagination.currentPage}&limit=${limit}`, {
                    headers: { Authorization: `Bearer ${auth?.token}` }
                });
                setCustomers(response.data.data);
                setPagination({
                    total: response.data.pagination.total,
                    currentPage: response.data.pagination.currentPage,
                    totalPages: response.data.pagination.totalPages
                });
                setError(null);
            } catch (err) {
                setError(err.response?.data?.error || "Failed to load customers.");
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [pagination.currentPage, auth?.token]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, currentPage: page }));
        }
    };

    return (
        <main className="main-container p-4">
            <div className="main-title mb-6">
                <h3 className="text-xl font-bold text-[#FFD700]">All Customers</h3>
                <p className="text-gray-400 text-sm mt-1">Total registered users: {pagination.total}</p>
            </div>

            {error && (
                <div className="alert alert-error mb-6">
                    <svg className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-base-100 rounded-xl shadow-xl overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead className="bg-gray-800 text-gray-300">
                            <tr>
                                <th className="rounded-tl-xl pl-6">Profile</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Coins</th>
                                <th>Unlocked Chapters</th>
                                <th className="rounded-tr-xl">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-white bg-custom-striped">
                            {loading ? (
                                Array(5).fill().map((_, i) => (
                                    <tr key={i} className="border-b border-gray-700/50">
                                        <td className="pl-6"><div className="skeleton w-10 h-10 rounded-xl"></div></td>
                                        <td><div className="skeleton h-4 w-24"></div></td>
                                        <td><div className="skeleton h-4 w-40"></div></td>
                                        <td><div className="skeleton h-4 w-12"></div></td>
                                        <td><div className="skeleton h-4 w-16"></div></td>
                                        <td><div className="skeleton h-4 w-24"></div></td>
                                    </tr>
                                ))
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-400">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
															customers.map((customer) => {
																	// NEW: Fallback logic using DiceBear
																	// Other great options: 
																	// 1. Initials: `https://api.dicebear.com/9.x/initials/svg?seed=${customer.username}`
																	// 2. Robohash: `https://robohash.org/${customer.username}?size=100x100`
																	// 3. Adventurer: `https://api.dicebear.com/9.x/adventurer/svg?seed=${customer.username}`
																	const fallbackAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${customer.username}&backgroundColor=1f2937`;

                                    return (
                                        <tr key={customer._id} className="hover:bg-gray-800/40 border-b border-gray-700/50 transition-colors">
                                            <td className="pl-6">
                                                <img 
                                                    // If they have an uploaded avatar, use it. Otherwise, use the generated one!
                                                    src={customer.avatar || fallbackAvatar} 
                                                    alt={customer.username} 
                                                    className="w-10 h-10 rounded-xl object-cover border border-gray-600 bg-gray-800"
                                                />
                                            </td>
                                            <td className="font-medium">{customer.username}</td>
                                            <td className="text-gray-300 capitalize">{customer.email}</td>
                                            <td className="text-[#FFD700] font-semibold">{customer.coinBalance || 0}</td>
                                            <td>{customer.unlockedChapters?.length || 0}</td>
                                            <td className="text-gray-400 text-sm">
                                                {new Date(customer.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    );
																})
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <div className="btn-group space-x-2">
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                        >
                            Prev
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                key={page}
                                className={`btn btn-outline btn-sm ${pagination.currentPage === page ? 'btn-active' : ''}`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className="btn btn-outline btn-sm"
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

export default Customers;
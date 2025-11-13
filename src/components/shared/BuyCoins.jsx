import { useState, useEffect } from "react";
import api from "../../api/axios";
import { FaCoins, FaGift, FaCrown, FaStar } from "react-icons/fa";
import { PiCoinsFill } from "react-icons/pi";
import { GiCutDiamond } from "react-icons/gi";
import { PiShootingStarDuotone } from "react-icons/pi";
import { useAuth } from "../../context/AuthContext";

const COIN_PLANS = [
    { baseCoins: 100, bonus: 0, price: 1.00, popular: false },
    { baseCoins: 300, bonus: 0, price: 2.99, popular: false },
    { baseCoins: 500, bonus: 0, price: 4.99, popular: false },
    { baseCoins: 1000, bonus: 50, price: 9.99, popular: true },
    { baseCoins: 2000, bonus: 200, price: 19.99, popular: false },
    { baseCoins: 5000, bonus: 1750, price: 49.99, popular: false },
    { baseCoins: 10000, bonus: 4500, price: 99.99, popular: false },
];

function BuyCoins() {
    const { auth } = useAuth();
		const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [purchaseLoading, setPurchaseLoading] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userCoinBalance, setUserCoinBalance] = useState(null);


		// Fetch user profile to get current coin balance
		useEffect(() => {
			let isMounted = true;
			const fetchData = async () => {
						if (!auth?.token) return;
						
						setIsProfileLoading(true);
						try {
								const profileResponse = await api.get('/user/profile', {
										headers: { Authorization: `Bearer ${auth?.token}` }
								});
								
								if (isMounted) {
										setUserCoinBalance(profileResponse.data.data.coinBalance);
										setError(null);
								}
						} catch (err) {
								if (isMounted) {
										const errorMessage = err.response?.data?.message || "Failed to fetch coin balance";
										setError(errorMessage);
										console.error("Error fetching data:", errorMessage);
								}
						} finally {
								if (isMounted) {
										setIsProfileLoading(false);
								}
						}
					};
					fetchData();
				return () => {
						isMounted = false;
				};
		}, [auth?.token]);
		

    const handlePurchase = async (baseCoins) => {
			console.log("BuyCoins component rendered", success);
			if (!auth?.token) {
				setError("Please login to purchase coins");
				return;
			}
			
				setPurchaseLoading(baseCoins);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.post(
                "/payments/buy-coins",
                { coins: baseCoins },
                {
                    headers: { Authorization: `Bearer ${auth?.token}` }
                }
            );

            if (response.data.link) {
                // Redirect to Flutterwave payment page
                window.location.href = response.data.link;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to initiate purchase");
        } finally {
            setPurchaseLoading(null);
        }
    };

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const getBadgeStyles = (plan) => {
        if (plan.baseCoins >= 10000) return "badge-primary";
        if (plan.baseCoins >= 5000) return "badge-warning";
        if (plan.baseCoins >= 1000) return "badge-info";
        return "badge-success";
    };

    const getCardIcon = (plan) => {
        if (plan.baseCoins >= 10000) return <GiCutDiamond className="text-5xl text-purple-700" />;
        if (plan.baseCoins >= 5000) return <FaCrown className="text-5xl text-yellow-500" />;
        if (plan.baseCoins >= 1000) return <PiShootingStarDuotone className="text-5xl text-cyan-500" />;
        return <PiCoinsFill className="text-5xl text-[#ffd700]" />;
    };

    return (
        <main className="main-container p-4">
            {/* Error Alert */}
            {error && (
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
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500 mb-2">
                    Buy Coins to Unlock premium chapters
                </h1>
                <p className="text-gray-400 text-lg">
										Purchase Coins to access exclusive chapters and support your favorite stories
                </p>
                <div className=" mt-4">
                    {!isProfileLoading && (
											<>
												<span className="flex items-center justify-center gap-2 text-white text-base font-medium">
														Your coins: <PiCoinsFill className="text-[#f59f0a] text-lg" /> <span className="text-gray-300 font-normal">{userCoinBalance?.toLocaleString() || 0}</span>
												</span>
											</>
										)}
                </div>
            </div>

            {/* Coin Packages Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {COIN_PLANS.map((plan) => {
                    const totalCoins = plan.baseCoins + plan.bonus;
                    const hasBonus = plan.bonus > 0;

                    return (
                        <div
                            key={plan.baseCoins}
                            className={`relative card border ${
                                plan.popular
                                    ? "border-[#FFD700]"
                                    : "border-blue-500"
                            } p-6 bg-[#0f1419] hover:scale-105 transition-transform duration-300`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-gold text-black text-xs font-semibold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                                    <FaStar className="text-xs" />
                                    POPULAR
                                </div>
                            )}

                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                {getCardIcon(plan)}
                            </div>

                            {/* Base Coins */}
                            <div className="text-center mb-2">
                                <div className="flex items-center justify-center gap-2">
                                    <FaCoins className="text-[#f59f0a] text-xl" />
                                    <h3 className="text-3xl font-bold text-white">
                                        {plan.baseCoins.toLocaleString()}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-sm">Base Coins</p>
                            </div>

                            {/* Bonus Badge */}
                            {hasBonus && (
                                <div className="flex justify-center mb-4">
                                    <div className={`badge ${getBadgeStyles(plan)} badge-lg gap-1 font-semibold`}>
                                        <FaGift className="text-base" />
                                        +{plan.bonus.toLocaleString()} BONUS
                                    </div>
                                </div>
                            )}

                            {/* Total Coins (if bonus exists) */}
                            {hasBonus && (
                                <div className="text-center mb-4 p-2 bg-gray-700/50 rounded-lg">
                                    <p className="text-sm text-gray-300">Total You Get:</p>
                                    <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">
                                        {totalCoins.toLocaleString()} Coins
                                    </p>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="divider my-2"></div>

                            {/* Price */}
                            <div className="text-center mb-4">
                                <p className="text-3xl font-bold text-[#f59f0a]">
                                    ${plan.price.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">USD</p>
                            </div>

                            {/* Purchase Button */}
                            <button
                                onClick={() => handlePurchase(plan.baseCoins)}
                                disabled={purchaseLoading === plan.baseCoins}
                                className={`btn w-full ${
                                    plan.popular
                                        ? "btn-warning text-black"
                                        : "btn-outline btn-info"
                                }`}
                            >
                                {purchaseLoading === plan.baseCoins ? (
                                    <span className="loading loading-spinner"></span>
                                ) : (
                                    <>
                                        <FaCoins className="mr-2" />
                                        Buy Now
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Info Section */}
            <div className="mt-12 card border border-blue-500 bg-[#0f1419] p-6">
                <h2 className="text-2xl font-bold text-[#f59f0a] mb-4">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-4xl mb-2">1️⃣</div>
                        <h3 className="text-lg font-semibold text-white mb-2">Choose a Package</h3>
                        <p className="text-gray-400 text-sm">
                            Select the coin package that best suits your reading needs
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-2">2️⃣</div>
                        <h3 className="text-lg font-semibold text-white mb-2">Complete Payment</h3>
                        <p className="text-gray-400 text-sm">
                            Securely pay via card, bank transfer, or USSD
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-2">3️⃣</div>
                        <h3 className="text-lg font-semibold text-white mb-2">Start Reading</h3>
                        <p className="text-gray-400 text-sm">
                            Coins are credited within 3 minutes and you can unlock chapters
                        </p>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="mt-6 card bg-[#0f1419] border p-6">
                <h2 className="text-2xl font-bold text-[#f59f0a] mb-4">Why Buy Coins?</h2>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-white">
                        <PiCoinsFill className="text-[#f59f0a] text-xl mt-1 flex-shrink-0" />
                        <div>
                            <strong>Unlock Premium Content:</strong> Access locked chapters instantly
                        </div>
                    </li>
                    <li className="flex items-start gap-3 text-white">
                        <FaGift className="text-cyan-500 text-xl mt-1 flex-shrink-0" />
                        <div>
                            <strong>Bonus Coins:</strong> Get extra coins with larger packages
                        </div>
                    </li>
                    <li className="flex items-start gap-3 text-white">
                        <FaStar className="text-yellow-500 text-xl mt-1 flex-shrink-0" />
                        <div>
                            <strong>Support Translators:</strong> Help Translators continue translating great stories
                        </div>
                    </li>
                    <li className="flex items-start gap-3 text-white">
                        <FaCrown className="text-orange-500 text-xl mt-1 flex-shrink-0" />
                        <div>
                            <strong>No Expiration:</strong> Your coins never expire, use them anytime
                        </div>
                    </li>
                </ul>
            </div>
        </main>
    );
}

export default BuyCoins;
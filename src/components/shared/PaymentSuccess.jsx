// import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PiCoinsFill } from "react-icons/pi";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import 'animate.css';

function PaymentSuccess() {
    const navigate = useNavigate();
    // const [searchParams] = useSearchParams();
    // const [countdown, setCountdown] = useState(10);
    
    // const status = searchParams.get('status');
    // const txRef = searchParams.get('tx_ref');
    // const transactionId = searchParams.get('transaction_id');

    // Countdown timer for auto-redirect
    // useEffect(() => {
    //     if (countdown > 0) {
    //         const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    //         return () => clearTimeout(timer);
    //     } else {
    //         navigate('/admin/');
    //     }
    // }, [countdown, navigate]);

    const handleGoToDashboard = () => {
        navigate('/admin/');
    };

    return (
        <div className=" h-screen flex items-center justify-center p-4">
            <div className="max-w-xl w-full">
                {/* Success Card */}
                <div className="card border-2 border-blue-500 shadow-lg shadow-cyan-500/30 p-8 bg-gradient-to-br from-gray-900 to-gray-800 animate__animated animate__zoomIn">
                    
                    {/* Success Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            {/* Pulsing background circle */}
                            <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-20"></div>
                            {/* Main icon */}
                            <IoShieldCheckmarkOutline className="text-cyan-500 text-8xl relative z-10 animate__animated animate__bounceIn" />
                        </div>
                    </div>

                    {/* Success Message */}
                    <div className="text-center mb-1">
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500 mb-3 animate__animated animate__fadeInUp">
                            Payment Successful
                        </h1>
                        <p className="text-gray-300 text-lg mb-2 animate__animated animate__fadeInUp animate__delay-1s">
                            Your coins have been credited to your account
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2 animate__animated animate__fadeInUp animate__delay-2s">
                            <PiCoinsFill className="text-[#f59f0a] text-4xl" />
                            <span className="text-white text-base">
                                Check your balance in your profile
                            </span>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    {/* {(txRef || transactionId) && (
                        <div className="bg-gray-700/30 rounded-lg p-4 mb-6 border border-gray-600 animate__animated animate__fadeInUp animate__delay-3s">
                            <h3 className="text-sm font-semibold text-gray-400 mb-2">Transaction Details</h3>
                            {txRef && (
                                <p className="text-xs text-gray-300 mb-1">
                                    <span className="text-gray-500">Reference:</span> {txRef}
                                </p>
                            )}
                            {transactionId && (
                                <p className="text-xs text-gray-300">
                                    <span className="text-gray-500">Transaction ID:</span> {transactionId}
                                </p>
                            )}
                            {status && (
                                <p className="text-xs text-gray-300 mt-1">
                                    <span className="text-gray-500">Status:</span>{' '}
                                    <span className="text-green-400 font-semibold uppercase">{status}</span>
                                </p>
                            )}
                        </div>
                    )} */}

                    {/* Divider */}
                    <div className="divider my-0"></div>

                    {/* Auto-redirect notice */}
                    {/* <div className="text-center my-2">
                        <p className="text-gray-400 text-sm">
                            Redirecting to dashboard in{' '}
                            <span className="text-[#ffd700] font-bold text-base">{countdown}</span> seconds...
                        </p>
                    </div> */}

                    {/* Dashboard Button */}
										<div className="flex justify-center mt-2">
											<button
													onClick={handleGoToDashboard}
													className="btn btn-outline btn-info w-3/4 text-base flex items-center justify-center transition-transform animate__animated animate__fadeInUp animate__delay-4s gap-1"
											>
													<p>Go to Dashboard</p>
											</button>
										</div>

                    {/* Additional Info */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Thank you for your purchase! You can now unlock premium chapters.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default PaymentSuccess;
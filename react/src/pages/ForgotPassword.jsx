import React, { useState, useEffect } from 'react';
import axiosClient from '../axios';
import { Loader as RsuiteLoader } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import 'rsuite/dist/rsuite.min.css';
import logo from "/AceLogo.png"; // Update path according to your logo location
import AnimatedBackground from "../components/AnimatedBackground";
import { motion } from "framer-motion";
import ErrorMessage from "../components/ErrorMessage"; // Add this import

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const navigate = useNavigate();

    // Add a function to clear error messages
    const clearErrorMessage = () => {
        setMessage('');
        setIsError(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setLoading(true);

        try {
            const { data } = await axiosClient.post('/forgot-password', { email });
            setMessage(data.message);
            setIsError(false);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Something went wrong.');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    // Countdown & redirect effect remains the same
    useEffect(() => {
        if (message && !isError) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/login');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [message, isError, navigate]);

    return (
        <div className="relative flex items-center justify-center min-h-screen px-5 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <AnimatedBackground />

            <div className="relative z-10 w-full max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="flex justify-center mb-8"
                    >
                        <img
                            src={logo}
                            loading="lazy"
                            alt="Logo"
                            className="w-auto h-32 transition-transform duration-300 hover:scale-105"
                        />
                    </motion.div>

                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your email and we'll send you instructions to reset your password
                        </p>
                    </div>

                    {/* Add margin-top to create space */}
                    <div className="mt-6">
                        {isError && message && (
                            <ErrorMessage error={message} onClear={clearErrorMessage} />
                        )}
                    </div>

                    {/* Keep the success message as is */}
                    {message && !isError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 mt-6 text-sm font-medium text-center text-green-600 rounded-lg bg-green-50"
                        >
                            {message}
                            <p className="mt-1 text-xs text-gray-600">
                                Redirecting to login in {countdown} second{countdown !== 1 && 's'}...
                            </p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-200"
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg ${loading
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <RsuiteLoader size="sm" />
                                    <span>Sending...</span>
                                </div>
                            ) : (
                                "Send Reset Link"
                            )}
                        </motion.button>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center"
                        >
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                            >
                                Back to Login
                            </button>
                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;

import React, { useState, useEffect } from 'react';
import axiosClient from '@api/axios';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Loader as RsuiteLoader } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import logo from '@images/AceLogo.png'; // Adjust path if needed
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AnimatedBackground from "@components/AnimatedBackground";
import { motion } from 'framer-motion';
import ErrorMessage from "@components/ErrorMessage"; // Add this import

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate(); // Add navigate hook
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // Changed from errors array to errorMessage string
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // Add success state
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    // Add a function to clear error messages
    const clearErrorMessage = () => {
        setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrorMessage('');
        setLoading(true);

        try {
            const { data } = await axiosClient.post('/reset', {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            setMessage(data.message);
            setIsSuccess(true); // Set success state instead of countdown
        } catch (error) {
            if (error.response && error.response.data.errors) {
                // Convert error array to HTML format for ErrorMessage component
                const allErrors = Object.values(error.response.data.errors).flat();
                const errorHTML = allErrors.map(err => `<li>${err}</li>`).join('');
                setErrorMessage(`<ul class="list-disc pl-5">${errorHTML}</ul>`);
            } else if (error.response && error.response.data.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // If password reset was successful, show success screen
    if (isSuccess) {
        return (
            <div className="relative flex flex-col justify-between min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <AnimatedBackground />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 flex flex-col items-center w-full max-w-lg p-4 mx-auto my-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full p-8 bg-white shadow-lg rounded-xl backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            className="flex justify-center mb-6"
                        >
                            <img src={logo} loading="lazy" alt="Logo" className="w-auto h-24 drop-shadow-md" />
                        </motion.div>

                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="flex items-center justify-center w-24 h-24 mb-6 bg-green-100 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="mb-2 text-2xl font-bold text-center text-gray-900">Password Reset Successful</h2>
                            <p className="max-w-md mb-8 text-center text-gray-600">
                                {message || "Your password has been reset successfully. You can now log in with your new password."}
                            </p>

                            <motion.button
                                onClick={() => navigate('/login')}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="flex items-center justify-center px-6 py-3 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg w-44 hover:bg-blue-700"
                            >
                                Go to Login
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col justify-between min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <AnimatedBackground />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center w-full max-w-lg p-4 mx-auto my-auto"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full p-8 bg-white shadow-lg rounded-xl backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="flex justify-center mb-8"
                    >
                        <img src={logo} loading="lazy" alt="Logo" className="w-auto h-36 drop-shadow-md" />
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h1 className="text-2xl font-bold text-center text-gray-900">
                            Reset Password
                        </h1>

                        {/* Replace the error list with ErrorMessage component */}
                        {errorMessage && (
                            <ErrorMessage error={errorMessage} onClear={clearErrorMessage} />
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 text-gray-700 transition-colors duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="relative">
                                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 text-gray-700 transition-colors duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleShowPassword}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition-colors hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <FaEye className="w-5 h-5" />
                                        ) : (
                                            <FaEyeSlash className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <label htmlFor="passwordConfirmation" className="block mb-1 text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="passwordConfirmation"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        className="w-full px-4 py-3 text-gray-700 transition-colors duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleShowConfirmPassword}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition-colors hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? (
                                            <FaEye className="w-5 h-5" />
                                        ) : (
                                            <FaEyeSlash className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`
                                w-full px-6 py-3 text-sm font-medium text-white transition-all duration-200 rounded-lg
                                ${loading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                }
                            `}
                        >
                            {loading ? <RsuiteLoader size="sm" /> : 'Reset Password'}
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;

import React, { useState, useEffect } from 'react';
import axiosClient from '../axios';
import { useParams } from 'react-router-dom';
import { Loader as RsuiteLoader } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import logo from '/AceLogo.png'; // Adjust path if needed
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AnimatedBackground from "../components/AnimatedBackground";
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const { token } = useParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            window.location.href = '/login';
        }
    }, [countdown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrors([]);
        setLoading(true);

        try {
            const { data } = await axiosClient.post('/reset', {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            setMessage(data.message);
            setCountdown(5);
        } catch (error) {
            if (error.response && error.response.data.errors) {
                const allErrors = Object.values(error.response.data.errors).flat();
                setErrors(allErrors);
            } else if (error.response && error.response.data.message) {
                setErrors([error.response.data.message]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col justify-between min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <AnimatedBackground />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center w-full max-w-lg p-4 mx-auto my-auto"
            >
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full px-4 py-3 mb-4 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-lg"
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {message}
                            {countdown !== null && countdown > 0 && (
                                <span className="ml-1">Redirecting in {countdown} seconds...</span>
                            )}
                        </div>
                    </motion.div>
                )}

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

                        {errors.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-4 py-3 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-lg"
                            >
                                <ul className="space-y-1 list-disc list-inside">
                                    {errors.map((err, index) => (
                                        <li key={index}>{err}</li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-gray-700 transition-colors duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 text-gray-700 transition-colors duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={toggleShowPassword}
                                    className="absolute text-gray-400 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <FaEye className="w-5 h-5" />
                                    ) : (
                                        <FaEyeSlash className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm New Password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="w-full px-4 py-3 text-gray-700 transition-colors duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={toggleShowConfirmPassword}
                                    className="absolute text-gray-400 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? (
                                        <FaEye className="w-5 h-5" />
                                    ) : (
                                        <FaEyeSlash className="w-5 h-5" />
                                    )}
                                </button>
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

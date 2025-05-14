import React, { useState, useEffect } from 'react';
import axiosClient from '../axios';
import { Loader as RsuiteLoader } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import 'rsuite/dist/rsuite.min.css';
import logo from "/AceLogo.png"; // Update path according to your logo location
import AnimatedBackground from "../components/AnimatedBackground";



const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const navigate = useNavigate();

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

    // Countdown & redirect effect
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
        <div className="flex items-center justify-center min-h-screen px-5 bg-gray-50">
            <AnimatedBackground />
            {/* <div className="w-full max-w-md p-8 bg-white shadow-md rounded-2xl"> */}
            <div className="w-full max-w-lg p-8 bg-white shadow-md rounded-2xl animated fadeInDown">

                <div className="flex justify-center mb-6">
                    <img
                        src={logo}
                        loading="lazy"
                        alt="Logo"
                        // className="w-auto h-16"
                        className="w-auto h-36"
                    />
                </div>
                <h1 className="mb-6 text-2xl font-bold text-center text-gray-700">
                    Forgot Password
                </h1>

                {message && (
                    <div
                        className={`text-sm font-medium text-center px-4 py-2 mb-4 rounded-md
                        ${isError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                    >
                        {message}
                        {!isError && (
                            <p className="mt-1 text-xs text-gray-600">
                                Redirecting to login in {countdown} second{countdown !== 1 && 's'}...
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 font-semibold rounded-md text-white transition
                        ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {loading ? <RsuiteLoader size="sm" /> : 'Send Reset Link'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;

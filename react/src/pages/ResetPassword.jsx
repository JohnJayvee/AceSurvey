import React, { useState, useEffect } from 'react';
import axiosClient from '../axios';
import { useParams } from 'react-router-dom';
import { Loader as RsuiteLoader } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import logo from '/AceLogo.png'; // Adjust path if needed
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
        <div className="relative flex flex-col justify-between min-h-screen">
            <div className="flex flex-col items-center w-full max-w-lg mx-auto my-auto">
                {message && (
                    <div className="w-full px-3 py-2 mb-2 text-sm font-semibold text-center text-green-400 bg-green-100 rounded-md">
                        {message}
                        {countdown !== null && countdown > 0 && (
                            <span> Redirecting in {countdown} seconds...</span>
                        )}
                    </div>
                )}

                <div className="w-full p-6 m-4 bg-white rounded-lg drop-shadow-xl animated fadeInDown">
                    <div className="flex justify-center mb-6">
                        <img src={logo} loading="lazy" alt="Logo" className="w-auto h-36" />
                    </div>
                    <form onSubmit={handleSubmit} className="w-full">
                        <h1 className="my-4 text-2xl font-semibold text-center">
                            Reset Password
                        </h1>
                        {errors.length > 0 && (
                            <div className="w-full px-3 py-2 mb-2 text-sm font-semibold text-center text-red-400 bg-red-100 rounded-md">
                                <ul className="text-left list-disc list-inside">
                                    {errors.map((err, index) => (
                                        <li key={index}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-3 my-3 form-control"
                        />
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 my-3 form-control"
                            />
                            <span
                                onClick={toggleShowPassword}
                                className="absolute text-gray-500 transform -translate-y-1/2 cursor-pointer top-1/2 right-3"
                            >
                                {showPassword ? (
                                    <FaEye className="w-5 h-5" />
                                ) : (
                                    <FaEyeSlash className="w-5 h-5" />
                                )}
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm New Password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                className="w-full p-3 my-3 form-control"
                            />
                            <span
                                onClick={toggleShowConfirmPassword}
                                className="absolute text-gray-500 transform -translate-y-1/2 cursor-pointer top-1/2 right-3"
                            >
                                {showConfirmPassword ? (
                                    <FaEye className="w-5 h-5" />
                                ) : (
                                    <FaEyeSlash className="w-5 h-5" />
                                )}
                            </span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full p-4 font-semibold cursor-pointer text-white text-center rounded-md mt-2 ${loading ? 'bg-blue-300' : 'bg-blue-500'
                                }`}
                        >
                            {loading ? <RsuiteLoader size="sm" /> : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

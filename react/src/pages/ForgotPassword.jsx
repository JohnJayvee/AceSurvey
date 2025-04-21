import React, { useState } from 'react';
import axiosClient from '../axios';
import { Loader as RsuiteLoader } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="relative min-h-screen flex flex-col justify-between">
            <div className="flex flex-col items-center my-auto w-full max-w-lg mx-auto">
                {message && (
                    <div className={`w-full text-center font-semibold text-sm rounded-md py-2 px-3 mb-2
                        ${isError
                            ? 'bg-red-100 text-red-500'
                            : 'bg-green-100 text-green-500'}
                    `}>
                        {message}
                    </div>
                )}
                <div className="bg-white drop-shadow-xl p-6 m-4 rounded-lg w-full animated fadeInDown">
                    <form onSubmit={handleSubmit} className="w-full">
                        <h1 className="text-2xl font-semibold text-center my-4">
                            Forgot Password
                        </h1>
                        <input
                            type="text"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-control p-3 my-3"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full p-4 font-semibold cursor-pointer text-white text-center rounded-md mt-2 ${loading ? "bg-blue-300" : "bg-blue-500"}`}
                        >
                            {loading ? <RsuiteLoader size="sm" /> : "Send Reset Link"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

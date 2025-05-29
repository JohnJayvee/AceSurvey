import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import axiosClient from "@api/axios";
import { useStateContext } from "@context/ContextProvider";
import Footer from "@components/Footer";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Loader as RsuiteLoader } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import Bulb from "@components/Bulb";
import logo from "@images/AceLogo.png"; // Update path according to your logo location
import AnimatedBackground from "../components/AnimatedBackground";
import { motion } from "framer-motion";
import ErrorMessage from "@components/ErrorMessage";

export default function Login() {
    const { setCurrentUser, setUserToken } = useStateContext();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const toggleShowPassword = () => setShowPassword(!showPassword);

    const handleLogin = (response) => {
        // Always store user data in localStorage regardless of keepSignedIn
        localStorage.setItem('CURRENT_USER', JSON.stringify(response.user));
        setUserToken(response.token, keepSignedIn, response.user);
    };

    async function onSubmit(ev) {
        ev.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await axiosClient.post("/login", {
                login,
                password,
            });
            setCurrentUser(data.user);
            handleLogin(data);
        } catch (error) {
            let errorMessage = "login or password is incorrect";
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "login or password is incorrect";
                } else {
                    const errors = error.response.data.errors || {
                        message: [error.response.data.message || errorMessage],
                    };
                    const finalErrors = Object.values(errors).reduce(
                        (accum, next) => [...accum, ...next],
                        []
                    );
                    errorMessage = finalErrors.join("<br>");
                }
            }
            setError(errorMessage);
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const inputClassName = "w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-200";
    const eyeIconClassName = "absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200";

    return (
        <div className="relative flex flex-col justify-between min-h-screen">
            <AnimatedBackground />
            <motion.div
                className="absolute z-10 top-10 right-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <Bulb />
            </motion.div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-4 mx-auto my-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full p-8 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
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

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                            <p className="mt-2 text-sm text-gray-600">Login to your account to continue</p>
                        </div>

                        <ErrorMessage error={error} onClear={() => setError("")} />

                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">Username</label>
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    value={login}
                                    onChange={(ev) => setLogin(ev.target.value)}
                                    className={inputClassName}
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(ev) => setPassword(ev.target.value)}
                                        className={inputClassName}
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
                        </div>

                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <label className="flex items-center justify-center sm:justify-start">
                                <input
                                    type="checkbox"
                                    checked={keepSignedIn}
                                    onChange={(ev) => setKeepSignedIn(ev.target.checked)}
                                    className="w-4 h-4 text-blue-600 transition-colors border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="ml-2 text-sm text-gray-600">Keep me signed in</span>
                            </label>

                            <div className="text-center sm:text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
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
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                "Sign in"
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </div>

            {/* <Footer className="relative z-10" /> */}
        </div>
    );
}


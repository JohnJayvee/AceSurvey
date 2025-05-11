import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import axiosClient from "../axios";
import { useStateContext } from "../contexts/ContextProvider";
import Footer from "../components/Footer";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Loader as RsuiteLoader } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import Bulb from "../components/Bulb";
import logo from "/AceLogo.png"; // Update path according to your logo location

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

    return (
        <div className="relative flex flex-col justify-between min-h-screen">
            <div className="absolute top-10 right-10">
                <Bulb />
            </div>
            <div className="flex flex-col items-center w-full max-w-lg mx-auto my-auto">
                <div className="w-full p-6 m-4 bg-white rounded-lg drop-shadow-xl animated fadeInDown">
                    <div className="flex justify-center mb-6">
                        <img
                            src={logo}
                            loading="lazy"
                            alt="Logo"
                            // className="w-auto h-16"
                            className="w-auto h-36"
                        />
                    </div>
                    <form onSubmit={onSubmit} className="w-full">
                        <h1 className="my-4 text-2xl font-semibold text-center">
                            Login into your account
                        </h1>
                        {error && (
                            <div
                                className="w-full px-3 py-2 mb-2 text-sm font-semibold text-center text-red-400 bg-red-100 rounded-md"
                                dangerouslySetInnerHTML={{ __html: error }}
                            ></div>
                        )}
                        <input
                            type="text"
                            placeholder="Login"
                            value={login}
                            onChange={(ev) => setLogin(ev.target.value)}
                            className="p-3 my-3 form-control"
                        />
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(ev) => setPassword(ev.target.value)}
                                className="w-full p-3 pr-10 my-3 form-control"
                            />
                            <span
                                onClick={toggleShowPassword}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                            >
                                {showPassword ? (
                                    <FaEye className="w-5 h-5 mr-2 text-gray-500" />
                                ) : (
                                    <FaEyeSlash className="w-5 h-5 mr-2 text-gray-500" />
                                )}
                            </span>
                        </div>
                        <div className="flex items-center my-3">
                            <input
                                type="checkbox"
                                checked={keepSignedIn}
                                onChange={(ev) => setKeepSignedIn(ev.target.checked)}
                                className="form-checkbox"
                            />
                            <label className="ml-2 text-sm text-gray-600">
                                Keep me signed in
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full p-4 font-semibold cursor-pointer text-white text-center rounded-md mt-2 ${loading ? "bg-blue-300" : "bg-blue-500"
                                }`}

                        >
                            {loading ? <RsuiteLoader size="sm" /> : "Login"}
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <Link
                            to="/forgot-password" // Forgot Password link
                            className="text-sm text-blue-500 hover:underline"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}


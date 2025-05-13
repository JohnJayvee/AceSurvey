import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../axios.js";
import Footer from "../components/Footer.jsx";
import { FaEye, FaEyeSlash, FaLightbulb } from "react-icons/fa";
import { Loader as RsuiteLoader } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import Bulb from "../components/Bulb.jsx";

export default function Signup() {
    const { setCurrentUser, setUserToken } = useStateContext();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState({ __html: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);
    const [loading, setLoading] = useState(false);
    const [openAboutPopup, setOpenAboutPopup] = useState(false);

    const handleOpenAbout = () => {
        setOpenAboutPopup(true);
    };

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowPasswordConfirmation = () =>
        setShowPasswordConfirmation(!showPasswordConfirmation);

    const onSubmit = (ev) => {
        ev.preventDefault();
        setError({ __html: "" });
        setLoading(true);

        axiosClient
            .post("/signup", {
                name: fullName,
                email,
                password,
                password_confirmation: passwordConfirmation,
            })
            .then(({ data }) => {
                setCurrentUser(data.user);
                setUserToken(data.token);
            })
            .catch((error) => {
                if (error.response) {
                    const errors = error.response.data.errors || {
                        message: [
                            error.response.data.message || "An error occurred",
                        ],
                    };
                    const finalErrors = Object.values(errors).reduce(
                        (accum, next) => [...accum, ...next],
                        []
                    );
                    setError({ __html: finalErrors.join("<br>") });
                } else {
                    setError({ __html: "An error occurred" });
                }
                console.error(error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="relative flex flex-col justify-between min-h-screen">
            <div className="absolute top-10 right-10">
                <Bulb />
            </div>
            <div className="flex flex-col items-center w-full max-w-lg mx-auto my-auto">
                {error.__html && (
                    <div
                        className="w-full px-3 py-2 mb-2 text-sm font-semibold text-center text-red-400 bg-red-100 rounded-md"
                        dangerouslySetInnerHTML={error}
                    ></div>
                )}
                <div className="w-full p-6 m-4 bg-white rounded-lg drop-shadow-xl animated fadeInDown">
                    <form onSubmit={onSubmit}>
                        <h1 className="my-4 text-2xl font-semibold text-center">
                            Signup for free
                        </h1>
                        <input
                            type="text"
                            placeholder="Full name"
                            value={fullName}
                            onChange={(ev) => setFullName(ev.target.value)}
                            className="p-3 my-3 form-control"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(ev) => setEmail(ev.target.value)}
                            className="p-3 my-3 form-control"
                            required
                        />
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(ev) => setPassword(ev.target.value)}
                                className="w-full p-3 pr-10 my-3 form-control"
                                required
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
                        <div className="relative">
                            <input
                                type={
                                    showPasswordConfirmation
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Confirm password"
                                value={passwordConfirmation}
                                onChange={(ev) =>
                                    setPasswordConfirmation(ev.target.value)
                                }
                                className="w-full p-3 pr-10 my-3 form-control"
                                required
                            />
                            <span
                                onClick={toggleShowPasswordConfirmation}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                            >
                                {showPasswordConfirmation ? (
                                    <FaEye className="w-5 h-5 mr-2 text-gray-500" />
                                ) : (
                                    <FaEyeSlash className="w-5 h-5 mr-2 text-gray-500" />
                                )}
                            </span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full p-4 font-semibold cursor-pointer text-white text-center rounded-md mt-2 ${loading ? "bg-blue-300" : "bg-blue-500"
                                }`}
                        >
                            {loading ? <RsuiteLoader size="sm" /> : "Signup"}
                        </button>
                        <p className="mt-4 text-sm text-center text-slate-500 md:text-base">
                            Have an account?{" "}
                            <Link
                                to="/login"
                                className="text-blue-500"
                                style={{ textDecoration: "none" }}
                            >
                                Login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}

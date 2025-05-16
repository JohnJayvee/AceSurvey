import React, { useState, useEffect, useRef } from "react";
import Divider from "@mui/material/Divider";
import { VscSignOut } from "react-icons/vsc";
import { FaUnlockAlt, FaUserCircle, FaEnvelope } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Eye icons for show/hide
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../axios";
import logo from "/AceLogo.png";
import { motion, AnimatePresence } from "framer-motion";

const inputClassName =
    "relative block w-full px-4 py-2.5 mt-1 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-200";
const buttonClassName =
    "relative z-10 flex items-center justify-center w-full gap-2 px-4 py-2.5 font-medium text-white transition-all duration-200 rounded-lg focus:ring-2 focus:ring-offset-2";
const eyeIconClassName =
    "absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 z-20";

export default function UserProfilePopup({ onLogout }) {
    const { currentUser, setCurrentUser, showToast } = useStateContext();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
    const [currentEmail, setCurrentEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newEmailConfirmation, setNewEmailConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
    const [showNewPassword, setShowNewPassword] = useState(false); // State to toggle new password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State to toggle confirm password visibility
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return; // skip if already fetched
        hasFetched.current = true;

        axiosClient.get("/me").then(({ data }) => {
            setCurrentUser(data);
            setCurrentEmail(data.email);
        });
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoadingPassword(true);
        try {
            const response = await axiosClient.post("/change-password", {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirmation,
            });

            setMessage(response.data.message);
            showToast("Password changed successfully");
            closePasswordModal();
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleChangeEmail = async (e) => {
        e.preventDefault();
        setLoadingEmail(true);

        if (!newEmail || !newEmailConfirmation) {
            showToast("New email and confirmation are required.");
            setLoadingEmail(false);

            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            showToast("Please enter a valid email address.");
            setLoadingEmail(false);
            return;
        }

        if (newEmail !== newEmailConfirmation) {
            showToast("New email and confirmation do not match.");
            setLoadingEmail(false);
            return;
        }

        try {
            const response = await axiosClient.post("/change-email", {
                current_email: currentEmail,
                email: newEmail,
                new_email_confirmation: newEmailConfirmation,
            });

            setMessage(response.data.message);
            showToast("Email changed successfully");
            closeEmailModal();
        } catch (error) {
            handleErrorResponse(error);
        } finally {
            setLoadingEmail(false);
        }
    };

    const handleErrorResponse = (error) => {
        const { response } = error;
        if (response?.data) {
            const { message, errors } = response.data;

            if (errors) {
                const allErrors = Object.values(errors).flat();
                showToast(
                    <div>
                        {allErrors.map((err, i) => (
                            <div key={i}>{err}</div>
                        ))}
                    </div>
                );
            } else if (message) {
                showToast(message);
            } else {
                showToast(response.data.error || "An unexpected error occurred");
            }
        } else {
            showToast("Network error or server not responding");
        }
    };

    const openPasswordModal = () => {
        setIsPasswordModalOpen(true);
    };

    const closePasswordModal = () => {
        setIsPasswordModalOpen(false);
        setMessage("");
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordConfirmation("");
    };

    const openEmailModal = () => {
        setIsEmailModalOpen(true);
    };

    const closeEmailModal = () => {
        setIsEmailModalOpen(false);
        setMessage("");
        setNewEmail("");
        setNewEmailConfirmation("");
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative p-6 mt-3 bg-white border-0 shadow-xl rounded-xl w-80 md:mt-0 z-[100]"
        >
            <div className="relative z-50">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative z-50 flex flex-col items-center mb-6"
                >
                    <div className="relative">
                        <div className="p-2 overflow-hidden rounded-full bg-blue-50">
                            <img
                                src={logo}
                                loading="lazy"
                                alt=""
                                className="w-auto h-24 transition-transform duration-300 hover:scale-105"
                            />
                        </div>
                        <div className="absolute transform translate-x-1/2 -translate-y-1/2 bottom-2 right-3">
                            <div className="w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{currentUser.name}</h3>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                </motion.div>

                <Divider className="mb-4" />

                <div className="relative z-50 space-y-2">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openPasswordModal}
                        className="flex items-center w-full p-3 transition-all duration-200 bg-white border border-gray-100 cursor-pointer rounded-xl hover:border-blue-200 hover:bg-blue-50 group"
                    >
                        <div className="flex items-center justify-center w-10 h-10 transition-colors bg-blue-100 rounded-lg group-hover:bg-blue-200">
                            <FaUnlockAlt className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="ml-3 font-medium text-gray-700 group-hover:text-blue-600">Change Password</span>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openEmailModal}
                        className="flex items-center w-full p-3 transition-all duration-200 bg-white border border-gray-100 cursor-pointer rounded-xl hover:border-purple-200 hover:bg-purple-50 group"
                    >
                        <div className="flex items-center justify-center w-10 h-10 transition-colors bg-purple-100 rounded-lg group-hover:bg-purple-200">
                            <FaEnvelope className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="ml-3 font-medium text-gray-700 group-hover:text-purple-600">Change Email</span>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onLogout}
                        className="flex items-center w-full p-3 transition-all duration-200 bg-white border border-gray-100 cursor-pointer rounded-xl hover:border-red-200 hover:bg-red-50 group"
                    >
                        <div className="flex items-center justify-center w-10 h-10 transition-colors bg-red-100 rounded-lg group-hover:bg-red-200">
                            <VscSignOut className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="ml-3 font-medium text-gray-700 group-hover:text-red-600">Logout</span>
                    </motion.div>
                </div>

                <AnimatePresence>
                    {isPasswordModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                            style={{ zIndex: 9999 }}
                            onClick={closePasswordModal}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-md p-6 bg-white shadow-xl rounded-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                                    <button
                                        onClick={closePasswordModal}
                                        className="p-2 text-gray-400 transition-colors duration-200 rounded-full hover:bg-gray-100 hover:text-gray-600"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) =>
                                                    setCurrentPassword(e.target.value)
                                                }
                                                className={inputClassName}
                                                placeholder="Enter current password"
                                            />
                                            <div
                                                onClick={() =>
                                                    setShowPassword(!showPassword)
                                                }
                                                className={eyeIconClassName}
                                            >
                                                {showPassword ? (
                                                    <FaEyeSlash className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                                ) : (
                                                    <FaEye className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) =>
                                                    setNewPassword(e.target.value)
                                                }
                                                className={inputClassName}
                                                placeholder="Enter new password"
                                            />
                                            <div
                                                onClick={() =>
                                                    setShowNewPassword(!showNewPassword)
                                                }
                                                className={eyeIconClassName}
                                            >
                                                {showNewPassword ? (
                                                    <FaEyeSlash className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                                ) : (
                                                    <FaEye className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={newPasswordConfirmation}
                                                onChange={(e) =>
                                                    setNewPasswordConfirmation(
                                                        e.target.value
                                                    )
                                                }
                                                className={inputClassName}
                                                placeholder="Confirm new password"
                                            />
                                            <div
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        !showConfirmPassword
                                                    )
                                                }
                                                className={eyeIconClassName}
                                            >
                                                {showConfirmPassword ? (
                                                    <FaEyeSlash className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                                ) : (
                                                    <FaEye className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loadingPassword}
                                        className={`${buttonClassName} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 ${loadingPassword
                                            ? "opacity-75 cursor-not-allowed"
                                            : ""
                                            }`}
                                    >
                                        {loadingPassword && (
                                            <span className="w-5 h-5 border-2 rounded-full border-white/80 border-t-transparent animate-spin" />
                                        )}
                                        Change Password
                                    </button>
                                </form>
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 mt-4 text-sm text-red-600 rounded-lg bg-red-50"
                                    >
                                        {message}
                                    </motion.div>
                                )}
                                <button
                                    onClick={closePasswordModal}
                                    className={`${buttonClassName} mt-4 bg-red-500 hover:bg-red-600 focus:ring-gray-400`}
                                >
                                    Cancel
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isEmailModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                            style={{ zIndex: 9999 }}
                            onClick={closeEmailModal}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-md p-6 bg-white shadow-xl rounded-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Change Email</h2>
                                    <button
                                        onClick={closeEmailModal}
                                        className="p-2 text-gray-400 transition-colors duration-200 rounded-full hover:bg-gray-100 hover:text-gray-600"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <form onSubmit={handleChangeEmail} className="space-y-4">
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                                            Current Email
                                        </label>
                                        <input
                                            type="email"
                                            value={currentEmail}
                                            className={`${inputClassName} bg-gray-50 text-gray-500`}
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                                            New Email
                                        </label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) =>
                                                setNewEmail(e.target.value)
                                            }
                                            className={inputClassName}
                                            placeholder="Enter new email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                                            Confirm New Email
                                        </label>
                                        <input
                                            type="email"
                                            value={newEmailConfirmation}
                                            onChange={(e) =>
                                                setNewEmailConfirmation(
                                                    e.target.value
                                                )
                                            }
                                            className={inputClassName}
                                            placeholder="Confirm new email"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loadingEmail}
                                        className={`${buttonClassName} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 ${loadingEmail
                                            ? "opacity-75 cursor-not-allowed"
                                            : ""
                                            }`}
                                    >
                                        {loadingEmail && (
                                            <span className="w-5 h-5 border-2 rounded-full border-white/80 border-t-transparent animate-spin" />
                                        )}
                                        Change Email
                                    </button>
                                </form>
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 mt-4 text-sm text-red-600 rounded-lg bg-red-50"
                                    >
                                        {message}
                                    </motion.div>
                                )}
                                <button
                                    onClick={closeEmailModal}
                                    className={`${buttonClassName} mt-4 bg-red-500 hover:bg-red-600 focus:ring-gray-400`}
                                >
                                    Cancel
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

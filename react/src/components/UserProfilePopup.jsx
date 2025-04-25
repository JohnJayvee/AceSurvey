import React, { useState, useEffect, useRef } from "react";
import Divider from "@mui/material/Divider";
import { VscSignOut } from "react-icons/vsc";
import { FaUnlockAlt, FaUserCircle, FaEnvelope } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";  // Eye icons for show/hide
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../axios";
import logo from "../../public/AceLogo.png";

const UserProfilePopup = ({ onLogout }) => {
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
    const [showPassword, setShowPassword] = useState(false);  // State to toggle password visibility
    const [showNewPassword, setShowNewPassword] = useState(false);  // State to toggle new password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);  // State to toggle confirm password visibility
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
        <div className="bg-white p-4 rounded-xl drop-shadow-xl border mt-3 border-gray-300 w-72 relative md:mt-0">
            <div className="flex items-center justify-center mb-4">
                <div className="relative">
                    {/* <FaUserCircle size={85} className="text-gray-300 self-center" /> */}
                    <img src={logo} alt="" className="h-24 w-auto" />
                    <div className="absolute bottom-2 right-3 transform translate-x-1/2 -translate-y-1/2">
                        <div className="h-3 w-3 bg-green-500 rounded-full" />
                    </div>
                </div>
            </div>
            <div className="text-center mb-4">
                <p className="text-base font-semibold">{currentUser.name}</p>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
            </div>

            <Divider />

            <div
                onClick={openPasswordModal}
                className="flex items-center w-full p-2 bg-white hover:bg-gray-100 rounded-full mb-1 cursor-pointer mt-2"
            >
                <div className="p-2 bg-gray-300 rounded-full w-10 flex justify-center items-center">
                    <FaUnlockAlt size={22} />
                </div>
                <span className="ml-2">Change Password</span>
            </div>

            <div
                onClick={openEmailModal}
                className="flex items-center w-full p-2 bg-white hover:bg-gray-100 rounded-full mb-1 cursor-pointer mt-2"
            >
                <div className="p-2 bg-gray-300 rounded-full w-10 flex justify-center items-center">
                    <FaEnvelope size={22} />
                </div>
                <span className="ml-2">Change Email</span>
            </div>

            <div
                onClick={onLogout}
                className="flex items-center w-full p-2 bg-white hover:bg-gray-100 rounded-full mb-1 cursor-pointer mt-2"
            >
                <div className="p-2 bg-gray-300 rounded-full w-10 flex justify-center items-center">
                    <VscSignOut size={22} />
                </div>
                <span className="ml-2">Logout</span>
            </div>

            {isPasswordModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-md w-80">
                        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <div
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-2 cursor-pointer"
                                    >
                                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                    </div>
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <div
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-2 top-2 cursor-pointer"
                                    >
                                        {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                    </div>
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={newPasswordConfirmation}
                                        onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <div
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-2 top-2 cursor-pointer"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loadingPassword}
                                className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex justify-center items-center gap-2"
                            >
                                {loadingPassword && (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                )}
                                Change Password
                            </button>
                            {message && (
                                <div className="mt-2 text-center text-red-500 whitespace-pre-line">
                                    {message}
                                </div>
                            )}
                        </form>
                        <button
                            onClick={closePasswordModal}
                            className="w-full p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 mt-4"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {isEmailModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-md w-80">
                        <h2 className="text-lg font-semibold mb-4">Change Email</h2>
                        <form onSubmit={handleChangeEmail}>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">Current Email</label>
                                <input
                                    type="email"
                                    value={currentEmail}
                                    onChange={(e) => setCurrentEmail(e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    disabled
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">New Email</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">Confirm New Email</label>
                                <input
                                    type="email"
                                    value={newEmailConfirmation}
                                    onChange={(e) => setNewEmailConfirmation(e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loadingEmail}
                                className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex justify-center items-center gap-2"
                            >
                                {loadingEmail && (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                )}
                                Change Email
                            </button>
                            {message && (
                                <div className="mt-2 text-center text-red-500 whitespace-pre-line">
                                    {message}
                                </div>
                            )}
                        </form>
                        <button
                            onClick={closeEmailModal}
                            className="w-full p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 mt-4"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfilePopup;

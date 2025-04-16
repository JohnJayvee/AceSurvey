import React, { useState, useEffect } from "react";
import Divider from "@mui/material/Divider";
import { VscSignOut } from "react-icons/vsc";
import { FaUserCircle } from "react-icons/fa";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../axios";

const UserProfilePopup = ({ onLogout }) => {
    const { currentUser, setCurrentUser, showToast } = useStateContext();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        axiosClient.get("/me").then(({ data }) => {
            setCurrentUser(data);
        });
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosClient.post("/change-password", {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirmation,
            });

            setMessage(response.data.message);
            showToast("Password changed successfully");
            closeModal();
        } catch (error) {
            const { response } = error;
            if (response?.data) {
                const { message, errors } = response.data;

                if (errors) {
                    // Combine and show all error messages, separated by newlines
                    const allErrors = Object.values(errors).flat();
                    const formattedMessage = allErrors.join("\n"); // Join with newline for toast
                    showToast(
                        <div>
                            {allErrors.map((err, i) => (
                                <div key={i}>{err}</div>  // Render each error in a separate line
                            ))}
                        </div>
                    );
                    // setMessage(formattedMessage); // Set the message for modal
                } else if (message) {
                    showToast(message);
                    // setMessage(message);
                } else {
                    showToast(response.data.error || "An unexpected error occurred");
                    //setMessage("An unexpected error occurred");
                }
            } else {
                showToast("Network error or server not responding");
                // setMessage("Network error or server not responding");
            }
        }
    };


    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setMessage("");
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordConfirmation("");
    };

    return (
        <div className="bg-white p-4 rounded-xl drop-shadow-xl border mt-3 border-gray-300 w-72 relative md:mt-0">
            <div className="flex items-center justify-center mb-4">
                <div className="relative">
                    <FaUserCircle size={85} className="text-gray-300 self-center" />
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
                onClick={openModal}
                className="flex items-center w-full p-2 bg-white hover:bg-gray-100 rounded-full mb-1 cursor-pointer mt-2"
            >
                <div className="p-2 bg-gray-300 rounded-full w-10 flex justify-center items-center">
                    <FaUserCircle size={22} />
                </div>
                <span className="ml-2">Change Password</span>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-md w-80">
                        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={newPasswordConfirmation}
                                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Change Password
                            </button>

                            {/* Show message */}
                            {message && (
                                <div className="mt-2 text-center text-red-500 whitespace-pre-line">
                                    {message}
                                </div>
                            )}
                        </form>
                        <button
                            onClick={closeModal}
                            className="w-full p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 mt-4"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <Divider />

            <div
                onClick={onLogout}
                className="flex items-center w-full p-2 bg-white hover:bg-gray-100 rounded-full mb-1 cursor-pointer mt-2"
            >
                <div className="p-2 bg-gray-300 rounded-full w-10 flex justify-center items-center">
                    <VscSignOut size={22} />
                </div>
                <span className="ml-2">Log out</span>
            </div>
        </div>
    );
};

export default UserProfilePopup;

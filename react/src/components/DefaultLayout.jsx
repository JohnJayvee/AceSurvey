import React, { useEffect, useState, useRef } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../axios";
import Toast from "./Toast";
import UserProfilePopup from "./UserProfilePopup";
import { Unstable_Popup as BasePopup } from "@mui/base/Unstable_Popup";
import Footer from "./Footer";
import logo from "/AceLogo.png"; // Update path according to your logo location
import { motion, AnimatePresence } from "framer-motion";
import {
    HomeIcon,
    ClipboardDocumentListIcon,
    Bars3Icon,
    XMarkIcon
} from "@heroicons/react/24/outline";

// Add a cache object at the top level
const cache = {};

export default function DefaultLayout() {
    const { currentUser, userToken, setCurrentUser, setUserToken } = useStateContext();
    const [isUserProfilePopupOpen, setIsUserProfilePopupOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState(null);
    const [placement, setPlacement] = useState("bottom-end");

    // Use a ref to prevent duplicate fetches
    const hasFetchedRef = useRef(false);

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Close mobile menu when navigation occurs
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    useEffect(() => {
        // First check if we have cached user data
        if (cache['user']) {
            console.log("Using cached user data");
            setCurrentUser(cache['user']);
            return;
        }

        // Skip if already fetched during this component lifecycle
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        // Using simple Promise with then/catch as per your friend's pattern
        axiosClient.get("/me")
            .then(({ data }) => {
                // Store in cache for future use
                cache['user'] = data;
                setCurrentUser(data);
            })
            .catch((error) => {
                console.error("Error fetching user data:", error);
            });
    }, [userToken, setCurrentUser]);

    const onLogout = (ev) => {
        ev.preventDefault();

        // Simple Promise pattern for logout
        axiosClient.post("logout")
            .then(() => {
                // Clear user data
                setCurrentUser({});
                setUserToken(null);
                // Clear cache on logout
                delete cache['user'];
                // Reset fetch flag to allow fetching again if user logs back in
                hasFetchedRef.current = false;
            })
            .catch(error => {
                console.error("Logout error:", error);
            });
    };

    const toggleUserProfilePopup = (event) => {
        setIsUserProfilePopupOpen((prev) => !prev);
        setAnchor(event.currentTarget);
    };

    const handleClose = () => {
        setIsUserProfilePopupOpen(false);
    };

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                anchor &&
                !anchor.contains(event.target) &&
                !event.target.closest(".action-popup")
            ) {
                setIsUserProfilePopupOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [anchor]);

    if (!userToken) {
        return <Navigate to="login" />;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm backdrop-blur-lg bg-opacity-90"
            >
                <div className="flex items-center gap-2">
                    {/* Mobile hamburger menu button */}
                    <button
                        className="p-2 mr-2 text-gray-600 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none"
                        onClick={toggleMobileMenu}
                    >
                        {isMobileMenuOpen ? (
                            <XMarkIcon className="w-6 h-6" />
                        ) : (
                            <Bars3Icon className="w-6 h-6" />
                        )}
                    </button>

                    {/* <img
                        src={logo}
                        alt="Ace Survey Logo"
                        className="w-auto h-10"
                    /> */}
                    <div className="items-center hidden gap-1 md:flex">
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg
                                ${isActive
                                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
                            }
                        >
                            <HomeIcon className="w-5 h-5" />
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink
                            to="/surveys"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg
                                ${isActive
                                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
                            }
                        >
                            <ClipboardDocumentListIcon className="w-5 h-5" />
                            <span>Surveys</span>
                        </NavLink>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3"
                    >
                        <div className="items-center hidden gap-3 px-4 py-2 text-sm text-gray-600 rounded-lg md:flex bg-gray-50">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">{currentUser.name}</span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative"
                            onClick={toggleUserProfilePopup}
                        >
                            <img
                                src={currentUser.avatar || logo}
                                alt="Profile"
                                className="w-10 h-10 transition-all duration-200 rounded-full ring-2 ring-gray-100 hover:ring-blue-200"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = logo;
                                }}
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 flex flex-col w-3/4 h-full max-w-xs pt-16 pb-4 overflow-y-auto bg-white shadow-xl md:hidden"
                    >
                        <div className="flex flex-col gap-1 px-3">
                            <NavLink
                                to="/dashboard"
                                onClick={closeMobileMenu}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg
                                    ${isActive
                                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
                                }
                            >
                                <HomeIcon className="w-5 h-5" />
                                <span>Dashboard</span>
                            </NavLink>
                            <NavLink
                                to="/surveys"
                                onClick={closeMobileMenu}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg
                                    ${isActive
                                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
                                }
                            >
                                <ClipboardDocumentListIcon className="w-5 h-5" />
                                <span>Surveys</span>
                            </NavLink>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop for mobile menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-30 bg-black md:hidden"
                        onClick={closeMobileMenu}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-grow p-4 bg-gradient-to-br from-gray-50 to-gray-100 md:p-6"
            >
                <Outlet />
            </motion.div>

            <Toast />

            {isUserProfilePopupOpen && (
                <BasePopup
                    id="user-profile-popup"
                    open={isUserProfilePopupOpen}
                    anchor={anchor}
                    placement={placement}
                    offset={8}
                    onClose={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="action-popup"
                    >
                        <UserProfilePopup onLogout={onLogout} />
                    </motion.div>
                </BasePopup>
            )}
        </div>
    );
}

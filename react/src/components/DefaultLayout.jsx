import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../axios";
import Toast from "./Toast";
import UserProfilePopup from "./UserProfilePopup";
import { Unstable_Popup as BasePopup } from "@mui/base/Unstable_Popup";
import Footer from "./Footer";
import logo from "/AceLogo.png"; // Update path according to your logo location
import logo1 from "/ace_logo.png"; // Update path according to your logo location
import { motion, AnimatePresence } from "framer-motion";
import {
    HomeIcon,
    ClipboardDocumentListIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";

// Add a cache object at the top level
const cache = {};

export default function DefaultLayout() {
    const { currentUser, userToken, setCurrentUser, setUserToken } = useStateContext();
    const [isUserProfilePopupOpen, setIsUserProfilePopupOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
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

    // Toggle sidebar collapsed state
    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    // Handle sidebar hover
    const handleSidebarMouseEnter = () => {
        if (isSidebarCollapsed) {
            setIsSidebarHovered(true);
        }
    };

    const handleSidebarMouseLeave = () => {
        setIsSidebarHovered(false);
    };

    // Determine if sidebar should be expanded (either not collapsed or hovered)
    const shouldExpandSidebar = !isSidebarCollapsed || isSidebarHovered;

    // Handle window resize to maintain sidebar state
    useLayoutEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { // md breakpoint
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load sidebar collapsed state from localStorage
    useEffect(() => {
        const savedSidebarState = localStorage.getItem('sidebar-collapsed');
        if (savedSidebarState) {
            setIsSidebarCollapsed(JSON.parse(savedSidebarState));
        }
    }, []);

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
        <div className="flex min-h-screen overflow-x-hidden">
            {/* Desktop Left Sidebar with Hover Expand */}
            <motion.div
                initial={{ x: -240, opacity: 0 }}
                animate={{
                    x: 0,
                    opacity: 1,
                    width: shouldExpandSidebar ? '16rem' : '64px'
                }}
                transition={{
                    duration: 0.25,
                    ease: "easeInOut",
                    width: { duration: 0.25, ease: "easeInOut" }
                }}
                className="sticky top-0 z-40 flex-col hidden h-screen overflow-hidden bg-white border-r border-gray-200 shadow-sm md:flex"
                style={{
                    minWidth: shouldExpandSidebar ? '16rem' : '64px',
                    maxWidth: shouldExpandSidebar ? '16rem' : '64px',
                    flexShrink: 0
                }}
                onMouseEnter={handleSidebarMouseEnter}
                onMouseLeave={handleSidebarMouseLeave}
            >
                <div className={`p-1 border-b border-gray-200 ${!shouldExpandSidebar ? 'flex justify-center' : ''}`}>
                    <AnimatePresence mode="wait">
                        {!shouldExpandSidebar ? (
                            <motion.img
                                key="small-logo"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15, delay: 0.1 }}
                                src={logo}
                                alt="Ace Survey Logo"
                                className="w-auto h-12 mx-auto"
                            />
                        ) : (
                            <motion.img
                                key="large-logo"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15, delay: 0.1 }}
                                src={logo1}
                                alt="Ace Survey Logo"
                                className="w-auto h-12 mx-auto"
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div className={`flex flex-col gap-2 overflow-hidden ${!shouldExpandSidebar ? 'p-2' : 'p-4'}`}>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `flex items-center transition-all duration-250 rounded-lg ${!shouldExpandSidebar ? 'px-2 justify-center' : 'px-4 gap-2'
                            } py-3 text-sm font-medium ${isActive
                                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                        }
                        title={!shouldExpandSidebar ? "Dashboard" : ""}
                    >
                        <HomeIcon className="flex-shrink-0 w-5 h-5" />
                        <motion.span
                            initial={false}
                            animate={{
                                opacity: shouldExpandSidebar ? 1 : 0,
                                width: shouldExpandSidebar ? "auto" : 0,
                                marginLeft: shouldExpandSidebar ? "0.5rem" : 0
                            }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden whitespace-nowrap"
                            style={{ display: shouldExpandSidebar ? 'block' : 'none' }}
                        >
                            Dashboard
                        </motion.span>
                    </NavLink>

                    <NavLink
                        to="/surveys"
                        className={({ isActive }) =>
                            `flex items-center transition-all duration-250 rounded-lg ${!shouldExpandSidebar ? 'px-2 justify-center' : 'px-4 gap-2'
                            } py-3 text-sm font-medium ${isActive
                                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                        }
                        title={!shouldExpandSidebar ? "Surveys" : ""}
                    >
                        <ClipboardDocumentListIcon className="flex-shrink-0 w-5 h-5" />
                        <motion.span
                            initial={false}
                            animate={{
                                opacity: shouldExpandSidebar ? 1 : 0,
                                width: shouldExpandSidebar ? "auto" : 0,
                                marginLeft: shouldExpandSidebar ? "0.5rem" : 0
                            }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden whitespace-nowrap"
                            style={{ display: shouldExpandSidebar ? 'block' : 'none' }}
                        >
                            Surveys
                        </motion.span>
                    </NavLink>
                </div>

                {/* Footer section that only shows when expanded */}
                <AnimatePresence>
                    {shouldExpandSidebar && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                            className="p-3 mt-auto overflow-hidden border-t border-gray-200"
                        >
                            <div className="text-xs text-center text-gray-500">
                                © 2024 Ace Survey
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Mobile Sidebar Menu - Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-y-0 left-0 z-50 flex flex-col w-3/4 h-full max-w-xs overflow-y-auto bg-white shadow-xl md:hidden"
                    >
                        <div className="px-4 py-3 mb-4 border-b border-red-200">
                            <img
                                src={logo1}
                                alt="Ace Survey Logo"
                                className="w-auto h-12 mx-auto"
                            />
                        </div>
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
                        className="fixed inset-0 z-40 bg-black md:hidden"
                        onClick={closeMobileMenu}
                    />
                )}
            </AnimatePresence>

            {/* Main Content Area with Header and Content */}
            <div className="flex flex-col flex-grow min-w-0 transition-all duration-300">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm backdrop-blur-lg bg-opacity-90 md:px-6"
                >
                    <div className="flex items-center min-w-0 gap-2">
                        {/* Mobile hamburger menu button */}
                        <button
                            className="flex-shrink-0 p-2 text-gray-600 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none"
                            onClick={toggleMobileMenu}
                        >
                            {isMobileMenuOpen ? (
                                <XMarkIcon className="w-6 h-6" />
                            ) : (
                                <Bars3Icon className="w-6 h-6" />
                            )}
                        </button>

                        {/* Desktop sidebar toggle button with company name */}
                        <div className="flex items-center min-w-0 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="hidden p-2 text-gray-600 rounded-lg md:block hover:bg-gray-100 focus:outline-none"
                                onClick={toggleSidebar}
                                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                <AnimatePresence mode="wait">
                                    {isSidebarCollapsed ? (
                                        <motion.div
                                            key="expand"
                                            initial={{ rotate: -90 }}
                                            animate={{ rotate: 0 }}
                                            exit={{ rotate: 90 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="collapse"
                                            initial={{ rotate: 90 }}
                                            animate={{ rotate: 0 }}
                                            exit={{ rotate: -90 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronLeftIcon className="w-5 h-5" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>

                            {/* Company Name - Shows on both mobile and desktop */}
                            <div className="min-w-0">
                                {/* Desktop version */}
                                <div className="hidden md:block">
                                    <h1 className="font-semibold text-gray-800 truncate text-md">
                                        Ace Survey
                                    </h1>
                                    <p className="text-xs text-gray-500 truncate">
                                        Survey Management Platform
                                    </p>
                                </div>

                                {/* Mobile version */}
                                <div className="block md:hidden">
                                    <h1 className="text-lg font-semibold text-gray-800 truncate">
                                        Ace Survey
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center flex-shrink-0 gap-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3"
                        >
                            <div className="items-center hidden gap-3 px-4 py-2 text-sm text-gray-600 rounded-lg md:flex bg-gray-50">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-medium truncate">{currentUser.name}</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative flex-shrink-0"
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

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-grow p-4 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 md:p-6"
                >
                    <Outlet />
                </motion.div>
            </div>

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

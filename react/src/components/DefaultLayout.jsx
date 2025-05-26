import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useStateContext } from "@context/ContextProvider";
import axiosClient from "@api/axios";
import Toast from "@components/Toast";
import UserProfilePopup from "@components/UserProfilePopup";
import { Unstable_Popup as BasePopup } from "@mui/base/Unstable_Popup";
import logo from "@images/AceLogo.png";
import banner from "@images/AceBanner.png";
import { motion, AnimatePresence } from "framer-motion";
import {
    HomeIcon,
    ClipboardDocumentListIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";

// Global cache to prevent recreation
let userCache = null;

export default function DefaultLayout() {
    const { currentUser, userToken, setCurrentUser, setUserToken } = useStateContext();
    const [isUserProfilePopupOpen, setIsUserProfilePopupOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        try {
            const saved = localStorage.getItem('sidebar-collapsed');
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [anchor, setAnchor] = useState(null);

    // Refs for cleanup
    const hasFetchedRef = useRef(false);
    const resizeTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);
    const cleanupRef = useRef([]);
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);

    // Compute expanded state
    const shouldExpandSidebar = !isSidebarCollapsed || isSidebarHovered;

    // Direct DOM manipulation for sidebar animation
    const updateSidebarWidth = useCallback((expanded) => {
        if (sidebarRef.current && contentRef.current) {
            const width = expanded ? 256 : 64; // 16rem = 256px, 4rem = 64px

            // Use transform instead of width for better performance
            sidebarRef.current.style.width = `${width}px`;
            contentRef.current.style.marginLeft = `${width}px`;
        }
    }, []);

    // Optimized event handlers
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed(prev => {
            const newState = !prev;
            updateSidebarWidth(!newState);

            requestIdleCallback(() => {
                try {
                    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
                } catch (error) {
                    console.warn('Failed to save sidebar state:', error);
                }
            });
            return newState;
        });
    }, [updateSidebarWidth]);

    const handleSidebarMouseEnter = useCallback(() => {
        if (isSidebarCollapsed) {
            setIsSidebarHovered(true);
            updateSidebarWidth(true);
        }
    }, [isSidebarCollapsed, updateSidebarWidth]);

    const handleSidebarMouseLeave = useCallback(() => {
        if (isSidebarHovered) {
            setIsSidebarHovered(false);
            updateSidebarWidth(false);
        }
    }, [isSidebarHovered, updateSidebarWidth]);

    const handleClose = useCallback(() => {
        setIsUserProfilePopupOpen(false);
        setAnchor(null);
    }, []);

    const toggleUserProfilePopup = useCallback((event) => {
        setIsUserProfilePopupOpen(prev => !prev);
        setAnchor(event.currentTarget);
    }, []);

    // Initial sidebar setup
    useLayoutEffect(() => {
        updateSidebarWidth(shouldExpandSidebar);
    }, [shouldExpandSidebar, updateSidebarWidth]);

    // Optimized resize handler
    useLayoutEffect(() => {
        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            resizeTimeoutRef.current = setTimeout(() => {
                if (window.innerWidth >= 768) {
                    setIsMobileMenuOpen(false);
                }
            }, 100);
        };

        window.addEventListener('resize', handleResize, { passive: true });

        const cleanup = () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };

        cleanupRef.current.push(cleanup);
        return cleanup;
    }, []);

    // User data fetching
    useEffect(() => {
        if (!userToken) {
            hasFetchedRef.current = false;
            return;
        }

        if (userCache) {
            setCurrentUser(userCache);
            return;
        }

        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        requestIdleCallback(() => {
            axiosClient.get("/me", { signal: abortControllerRef.current.signal })
                .then(({ data }) => {
                    userCache = data;
                    setCurrentUser(data);
                })
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error("Error fetching user data:", error);
                        hasFetchedRef.current = false;
                    }
                });
        });

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [userToken, setCurrentUser]);

    // Logout handler
    const onLogout = useCallback(async (ev) => {
        ev.preventDefault();

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const logoutController = new AbortController();

        try {
            await axiosClient.post("logout", {}, { signal: logoutController.signal });

            setCurrentUser({});
            setUserToken(null);
            userCache = null;
            hasFetchedRef.current = false;

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Logout error:", error);
            }
        }
    }, [setCurrentUser, setUserToken]);

    // Outside click handler
    useEffect(() => {
        if (!anchor) return;

        const handleOutsideClick = (event) => {
            const target = event.target;
            if (anchor &&
                !anchor.contains(target) &&
                !target.closest(".action-popup") &&
                !target.closest("[data-popup]")) {
                setIsUserProfilePopupOpen(false);
                setAnchor(null);
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener("mousedown", handleOutsideClick, { passive: true });
        }, 50);

        const cleanup = () => {
            clearTimeout(timeoutId);
            document.removeEventListener("mousedown", handleOutsideClick);
        };

        cleanupRef.current.push(cleanup);
        return cleanup;
    }, [anchor]);

    // Master cleanup
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            cleanupRef.current.forEach(cleanup => {
                try {
                    cleanup();
                } catch (error) {
                    console.warn('Cleanup error:', error);
                }
            });
            cleanupRef.current = [];
        };
    }, []);

    if (!userToken) {
        return <Navigate to="login" />;
    }

    return (
        <div className="flex min-h-screen overflow-x-hidden">
            {/* Desktop Sidebar - Pure CSS Performance */}
            <aside
                ref={sidebarRef}
                className="fixed top-0 left-0 z-40 flex-col hidden h-screen overflow-hidden bg-white border-r border-gray-200 shadow-sm md:flex"
                style={{
                    width: shouldExpandSidebar ? '256px' : '64px',
                    transition: 'width 0.2s ease-out',
                    willChange: 'width'
                }}
                onMouseEnter={handleSidebarMouseEnter}
                onMouseLeave={handleSidebarMouseLeave}
            >
                <div className="flex justify-center flex-shrink-0 p-2 border-b border-gray-200">
                    <img
                        src={shouldExpandSidebar ? banner : logo}
                        alt="Ace Survey"
                        className="w-auto h-12"
                        loading="lazy"
                    />
                </div>

                <nav className={`flex flex-col gap-2 flex-1 overflow-hidden ${!shouldExpandSidebar ? 'p-2' : 'p-4'}`}>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `flex items-center rounded-lg py-3 text-sm font-medium ${!shouldExpandSidebar ? 'px-2 justify-center' : 'px-4'
                            } ${isActive
                                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                        }
                        title={!shouldExpandSidebar ? "Dashboard" : ""}
                    >
                        {({ isActive }) => (
                            <>
                                <HomeIcon className={`flex-shrink-0 w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                                {shouldExpandSidebar && (
                                    <span className="ml-2 overflow-hidden whitespace-nowrap">
                                        Dashboard
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>

                    <NavLink
                        to="/surveys"
                        className={({ isActive }) =>
                            `flex items-center rounded-lg py-3 text-sm font-medium ${!shouldExpandSidebar ? 'px-2 justify-center' : 'px-4'
                            } ${isActive
                                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                        }
                        title={!shouldExpandSidebar ? "Surveys" : ""}
                    >
                        {({ isActive }) => (
                            <>
                                <ClipboardDocumentListIcon className={`flex-shrink-0 w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                                {shouldExpandSidebar && (
                                    <span className="ml-2 overflow-hidden whitespace-nowrap">
                                        Surveys
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                </nav>

                {shouldExpandSidebar && (
                    <footer className="flex-shrink-0 p-3 border-t border-gray-200">
                        <div className="text-xs text-center text-gray-500">
                            © 2024 Ace Survey
                        </div>
                    </footer>
                )}
            </aside>

            {/* Mobile Sidebar - Simplified */}
            <AnimatePresence mode="wait">
                {isMobileMenuOpen && (
                    <>
                        <motion.aside
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl md:hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-gray-200">
                                <img src={banner} alt="Ace Survey" className="w-auto h-12 mx-auto" loading="lazy" />
                            </div>
                            <nav className="flex flex-col flex-1 gap-1 p-3 overflow-y-auto">
                                <NavLink
                                    to="/dashboard"
                                    onClick={closeMobileMenu}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                                        }`
                                    }
                                >
                                    <HomeIcon className="w-5 h-5" />
                                    <span>Dashboard</span>
                                </NavLink>
                                <NavLink
                                    to="/surveys"
                                    onClick={closeMobileMenu}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                                        }`
                                    }
                                >
                                    <ClipboardDocumentListIcon className="w-5 h-5" />
                                    <span>Surveys</span>
                                </NavLink>
                            </nav>
                        </motion.aside>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-40 bg-black md:hidden"
                            onClick={closeMobileMenu}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Main Content - Pure CSS */}
            <div
                ref={contentRef}
                className="flex flex-col flex-1 min-w-0"
                style={{
                    marginLeft: shouldExpandSidebar ? '256px' : '64px',
                    transition: 'margin-left 0.2s ease-out',
                    willChange: 'margin-left'
                }}
            >
                <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-gray-200 shadow-sm bg-white/95 backdrop-blur-sm md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 text-gray-600 transition-colors duration-150 rounded-lg md:hidden hover:bg-gray-100"
                            type="button"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={toggleSidebar}
                            className="hidden p-2 text-gray-600 transition-colors duration-150 rounded-lg md:block hover:bg-gray-100"
                            type="button"
                            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {isSidebarCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                        </button>

                        <div>
                            <div className="hidden md:block">
                                <h1 className="text-lg font-semibold text-gray-800">Ace Surveys</h1>
                                <p className="text-xs text-gray-500">Survey Management Platform</p>
                            </div>
                            <h1 className="text-lg font-semibold text-gray-800 md:hidden">Ace Survey</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="items-center hidden gap-2 px-3 py-2 text-sm rounded-lg md:flex bg-gray-50">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">{currentUser.name}</span>
                        </div>
                        <button
                            onClick={toggleUserProfilePopup}
                            className="relative p-1 transition-transform duration-150 rounded-full hover:scale-105"
                            type="button"
                            aria-label="User profile"
                        >
                            <img
                                src={currentUser.avatar || logo}
                                alt="Profile"
                                className="w-10 h-10 transition-all duration-150 rounded-full ring-2 ring-gray-100 hover:ring-blue-200"
                                loading="lazy"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = logo;
                                }}
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 overflow-x-hidden md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                    <Outlet />
                </main>
            </div>

            <Toast />

            {isUserProfilePopupOpen && (
                <BasePopup
                    id="user-profile-popup"
                    open={isUserProfilePopupOpen}
                    anchor={anchor}
                    placement="bottom-end"
                    offset={8}
                    onClose={handleClose}
                >
                    <div className="action-popup" data-popup>
                        <UserProfilePopup onLogout={onLogout} />
                    </div>
                </BasePopup>
            )}
        </div>
    );
}

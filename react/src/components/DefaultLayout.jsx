import React, { useEffect, useState, useRef } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../axios";
import Toast from "./Toast";
import UserProfilePopup from "./UserProfilePopup";
import { Unstable_Popup as BasePopup } from "@mui/base/Unstable_Popup";
import Footer from "./Footer";
import logo from "/AceLogo.png"; // Update path according to your logo location


export default function DefaultLayout() {
    const { currentUser, userToken, setCurrentUser, setUserToken } = useStateContext();
    const [isUserProfilePopupOpen, setIsUserProfilePopupOpen] = useState(false);
    const [anchor, setAnchor] = useState(null);
    const [placement, setPlacement] = useState("bottom-end");

    const hasFetchedRef = useRef(false);

    useEffect(() => {
        // if (!userToken || hasFetchedRef.current) return;
        if (hasFetchedRef.current) return; // skip if already fetched
        hasFetchedRef.current = true;

        axiosClient.get("/me")
            .then(({ data }) => {
                setCurrentUser(data);
                // hasFetchedRef.current = true;
            })
            .catch((error) => {
                console.error("Error fetching user data:", error);
            });
    }, [userToken, setCurrentUser]);

    const onLogout = (ev) => {
        ev.preventDefault();
        axiosClient.post("logout")
            .then(() => {
                setCurrentUser({});
                setUserToken(null);
                hasFetchedRef.current = false;
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
            <div className="flex items-center justify-between px-8 py-4 bg-white border-gray-200 border-b-1">
                <div className="flex gap-4">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `p-2 rounded-md cursor-pointer ${isActive ? "bg-primary text-white" : "hover:bg-gray-100"}`
                        }
                        style={{ textDecoration: "none" }}
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/surveys"
                        className={({ isActive }) =>
                            `p-2 rounded-md cursor-pointer ${isActive ? "bg-primary text-white" : "hover:bg-gray-100"}`
                        }
                        style={{ textDecoration: "none" }}
                    >
                        Surveys
                    </NavLink>
                </div>
                <div className="flex gap-4">
                    <p className="self-center hidden font-semibold text-center text-slate-500 md:block">
                        {currentUser.name}
                    </p>
                    {/* <FaUserCircle
                        size={48}
                        className="self-center p-2 text-gray-300 rounded-full cursor-pointer hover:bg-gray-100"
                        onClick={toggleUserProfilePopup}
                    /> */}
                    <img src={logo} alt="" loading="lazy" className="self-center w-auto h-12 rounded-full cursor-pointer" onClick={toggleUserProfilePopup} />

                </div>
            </div>

            <div className="flex-grow p-4 bg-gray-100 md:p-6">
                <Outlet />
            </div>

            <Toast />

            {isUserProfilePopupOpen && (
                <BasePopup
                    id="simple-popper"
                    open={isUserProfilePopupOpen}
                    anchor={anchor}
                    placement={placement}
                    offset={4}
                    onClose={handleClose}
                >
                    <div className="action-popup">
                        <UserProfilePopup onLogout={onLogout} />
                    </div>
                </BasePopup>
            )}
        </div>
    );
}

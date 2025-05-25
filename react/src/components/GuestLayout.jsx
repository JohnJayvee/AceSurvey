import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useStateContext } from "@context/ContextProvider";

export default function GuestLayout() {
    const { userToken } = useStateContext();

    if (userToken) {
        return <Navigate to="/" />;
    }

    return (
        <div className="min-h-screen px-4 bg-gray-50">
            <Outlet />

        </div>
    );
}

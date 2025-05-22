import React from "react";
import { Link } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";

export default function NotFound() {
    return (
        <>
            <AnimatedBackground />
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
                <div className="w-full max-w-md p-8 mx-auto text-center transition-all transform bg-white border border-gray-100 shadow-lg rounded-xl hover:shadow-xl">
                    <div className="mb-6 text-red-600">
                        {/* Warning Icon */}
                        <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                    </div>

                    <h1 className="mb-2 font-extrabold text-transparent text-7xl bg-clip-text bg-gradient-to-r from-red-600 to-red-500">404</h1>
                    <div className="w-16 h-1 mx-auto my-3 bg-red-600 rounded"></div>

                    <h2 className="mb-4 text-2xl font-semibold text-gray-700">Page Not Found</h2>

                    <p className="mb-8 text-gray-500">
                        The page you are looking for doesn't exist or has been moved to another location.
                    </p>

                    <Link
                        to="/"
                        className="block w-full px-6 py-3 text-base font-medium text-white transition duration-300 transform bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Return to Dashboard
                    </Link>

                    <p className="mt-6 text-sm text-gray-500">
                        If you believe this is an error, please <span className="text-indigo-600 cursor-pointer hover:underline">contact support</span>.
                    </p>
                </div>

                <div className="mt-8 text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} AceSurvey
                </div>
            </div>
        </>
    );
}

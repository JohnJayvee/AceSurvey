import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import GuestLayout from "./components/GuestLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { createBrowserRouter, Navigate } from "react-router-dom";
import DefaultLayout from "./components/DefaultLayout";
import Dashboard from "./pages/Dashboard";
import Surveys from "./pages/Surveys";
import SurveyView from "./pages/SurveyView";
import SurveyPublicView from "./pages/SurveyPublicView";
import SurveyResponse from "./pages/SurveyResponse";
import Respondent from "./pages/Respondent";

const capitalizeFirstLetter = (string) => {
    return string.replace(/\b\w/g, char => char.toUpperCase());
};

const DynamicTitle = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        let title = ""; // Default title

        if (path === "/login") {
            title = "Login";
        } else if (path === "/signup") {
            title = "Signup";
        } else if (path === "/dashboard") {
            title = "Dashboard";
        } else if (path === "/surveys") {
            title = "Surveys";
        } else if (path === "/surveys/create") {
            title = "Survey Create";
        } else if (path.startsWith("/survey/public/")) {
            const slug = path.split("/")[3].replace(/-/g, ' ');
            title = `${capitalizeFirstLetter(slug)} Survey`;
        } else if (path.startsWith("/surveys/")) {
            if (path.includes("/responses")) {
                title = "Survey Responses";
            } else if (path.match(/^\/surveys\/\d+$/)) {
                title = "Survey Edit";
            } else {
                title = "Survey View";
            }
        }

        document.title = title;
    }, [location]);

    return children;
};

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <DynamicTitle>
                <DefaultLayout />
            </DynamicTitle>
        ),
        children: [
            {
                path: "/",
                element: <Navigate to="/dashboard" />,
            },
            {
                path: "/dashboard",
                element: <Dashboard />,
            },
            {
                path: "/surveys",
                element: <Surveys />,
            },
            {
                path: "/surveys/create",
                element: <SurveyView />,
            },
            {
                path: "/surveys/:id",
                element: <SurveyView />,
            },
            {
                path: "/surveys/:id/responses",
                element: <SurveyResponse />,
            },
            {
                path: "/surveys/:surveyId/responses/:responseId",
                element: <Respondent />,
            },
        ],
    },
    {
        path: "/",
        element: (
            <DynamicTitle>
                <GuestLayout />
            </DynamicTitle>
        ),
        children: [
            {
                path: "/login",
                element: <Login />,
            },
            {
                path: "/signup",
                element: <Signup />,
            },
        ],
    },
    {
        path: "/survey/public/:slug",
        element: (
            <DynamicTitle>
                <SurveyPublicView />
            </DynamicTitle>
        ),
    },
]);

export default router;

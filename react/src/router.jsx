import React, { useEffect, Suspense } from "react";
import { useLocation } from "react-router-dom";
import "@css/main.css";
import { createBrowserRouter, Navigate } from "react-router-dom";
const GuestLayout = React.lazy(() => import("@components/GuestLayout"));
const Login = React.lazy(() => import("@pages/Login"));
const Signup = React.lazy(() => import("@pages/Signup"));
const DefaultLayout = React.lazy(() => import("@components/DefaultLayout"));
const Dashboard = React.lazy(() => import("@pages/Dashboard"));
const Surveys = React.lazy(() => import("@pages/Surveys"));
const SurveyView = React.lazy(() => import("@pages/SurveyView"));
const SurveyPublicView = React.lazy(() => import("@pages/SurveyPublicView"));
const SurveyResponse = React.lazy(() => import("@pages/SurveyResponse"));
const Respondent = React.lazy(() => import("@pages/Respondent"));
const ForgotPassword = React.lazy(() => import("@pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("@pages/ResetPassword"));
const NotFound = React.lazy(() => import("@pages/NotFound"));

// Import the custom loading spinner with animation
import Loading from '@components/Loading';

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
        } else if (path === "/forgot-password") {
            title = "Forgot Password";
        } else if (path.startsWith("/reset-password/")) {
            title = "Reset Password";
        } else if (path === "/404") {
            title = "404 - Page Not Found";
        }

        document.title = title;
    }, [location]);

    return children;
};

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <Suspense fallback={<Loading />}>
                <DynamicTitle>
                    <DefaultLayout />
                </DynamicTitle>
            </Suspense>
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
            <Suspense fallback={<Loading />}>
                <DynamicTitle>
                    <GuestLayout />
                </DynamicTitle>
            </Suspense>
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
            {
                path: "/forgot-password",
                element: <ForgotPassword />,
            },
            {
                path: "/reset-password/:token",
                element: <ResetPassword />,
            },
        ],
    },
    {
        path: "/survey/public/:slug",
        element: (
            <Suspense fallback={<Loading />}>
                <DynamicTitle>
                    <SurveyPublicView />
                </DynamicTitle>
            </Suspense>
        ),
    },
    {
        path: "*",
        element: (
            <Suspense fallback={<Loading />}>
                <DynamicTitle>
                    <NotFound />
                </DynamicTitle>
            </Suspense>
        ),
    },
]);

export default router;

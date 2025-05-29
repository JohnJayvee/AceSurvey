import React, { useEffect, useState, useRef } from "react";
import {
    ArrowTopRightOnSquareIcon,
    EyeIcon,
    LinkIcon,
    PhotoIcon,
    TrashIcon,
    UsersIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import TButton from "@components/core/TButton";
import axiosClient from "@api/axios.js";
import { useNavigate, useParams } from "react-router-dom";
import SurveyQuestions from "@components/SurveyQuestions.jsx";
import { useStateContext } from "@context/ContextProvider.jsx";
import ShareSurveyPopup from "../components/ShareSurveyPopup.jsx";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { FaArrowLeft } from "react-icons/fa6";
import { motion } from "framer-motion";
import { debounce } from 'lodash';
import ErrorMessage from "@components/ErrorMessage";
import logo from "@images/AceLogo.png";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Add window size hook for responsiveness
const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
    });

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        if (typeof window !== 'undefined') {
            window.addEventListener("resize", handleResize);
            handleResize();
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener("resize", handleResize);
            }
        };
    }, []);

    return windowSize;
};

const cache = {};
const isFetching = {};

const cacheManager = {
    clear: (pattern) => {
        if (pattern === 'surveys') {
            // Clear surveys list cache
            Object.keys(cache).forEach(key => {
                if (key.includes('survey') || key.includes('/survey')) {
                    delete cache[key];
                }
            });

            // Also clear any global survey caches
            if (window.surveysCache) window.surveysCache = {};
            if (window.pageCache) window.pageCache = {};

            // Clear localStorage survey caches if they exist
            Object.keys(localStorage).forEach(key => {
                if (key.includes('survey') || key.includes('surveys')) {
                    localStorage.removeItem(key);
                }
            });
        } else if (pattern) {
            delete cache[pattern];
        }
    },

    clearAll: () => {
        Object.keys(cache).forEach(key => delete cache[key]);
        if (window.surveysCache) window.surveysCache = {};
        if (window.pageCache) window.pageCache = {};
    }
};

export default function SurveyView() {
    const { showToast } = useStateContext();
    const navigate = useNavigate();
    const { id } = useParams();
    const { width } = useWindowSize();
    const [openSharePopup, setOpenSharePopup] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const hasFetched = useRef(false);

    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        return tomorrow.toISOString().split("T")[0];
    };

    const [survey, setSurvey] = useState({
        title: "",
        slug: "",
        status: true,
        description: "",
        image: null,
        image_url: null,
        expire_date: getTomorrowDate(),
        questions: [],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [surveyToDelete, setSurveyToDelete] = useState(null);

    // Add clear error function
    const clearError = () => {
        setError("");
    };

    // Debounce file reader operation
    const onImageChoose = debounce((ev) => {
        const file = ev.target.files[0];

        const reader = new FileReader();
        reader.onload = () => {
            setSurvey({
                ...survey,
                image: file,
                image_url: reader.result,
            });

            ev.target.value = "";
        };
        reader.readAsDataURL(file);
    }, 300);

    // Make sure the form submission is only triggered by the submit button
    const onSubmit = (ev) => {
        ev.preventDefault();
        ev.stopPropagation(); // Prevent event bubbling
        handleSubmit(ev);
    };

    // Update handleSubmit to be more explicit about when to save
    const handleSubmit = debounce((ev) => {
        // Only proceed if this is an actual form submission
        if (!ev || ev.type !== 'submit') {
            return;
        }

        const payload = { ...survey };
        if (payload.image) {
            payload.image = payload.image_url;
        }
        delete payload.image_url;

        // Your friend's pattern uses simple Promise chains
        let res = null;
        if (id) {
            res = axiosClient.put(`/survey/${id}`, payload);
        } else {
            res = axiosClient.post("/survey", payload);
        }

        res.then((res) => {
            console.log(res);
            navigate("/surveys");
            if (id) {
                showToast("The survey was updated");
            } else {
                showToast("The survey was created");
            }
        }).catch((err) => {
            if (err && err.response) {
                if (err.response.data.errors) {
                    const allErrors = Object.values(err.response.data.errors).flat();
                    setError(allErrors.join('\n'));
                } else {
                    setError(err.response.data.message);
                }
            }
            console.log(err, err.response);
        });
    }, 300);

    // Updated delete functions
    const onDeleteClick = (id) => {
        setSurveyToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        axiosClient.delete(`/survey/${surveyToDelete}`)
            .then(() => {
                setSurvey();
                navigate("/surveys");
                showToast("The survey was deleted");
                setShowDeleteModal(false);
            })
            .catch(error => {
                console.error("Error deleting survey:", error);
                showToast("Failed to delete the survey");
                setShowDeleteModal(false);
            });
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSurveyToDelete(null);
    };

    // Replace the debounced handleDeleteClick with onDeleteClick
    const handleDeleteClick = debounce((id) => {
        onDeleteClick(id);
    }, 300);

    // Update the onQuestionsUpdate function to not trigger automatic saves
    function onQuestionsUpdate(questions) {
        // Only update local state, don't trigger save
        setSurvey(prevSurvey => ({
            ...prevSurvey,
            questions
        }));
    }

    // Update your fetch logic with your friend's pattern
    useEffect(() => {
        if (!id) return;

        // Check cache first
        if (cache[id]) {
            console.log("Using cached survey data for ID:", id);
            setSurvey(cache[id]);
            setLoading(false);
            return;
        }

        // Skip if already fetched by this component
        if (hasFetched.current) return;
        hasFetched.current = true;

        // Check if this survey is already being fetched globally
        if (isFetching[id]) {
            console.log("Request for this survey already in progress");

            // Poll for cache updates instead of making a new request
            const checkCache = setInterval(() => {
                if (cache[id]) {
                    clearInterval(checkCache);
                    setSurvey(cache[id]);
                    setLoading(false);
                }
            }, 100);

            return () => clearInterval(checkCache);
        }

        // Mark as fetching
        isFetching[id] = true;
        setLoading(true);

        // Make the API request using your friend's pattern
        axiosClient.get(`/survey/${id}`)
            .then(({ data }) => {
                // Store in cache
                cache[id] = data.data;
                setSurvey(data.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching survey:", error);
                setError("Failed to load the survey");
                setLoading(false);
            })
            .finally(() => {
                // Mark as no longer fetching
                isFetching[id] = false;
            });
    }, [id]);

    const isSurveyExpired = (expireDate) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const expiration = new Date(expireDate).setHours(0, 0, 0, 0);
        return expiration <= today;
    };

    // Debounce UI interactions
    const handleOpenShare = debounce(() => {
        setShareLink(`${window.location.origin}/survey/public/${survey.slug}`);
        setOpenSharePopup(true);
    }, 300);

    // Debounce navigation
    const handleGoBack = debounce(() => {
        navigate(-1);
    }, 300);

    const handleViewResponses = debounce((surveyId) => {
        navigate(`/surveys/${surveyId}/responses`);
    }, 300);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {loading && (
                <div className="px-4 py-8 mx-auto max-w-7xl">
                    <div className="mb-8">
                        <Skeleton height={40} width={width < 640 ? 250 : 300} />
                        <Skeleton height={20} width={width < 640 ? 300 : 400} className="mt-2" />
                    </div>

                    <div className="p-4 mb-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                            <Skeleton width={40} height={40} borderRadius={8} />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton width={width < 640 ? 80 : 100} height={40} borderRadius={8} />
                                <Skeleton width={width < 640 ? 80 : 100} height={40} borderRadius={8} />
                                <Skeleton width={width < 640 ? 80 : 100} height={40} borderRadius={8} />
                                <Skeleton width={width < 640 ? 80 : 100} height={40} borderRadius={8} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="overflow-hidden bg-white shadow-sm rounded-xl">
                            <div className="p-4 space-y-6 sm:p-6 lg:p-8">
                                <div className="grid gap-8 lg:grid-cols-2">
                                    <div className="space-y-4">
                                        <Skeleton height={width < 640 ? 150 : 200} className="rounded-lg" />
                                        <Skeleton height={40} className="rounded-lg" />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-4">
                                            <Skeleton height={24} width={150} className="mb-2" />
                                            <Skeleton height={48} className="rounded-lg" />
                                        </div>

                                        <div className="p-4">
                                            <Skeleton height={24} width={150} className="mb-2" />
                                            <Skeleton height={width < 640 ? 80 : 100} className="rounded-lg" />
                                            <Skeleton height={16} width={width < 640 ? 250 : 300} className="mt-2" />
                                        </div>

                                        <div className="p-4">
                                            <Skeleton height={24} width={150} className="mb-2" />
                                            <Skeleton height={48} className="rounded-lg" />
                                        </div>

                                        <div className="p-4">
                                            <Skeleton height={24} width={150} className="mb-2" />
                                            <Skeleton height={60} className="rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white shadow-sm sm:p-6 rounded-xl">
                            <Skeleton height={30} width={200} className="mb-4" />
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="mb-6">
                                    <Skeleton height={60} className="mb-2 rounded-lg" />
                                    <Skeleton height={40} width="80%" />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <Skeleton height={40} width={120} className="rounded-lg" />
                        </div>
                    </div>
                </div>
            )}
            {!loading && (
                <div className="px-4 py-8 mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 sm:mb-8"
                    >
                        <h1 className="text-lg font-bold leading-tight text-gray-900 sm:text-xl md:text-2xl lg:text-3xl">
                            {!id ? "Create New Survey" : "Edit Survey"}
                        </h1>
                        <p className="mt-1 text-xs leading-snug text-gray-600 sm:mt-2 sm:text-sm md:text-base">
                            Fill in the information below to {id ? "update" : "create"} your survey.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="sticky top-0 z-10 flex flex-col justify-between gap-3 p-3 mb-4 bg-white border border-gray-100 shadow-sm sm:flex-row sm:p-4 sm:mb-6 rounded-xl backdrop-blur-xl bg-opacity-90 sm:gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <Tooltip title="Go Back" placement="bottom" TransitionComponent={Fade}>
                                <button
                                    onClick={handleGoBack}
                                    className="p-1.5 sm:p-2 transition-all duration-200 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                                >
                                    <FaArrowLeft className="w-4 h-4 text-gray-700 sm:w-5 sm:h-5" />
                                </button>
                            </Tooltip>
                        </div>

                        {id && (
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <Tooltip title="Share Survey" placement="bottom" TransitionComponent={Fade}>
                                    <button
                                        onClick={handleOpenShare}
                                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 transition-all duration-200 rounded-lg bg-blue-50 hover:bg-blue-100"
                                    >
                                        <ArrowTopRightOnSquareIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">{width < 768 ? "Share" : "Share"}</span>
                                    </button>
                                </Tooltip>

                                <Tooltip title="View Responses" placement="bottom" TransitionComponent={Fade}>
                                    <button
                                        onClick={() => handleViewResponses(survey.id)}
                                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-green-600 transition-all duration-200 rounded-lg bg-green-50 hover:bg-green-100"
                                    >
                                        <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">{width < 768 ? "Views" : "Responses"}</span>
                                    </button>
                                </Tooltip>

                                <Tooltip title="Preview Survey" placement="bottom" TransitionComponent={Fade}>
                                    <a
                                        href={`/survey/public/${survey.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-purple-600 transition-all duration-200 rounded-lg bg-purple-50 hover:bg-purple-100"
                                    >
                                        <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">{width < 768 ? "View" : "Preview"}</span>
                                    </a>
                                </Tooltip>

                                <Tooltip title="Delete Survey" placement="bottom" TransitionComponent={Fade}>
                                    <button
                                        onClick={(ev) => handleDeleteClick(survey.id)}
                                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 transition-all duration-200 rounded-lg bg-red-50 hover:bg-red-100"
                                    >
                                        <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">{width < 768 ? "Del" : "Delete"}</span>
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </motion.div>

                    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="overflow-hidden bg-white shadow-sm rounded-xl"
                        >
                            <div className="p-3 space-y-4 sm:p-4 md:p-6 lg:p-8 sm:space-y-6">
                                <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                                    <div className="space-y-3 sm:space-y-4">
                                        {/* Image section with better responsive sizing */}
                                        <div className="overflow-hidden rounded-lg aspect-video bg-gray-50">
                                            {survey.image_url ? (
                                                <img
                                                    src={survey.image_url}
                                                    alt="Survey cover"
                                                    className="object-cover w-full h-full transition-all duration-300 hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full bg-gray-50">
                                                    <img
                                                        src={logo}
                                                        alt="Default Survey"
                                                        className="object-cover w-auto h-full transition-all duration-300 hover:scale-105"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={onImageChoose}
                                                className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <button
                                                type="button"
                                                className="relative flex items-center justify-center w-full gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            >
                                                <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Choose Image
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 sm:space-y-6">
                                        {/* Survey Title Input with better responsive sizing */}
                                        <div className="relative p-3 sm:p-4 group">
                                            <label className="inline-flex items-center mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base font-semibold text-gray-900">
                                                <span>Survey Title</span>
                                                <span className="ml-1 text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={survey.title}
                                                    onChange={(ev) => setSurvey({ ...survey, title: ev.target.value })}
                                                    className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Enter survey title"
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none sm:pr-3">
                                                    <svg className="w-3 h-3 text-gray-400 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Survey Description Input with better responsive sizing */}
                                        <div className="relative p-3 sm:p-4 group">
                                            <label className="inline-flex items-center mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base font-semibold text-gray-900">
                                                <span>Description</span>
                                                <span className="ml-1 text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    value={survey.description || ""}
                                                    onChange={(ev) => setSurvey({ ...survey, description: ev.target.value })}
                                                    rows={width < 640 ? 2 : width < 768 ? 3 : 4}
                                                    className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Describe your survey"
                                                />
                                                <div className="absolute pointer-events-none top-2 sm:top-3 right-2 sm:right-3">
                                                    <svg className="w-3 h-3 text-gray-400 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs leading-tight text-gray-500 sm:mt-2">
                                                Provide a clear description of your survey's purpose and objectives
                                            </p>
                                        </div>

                                        {/* Expire Date Input with better responsive sizing */}
                                        <div className="relative p-3 sm:p-4 group">
                                            <label className="inline-flex items-center mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base font-semibold text-gray-900">
                                                <span>Expire Date</span>
                                                <span className="ml-1 text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={survey.expire_date}
                                                    onChange={(ev) => setSurvey({ ...survey, expire_date: ev.target.value })}
                                                    className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    style={{ colorScheme: 'light' }}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none sm:pr-3">
                                                    <svg className="w-3 h-3 text-gray-400 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {isSurveyExpired(survey.expire_date) && (
                                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-xs text-red-600">
                                                    <svg className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="leading-tight">This survey has expired and is closed to responses</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Toggle with better responsive sizing */}
                                        <div className="relative p-3 transition-all duration-200 bg-white border border-gray-100 rounded-lg sm:p-4 hover:border-blue-200">
                                            <label className="inline-flex items-center mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base font-semibold text-gray-900">
                                                <span>Survey Status</span>
                                            </label>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 rounded-lg bg-gray-50 gap-2.5 sm:gap-0">
                                                <div>
                                                    <p className="text-xs font-medium leading-tight text-gray-900 sm:text-sm">
                                                        {survey.status && !isSurveyExpired(survey.expire_date)
                                                            ? "Currently accepting responses"
                                                            : "Not accepting responses"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 leading-tight mt-0.5">
                                                        Toggle to enable or disable survey responses
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-center sm:justify-end">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={survey.status && !isSurveyExpired(survey.expire_date)}
                                                            onChange={(ev) => {
                                                                const isChecked = ev.target.checked;
                                                                const isExpired = isSurveyExpired(survey.expire_date);
                                                                setSurvey({
                                                                    ...survey,
                                                                    status: isChecked && !isExpired,
                                                                });
                                                            }}
                                                            className="sr-only peer"
                                                            disabled={isSurveyExpired(survey.expire_date)}
                                                        />
                                                        <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-disabled:bg-gray-100 peer-disabled:after:bg-gray-300">
                                                        </div>
                                                        <span className="ml-2 text-xs font-medium text-gray-700 sm:ml-3 sm:text-sm peer-checked:text-blue-600 peer-disabled:text-gray-400">
                                                            {survey.status && !isSurveyExpired(survey.expire_date) ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Error message with responsive sizing */}
                        {error && <div className="my-3 sm:my-4">
                            <ErrorMessage error={error} onClear={clearError} />
                        </div>}

                        {/* Questions section with responsive sizing */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-white shadow-sm sm:p-4 md:p-6 rounded-xl"
                        >
                            <SurveyQuestions
                                questions={survey.questions}
                                onQuestionsUpdate={onQuestionsUpdate}
                            />
                        </motion.div>

                        {/* Submit button with responsive sizing */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-end"
                        >
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {id ? "Update Survey" : "Create Survey"}
                            </button>
                        </motion.div>
                    </form>

                    {/* Add the delete confirmation modal */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-50">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl"
                            >
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-center text-gray-900">
                                    Delete Survey
                                </h3>
                                <p className="mb-6 text-sm text-center text-gray-500">
                                    Are you sure you want to delete this survey? This action cannot be undone.
                                </p>
                                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                                    <button
                                        onClick={cancelDelete}
                                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg sm:w-auto hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg sm:w-auto hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Yes, delete
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    <ShareSurveyPopup
                        openSharePopup={openSharePopup}
                        setOpenSharePopup={setOpenSharePopup}
                        shareLink={shareLink}
                    />
                </div>
            )}
        </div>
    );
}

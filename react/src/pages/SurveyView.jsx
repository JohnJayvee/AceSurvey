import React, { useEffect, useState, useRef } from "react";
import {
    ArrowTopRightOnSquareIcon,
    EyeIcon,
    LinkIcon,
    PhotoIcon,
    TrashIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import TButton from "../components/core/TButton";
import axiosClient from "../axios.js";
import { useNavigate, useParams } from "react-router-dom";
import SurveyQuestions from "../components/SurveyQuestions.jsx";
import { useStateContext } from "../contexts/ContextProvider.jsx";
import Loader from "../components/Loader.jsx";
import ShareSurveyPopup from "../components/ShareSurveyPopup.jsx";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { FaArrowLeft } from "react-icons/fa6";
import { motion } from "framer-motion";
import { debounce } from 'lodash';

const cache = {};
const isFetching = {};

export default function SurveyView() {
    const { showToast } = useStateContext();
    const navigate = useNavigate();
    const { id } = useParams();
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

    // Debounce form submission
    const handleSubmit = debounce((ev) => {
        ev.preventDefault();

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

    // Need immediate preventDefault
    const onSubmit = (ev) => {
        ev.preventDefault();
        handleSubmit(ev);
    };

    // Debounce delete operation
    const handleDeleteClick = debounce((id) => {
        if (window.confirm("Are you sure you want to delete this survey?")) {
            axiosClient.delete(`/survey/${id}`)
                .then(() => {
                    setSurvey();
                    navigate("/surveys");
                    showToast("The survey was deleted");
                })
                .catch(error => {
                    console.error("Error deleting survey:", error);
                    showToast("Failed to delete the survey");
                });
        }
    }, 300);

    function onQuestionsUpdate(questions) {
        setSurvey({ ...survey, questions });
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
            {loading && <Loader />}
            {!loading && (
                <div className="px-4 py-8 mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold text-gray-900">
                            {!id ? "Create New Survey" : "Edit Survey"}
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Fill in the information below to {id ? "update" : "create"} your survey.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="sticky top-0 z-10 flex justify-between p-4 mb-6 bg-white border border-gray-100 shadow-sm rounded-xl backdrop-blur-xl bg-opacity-90"
                    >
                        <div className="flex items-center space-x-2">
                            <Tooltip title="Go Back" placement="bottom" TransitionComponent={Fade}>
                                <button
                                    onClick={handleGoBack}
                                    className="p-2 transition-all duration-200 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                                >
                                    <FaArrowLeft className="w-5 h-5 text-gray-700" />
                                </button>
                            </Tooltip>
                        </div>

                        {id && (
                            <div className="flex items-center gap-2">
                                <Tooltip title="Share Survey" placement="bottom" TransitionComponent={Fade}>
                                    <button
                                        onClick={handleOpenShare}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 transition-all duration-200 rounded-lg bg-blue-50 hover:bg-blue-100"
                                    >
                                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                        Share
                                    </button>
                                </Tooltip>

                                <Tooltip title="View Responses" placement="bottom" TransitionComponent={Fade}>
                                    <button
                                        onClick={() => handleViewResponses(survey.id)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 transition-all duration-200 rounded-lg bg-green-50 hover:bg-green-100"
                                    >
                                        <UsersIcon className="w-4 h-4" />
                                        Responses
                                    </button>
                                </Tooltip>

                                <Tooltip title="Preview Survey" placement="bottom" TransitionComponent={Fade}>
                                    <a
                                        href={`/survey/public/${survey.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 transition-all duration-200 rounded-lg bg-purple-50 hover:bg-purple-100"
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                        Preview
                                    </a>
                                </Tooltip>

                                <Tooltip title="Delete Survey" placement="bottom" TransitionComponent={Fade}>
                                    <button
                                        onClick={(ev) => handleDeleteClick(survey.id)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 rounded-lg bg-red-50 hover:bg-red-100"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Delete
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 mb-6 text-sm text-red-600 rounded-lg bg-red-50"
                            style={{ whiteSpace: 'pre-line' }}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </motion.div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="overflow-hidden bg-white shadow-sm rounded-xl"
                        >
                            <div className="p-6 space-y-6 lg:p-8">
                                <div className="grid gap-8 lg:grid-cols-2">
                                    <div className="space-y-4">
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
                                                        src="/default-survey-image.jpg"
                                                        alt="Default Survey"
                                                        className="object-cover w-auto h-full transition-all duration-300 hover:scale-105"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/AceLogo.png";
                                                        }}
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
                                                className="relative flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            >
                                                <PhotoIcon className="w-5 h-5" />
                                                Choose Image
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Survey Title Input */}
                                        <div className="relative p-4 group">
                                            <label className="inline-flex items-center mb-2 text-base font-semibold text-gray-900">
                                                <span>Survey Title</span>
                                                <span className="ml-1 text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={survey.title}
                                                    onChange={(ev) => setSurvey({ ...survey, title: ev.target.value })}
                                                    className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Enter survey title"
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Survey Description Input */}
                                        <div className="relative p-4 group">
                                            <label className="inline-flex items-center mb-2 text-base font-semibold text-gray-900">
                                                <span>Description</span>
                                                <span className="ml-1 text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    value={survey.description || ""}
                                                    onChange={(ev) => setSurvey({ ...survey, description: ev.target.value })}
                                                    rows={4}
                                                    className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Describe your survey"
                                                />
                                                <div className="absolute pointer-events-none top-3 right-3">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500">
                                                Provide a clear description of your survey's purpose and objectives
                                            </p>
                                        </div>

                                        {/* Expire Date Input */}
                                        <div className="relative p-4 group">
                                            <label className="inline-flex items-center mb-2 text-base font-semibold text-gray-900">
                                                <span>Expire Date</span>
                                                <span className="ml-1 text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={survey.expire_date}
                                                    onChange={(ev) => setSurvey({ ...survey, expire_date: ev.target.value })}
                                                    className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    style={{ colorScheme: 'light' }}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {isSurveyExpired(survey.expire_date) && (
                                                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>This survey has expired and is closed to responses</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Toggle */}
                                        <div className="relative p-4 transition-all duration-200 bg-white border border-gray-100 rounded-lg hover:border-blue-200">
                                            <label className="inline-flex items-center mb-2 text-base font-semibold text-gray-900">
                                                <span>Survey Status</span>
                                            </label>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {survey.status && !isSurveyExpired(survey.expire_date)
                                                            ? "Currently accepting responses"
                                                            : "Not accepting responses"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Toggle to enable or disable survey responses
                                                    </p>
                                                </div>
                                                <div className="flex items-center">
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
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer
                                                            peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600
                                                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border
                                                            after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:bg-gray-100
                                                            peer-disabled:after:bg-gray-300">
                                                        </div>
                                                        <span className="ml-3 text-sm font-medium text-gray-700 peer-checked:text-blue-600 peer-disabled:text-gray-400">
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

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-white shadow-sm rounded-xl"
                        >
                            <SurveyQuestions
                                questions={survey.questions}
                                onQuestionsUpdate={onQuestionsUpdate}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-end"
                        >
                            <button
                                type="submit"
                                className="px-6 py-2 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {id ? "Update Survey" : "Create Survey"}
                            </button>
                        </motion.div>
                    </form>

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

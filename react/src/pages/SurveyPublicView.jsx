import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../axios";
import PublicQuestionView from "../components/PublicQuestionView";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import AnimatedBackground from "../components/AnimatedBackground";
import { motion } from "framer-motion";
import { debounce } from 'lodash';

const isFetching = {}; // Keep this but use it properly
const cache = {};

export default function SurveyPublicView() {
    const answers = {};
    const [surveyFinished, setSurveyFinished] = useState(false);
    const [survey, setSurvey] = useState({
        questions: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submissionError, setSubmissionError] = useState(null);
    const { slug } = useParams();
    const hasFetched = useRef(false);

    useEffect(() => {
        // Check cache first
        if (cache[slug]) {
            console.log("Using cached survey data for slug:", slug);
            setSurvey(cache[slug]);
            setLoading(false);
            return;
        }

        // Check if this slug is already being fetched globally
        if (isFetching[slug]) {
            console.log("Request for this slug already in progress");
            // Wait for the existing request to complete
            const checkCache = setInterval(() => {
                if (cache[slug]) {
                    clearInterval(checkCache);
                    setSurvey(cache[slug]);
                    setLoading(false);
                }
            }, 100);

            // Cleanup interval if component unmounts
            return () => clearInterval(checkCache);
        }

        // Mark this slug as being fetched globally
        isFetching[slug] = true;
        console.log("Starting new request for slug:", slug);

        setLoading(true);

        // Make the API request
        axiosClient.get(`survey/get-by-slug/${slug}`)
            .then(({ data }) => {
                console.log("Survey data received for slug:", slug);
                // Cache the data
                cache[slug] = data.data;
                // Update state if component is still mounted
                setSurvey(data.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching survey:", error);
                if (error.response && error.response.status === 404) {
                    setError(error.response.data.message);
                } else {
                    setError("An error occurred while loading the survey.");
                }
                setLoading(false);
            })
            .finally(() => {
                // Clear the fetching flag when done
                isFetching[slug] = false;
            });

        // Cleanup function for component unmount
        return () => {
            // Don't clear the cache, but do clear the fetching flag if this component unmounts
            if (isFetching[slug]) {
                console.log("Component unmounted during fetch, clearing flag");
                isFetching[slug] = false;
            }
        };
    }, [slug]); // Only run again if slug changes

    // Debounce the submit function to prevent double-clicks
    const submitSurvey = debounce(() => {
        // Clear any previous errors
        setSubmissionError(null);

        axiosClient.post(`/survey/${survey.id}/answer`, {
            answers,
        })
            .then((response) => {
                setSurveyFinished(true);
            })
            .catch(error => {
                console.error("Error submitting survey:", error);
                setSubmissionError(
                    error.response?.data?.message ||
                    "There was a problem submitting your response. Please try again."
                );
            });
    }, 300);

    function answerChanged(question, value) {
        answers[question.id] = value;
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="w-11/12 py-12 mx-auto md:w-3/4 xl:w-1/2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 mb-6 bg-white border-0 shadow-lg rounded-2xl backdrop-blur-xl"
                    >
                        <div className="flex flex-col gap-6 md:flex-row">
                            <div className="w-full md:w-1/2">
                                <Skeleton height={400} className="rounded-xl" />
                            </div>
                            <div className="w-full space-y-4 md:w-1/2">
                                <Skeleton height={48} className="w-3/4" />
                                <Skeleton count={2} height={24} />
                                <Skeleton height={120} className="rounded-xl" />
                            </div>
                        </div>
                    </motion.div>
                    {[1, 2, 3].map((index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 mb-4 bg-white shadow-lg rounded-2xl backdrop-blur-xl"
                        >
                            <Skeleton height={32} width={200} className="mb-4" />
                            <Skeleton count={4} height={24} className="mb-2" />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="flex flex-col items-center p-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="p-4 mt-16 bg-red-100 rounded-full"
                    >
                        <ExclamationTriangleIcon className="w-24 h-24 text-red-500" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-8 mt-6 text-center bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl max-w-[40rem]"
                    >
                        <h1 className="text-2xl font-bold text-gray-900">
                            {error}
                        </h1>
                        <p className="mt-4 text-gray-600">
                            Please check the survey link and try again.
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-2 mt-6 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Go Back
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="absolute inset-0 opacity-40">
                <AnimatedBackground />
            </div>
            <div className="relative z-10 w-11/12 py-12 mx-auto md:w-3/4 xl:w-1/2">
                <form onSubmit={(ev) => {
                    // Call preventDefault immediately to stop the reload
                    ev.preventDefault();
                    // Then call your debounced function without passing the event
                    submitSurvey();
                }}>
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
                        >
                            <div className="flex flex-col gap-8 md:flex-row">
                                <div className="w-full md:w-1/2">
                                    <div className="relative h-[300px] rounded-xl overflow-hidden bg-gray-50">
                                        <img
                                            src={survey.image_url || '/AceLogo.png'}
                                            loading="lazy"
                                            className={`w-full h-full transition-transform duration-300 hover:scale-105 ${!survey.image_url ? 'object-contain p-8' : 'object-cover'
                                                }`}
                                            alt={survey.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/AceLogo.png';
                                                e.target.className = 'object-contain w-full h-full p-8';
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="w-full space-y-4 md:w-1/2">
                                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                                        {survey.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full
                                            ${survey.status
                                                ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
                                                : "bg-red-100 text-red-700 ring-1 ring-red-600/20"}`}>
                                            {survey.status ? "Active" : "Closed"}
                                        </span>
                                        <span className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full ring-1 ring-gray-600/10">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Expires: {new Date(survey.expire_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="p-4 leading-relaxed text-gray-600 bg-gray-50 rounded-xl">
                                        {survey.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {surveyFinished ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 text-center bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                    className="p-2 mx-auto mb-6 bg-green-100 rounded-full w-fit"
                                >
                                    <CheckCircleIcon className="w-16 h-16 text-green-500" />
                                </motion.div>
                                <h2 className="mb-3 text-2xl font-bold text-gray-900">
                                    Thank You!
                                </h2>
                                <p className="text-gray-600">
                                    Your response has been successfully recorded.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-2 mt-6 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Submit Another Response
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {(survey.questions || []).map((question, index) => (
                                        <motion.div
                                            key={question.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <PublicQuestionView
                                                question={question}
                                                index={index}
                                                answerChanged={(val) => answerChanged(question, val)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                                {submissionError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 mb-4 border border-red-200 shadow-sm bg-red-50 rounded-xl"
                                    >
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    Submission Error
                                                </h3>
                                                <p className="mt-2 text-sm text-red-700">
                                                    {submissionError}
                                                </p>
                                                <div className="mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSubmissionError(null)}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-800 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex justify-end"
                                >
                                    <button
                                        className="px-6 py-3 text-base font-medium text-white transition-all duration-300 bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        type="submit"
                                    >
                                        Submit Survey
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

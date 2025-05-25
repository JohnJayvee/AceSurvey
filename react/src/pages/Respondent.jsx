import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "@api/axios.js";
import RespondentAnswerView from "@components/RespondentAnswerView.jsx";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { FaArrowLeft } from "react-icons/fa6";
import { motion } from "framer-motion";

export default function Respondent() {
    const { surveyId, responseId } = useParams();
    const [responseDetails, setResponseDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchResponseDetails = async () => {
            try {
                setLoading(true);

                // Use getWithCache with unique requestKey to prevent cancellation
                const response = await axiosClient.getWithCache(
                    `/survey/${surveyId}/responses/${responseId}/details`,
                    {},  // empty params
                    {
                        signal: controller.signal,
                        requestKey: `respondent_details_${surveyId}_${responseId}_${Date.now()}`,
                        cancelPrevious: false
                    }
                );

                if (isMounted) {
                    setResponseDetails(response.data);
                    setLoading(false);
                }
            } catch (error) {
                if (isMounted && !error.isCanceled && error.name !== 'AbortError') {
                    setError(
                        error.response ? error.response.data.message : error.message
                    );
                    setLoading(false);
                }
            }
        };

        fetchResponseDetails();

        // Cleanup function
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [surveyId, responseId]);

    if (loading) return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full min-h-screen bg-gray-50"
        >
            <div className="w-11/12 py-6 mx-auto space-y-6 md:w-3/4 xl:w-1/2">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-between w-full px-6 py-4 bg-white shadow-sm rounded-xl"
                >
                    <div className="py-2">
                        <Skeleton circle width={40} height={40} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col gap-6 p-6 bg-white border border-gray-200 shadow-sm rounded-xl md:flex-row"
                >
                    <div className="w-full md:w-1/2">
                        <Skeleton height={320} className="rounded-lg" />
                    </div>
                    <div className="w-full space-y-4 lg:w-1/2">
                        <Skeleton height={48} width="80%" />
                        <Skeleton count={2} />
                        <Skeleton height={100} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full space-y-6"
                >
                    {[1, 2, 3].map((_, index) => (
                        <motion.div
                            key={index}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl"
                        >
                            <Skeleton height={24} width="60%" className="mb-4" />
                            <Skeleton height={40} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </motion.div>
    );

    if (error) return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center min-h-screen p-6 bg-gray-50"
        >
            <div className="p-6 text-red-600 bg-white shadow-sm rounded-xl">
                Error: {error}
            </div>
        </motion.div>
    );

    if (!responseDetails || !responseDetails.questions) return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center min-h-screen p-6 bg-gray-50"
        >
            <div className="p-6 text-gray-600 bg-white shadow-sm rounded-xl">
                No data available
            </div>
        </motion.div>
    );

    // Ensure answers are included in responseDetails
    const answers = responseDetails.questions.map((question) => ({
        survey_question_id: question.id,
        answer: question.answer || "", // Ensure answer defaults to an empty string if not present
    }));

    function handleGoBack() {
        navigate(-1);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full min-h-screen bg-gray-50"
        >
            <div className="w-11/12 py-6 mx-auto space-y-6 md:w-3/4 xl:w-1/2">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-between w-full px-6 py-4 bg-white shadow-sm rounded-xl"
                >
                    <div className="py-2">
                        <Tooltip title="Go Back" placement="bottom" TransitionComponent={Fade}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-4 transition-colors rounded-full cursor-pointer hover:bg-gray-100"
                                onClick={handleGoBack}
                            >
                                <FaArrowLeft className="text-gray-700" />
                            </motion.div>
                        </Tooltip>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col gap-6 p-6 bg-white border border-gray-200 shadow-sm rounded-xl md:flex-row"
                >
                    <div className="w-full md:w-1/2">
                        <img
                            src={responseDetails.image_url || '/AceLogo.png'}
                            loading="lazy"
                            className="object-contain w-full rounded-md h-80 bg-gray-50"
                            alt={responseDetails.title}
                        />
                    </div>
                    <div className="w-full lg:w-1/2">
                        <h1 className="my-3 text-4xl font-semibold">
                            {responseDetails.title}
                        </h1>
                        <p className="mb-1 text-sm text-gray-500">
                            Status:{" "}
                            {responseDetails.status ? "Active" : "Closed"}
                        </p>
                        <p className="mb-3 overflow-y-auto text-sm text-gray-500 max-h-48">
                            {responseDetails.description}
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full space-y-6"
                >
                    {responseDetails.questions.map((q, index) => (
                        <RespondentAnswerView
                            key={q.id}
                            question={q}
                            answer={
                                answers.find(
                                    (a) => a.survey_question_id === q.id
                                )?.answer || ""
                            }
                            index={index}
                        />
                    ))}
                </motion.div>
            </div>
        </motion.div>
    );
}

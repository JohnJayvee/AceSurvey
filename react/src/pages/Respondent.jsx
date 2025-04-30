import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios.js";
import RespondentAnswerView from "../components/RespondentAnswerView.jsx";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { FaArrowLeft } from "react-icons/fa6";

export default function Respondent() {
    const { surveyId, responseId } = useParams();
    const [responseDetails, setResponseDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResponseDetails = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get(
                    `/survey/${surveyId}/responses/${responseId}/details`
                );
                setResponseDetails(response.data);
            } catch (error) {
                setError(
                    error.response ? error.response.data.message : error.message
                );
            } finally {
                setLoading(false);
            }
        };

        fetchResponseDetails();
    }, [surveyId, responseId]);

    if (loading) return (
        <div className="relative w-full min-h-screen">
            <div className="w-11/12 mx-auto md:w-3/4 xl:w-1/2">
                <div className="flex justify-between w-full px-4 mb-4 bg-white rounded-lg">
                    <div className="py-2">
                        <Skeleton circle width={40} height={40} />
                    </div>
                </div>
                <div className="flex flex-col p-4 mb-4 bg-white border border-gray-200 rounded-lg md:flex-row">
                    <div className="w-full mr-4 md:w-1/2">
                        <Skeleton height={320} />
                    </div>
                    <div className="w-full lg:w-1/2">
                        <Skeleton height={40} width="80%" className="my-3" />
                        <Skeleton count={2} />
                        <Skeleton height={100} className="mt-2" />
                    </div>
                </div>
                <div className="w-full">
                    {[1, 2, 3].map((_, index) => (
                        <div key={index} className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
                            <Skeleton height={24} width="60%" className="mb-4" />
                            <Skeleton height={40} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (error) return <div>Error: {error}</div>;
    if (!responseDetails || !responseDetails.questions)
        return <div>No data available</div>;

    // Ensure answers are included in responseDetails
    const answers = responseDetails.questions.map((question) => ({
        survey_question_id: question.id,
        answer: question.answer || "", // Ensure answer defaults to an empty string if not present
    }));

    function handleGoBack() {
        navigate(-1);
    }

    return (
        <div className="relative w-full min-h-screen">
            <div className="w-11/12 mx-auto  md:w-3/4 xl:w-1/2">
                <div
                    className="flex justify-between w-full px-4 mb-4 bg-white rounded-lg animate-fade-in-down"
                    style={{ animationDelay: "0.1s" }}
                >
                    <div className="py-2">
                        <Tooltip
                            title="Go Back"
                            placement="bottom"
                            TransitionComponent={Fade}
                        >
                            <div
                                className="p-4 rounded-full cursor-pointer hover:bg-gray-100"
                                onClick={handleGoBack}
                            >
                                <FaArrowLeft className="text-gray-700" />
                            </div>
                        </Tooltip>
                    </div>
                </div>
                <div
                    className="flex flex-col p-4 mb-4 bg-white border border-gray-200 rounded-lg md:flex-row animate-fade-in-down"
                    style={{ animationDelay: "0.2s" }}
                >
                    <div className="w-full mr-4 md:w-1/2">
                        <img
                            src={responseDetails.image_url || '/AceLogo.png'}
                            className="object-cover w-full rounded-md h-80"
                            alt={responseDetails.title}
                            loading="lazy"
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
                </div>

                <div
                    className="w-full animate-fade-in-down"
                    style={{ animationDelay: "0.3s" }}
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
                </div>
            </div>
        </div>
    );
}

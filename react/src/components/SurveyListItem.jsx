import React, { useState, useEffect, useRef } from "react";
import {
    ArrowTopRightOnSquareIcon,
    PencilIcon,
    TrashIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import ShareSurveyPopup from "./ShareSurveyPopup";
import { Link, useNavigate } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartTooltip } from "recharts";
import axios from "../axios";

export default function SurveyListItem({ survey, onDeleteClick }) {
    const [openSharePopup, setOpenSharePopup] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [graphData, setGraphData] = useState([]);

    const navigate = useNavigate();
    const hasFetched = useRef(false); // 🛡️ Prevents double-fetching

    const isSurveyExpired = (expireDate) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const expiration = new Date(expireDate).setHours(0, 0, 0, 0);
        return expiration <= today;
    };

    const handleOpenShare = () => {
        setShareLink(`${window.location.origin}/survey/public/${survey.slug}`);
        setOpenSharePopup(true);
    };

    const handleViewResponses = (surveyId) => {
        navigate(`/surveys/${surveyId}/responses`);
    };

    useEffect(() => {
        if (hasFetched.current) return; // ⛔ Skip if already fetched
        hasFetched.current = true;

        const fetchAnalytics = async () => {
            try {
                const res = await axios.get("/survey-analytics");
                const allStats = res.data.analytics.surveyStats;

                const monthlyData = Array.from({ length: 12 }, (_, i) => ({
                    name: new Date(0, i).toLocaleString("default", { month: "short" }),
                    response: 0,
                }));

                allStats
                    .filter(item => item.title === survey.title)
                    .forEach(item => {
                        const date = new Date(item.created_at);
                        const monthIndex = date.getMonth();
                        monthlyData[monthIndex].response += item.answers;
                    });

                setGraphData(monthlyData);
            } catch (error) {
                console.error("Error fetching analytics:", error);
            }
        };

        fetchAnalytics();
    }, [survey.title]);

    return (
        <div className="relative flex flex-col p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 animate-fade-in-down">
            <img
                src={survey.image_url || '/AceLogo.png'}
                loading="lazy"
                alt={survey.title}
                // className="object-cover w-full h-64 rounded-md"
                className="object-cover w-auto h-auto rounded-md"
            />

            <div className={`absolute top-6 right-6 text-xs py-1 px-2 rounded-full
                ${isSurveyExpired(survey.expire_date)
                    ? "bg-yellow-300 bg-opacity-50 text-yellow-600 border border-yellow-300"
                    : survey.status
                        ? "bg-green-300 bg-opacity-40 text-green-500 border border-green-300"
                        : "bg-red-300 bg-opacity-40 text-red-500 border border-red-300"
                }`}>
                {isSurveyExpired(survey.expire_date)
                    ? "Expired"
                    : survey.status
                        ? "Active"
                        : "Closed"}
            </div>

            <h4 className="mt-4 text-lg font-bold">{survey.title}</h4>

            <div className="relative flex-1 overflow-hidden truncate-ellipsis">
                <div className="absolute inset-0 h-full overflow-hidden text-gray-500 pointer-events-none bg-gradient-to-t from-white to-transparent max-h-32">
                    <div
                        className="h-full overflow-hidden max-h-32"
                        style={{
                            WebkitLineClamp: 4,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                        }}
                    >
                        {/* {survey.description} */}
                    </div>
                </div>
            </div>

            {/* 🔥 Chart */}
            <div className="w-full h-40 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartTooltip />
                        <Line type="monotone" dataKey="response" stroke="#4CAF50" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 🔧 Actions */}
            <div className="flex items-center justify-between mt-3">
                <Link
                    to={`/surveys/${survey.id}`}
                    className="flex px-4 py-3 m-2 text-white bg-blue-500 rounded-lg hover:text-white hover:bg-opacity-75"
                >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Edit
                </Link>
                <div className="flex items-center gap-2">
                    <Tooltip title="Share" placement="bottom" arrow TransitionComponent={Fade}>
                        <button onClick={handleOpenShare} className="p-2 rounded-full hover:bg-blue-100 hover:text-blue-500">
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip title="Responses" placement="bottom" arrow TransitionComponent={Fade}>
                        <button onClick={() => handleViewResponses(survey.id)} className="p-2 rounded-full hover:bg-green-100 hover:text-green-500">
                            <UsersIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete" placement="bottom" arrow TransitionComponent={Fade}>
                        <button onClick={() => onDeleteClick(survey.id)} className="p-2 rounded-full hover:bg-red-100 hover:text-red-500">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <ShareSurveyPopup openSharePopup={openSharePopup} setOpenSharePopup={setOpenSharePopup} shareLink={shareLink} />
        </div>
    );
}

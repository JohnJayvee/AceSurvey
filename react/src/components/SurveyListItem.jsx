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
    const [totalResponses, setTotalResponses] = useState(0);

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

                let total = 0; // Track total responses

                allStats
                    .filter(item => item.title === survey.title)
                    .forEach(item => {
                        const date = new Date(item.created_at);
                        const monthIndex = date.getMonth();
                        monthlyData[monthIndex].response += item.answers;
                        total += item.answers; // Add to total
                    });

                setGraphData(monthlyData);
                setTotalResponses(total); // Update total responses
            } catch (error) {
                console.error("Error fetching analytics:", error);
            }
        };

        fetchAnalytics();
    }, [survey.title]);

    return (
        <div className="relative flex flex-col p-6 transition-all duration-300 bg-white border border-gray-200 rounded-xl group hover:border-blue-500 hover:shadow-lg animate-fade-in-down">
            <div className="relative overflow-hidden rounded-lg aspect-video bg-gray-50">
                <img
                    src={survey.image_url || '/AceLogo.png'}
                    loading="lazy"
                    alt={survey.title}
                    className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/AceLogo.png';
                    }}
                />
            </div>

            <div className={`absolute top-8 right-8 text-xs font-medium py-1.5 px-3 rounded-full
                ${isSurveyExpired(survey.expire_date)
                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    : survey.status
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                }`}>
                {isSurveyExpired(survey.expire_date)
                    ? "Expired"
                    : survey.status
                        ? "Active"
                        : "Closed"}
            </div>

            <h4 className="mt-6 text-lg font-bold text-gray-900 line-clamp-1">{survey.title}</h4>

            <div className="flex items-center mt-2 space-x-2">
                <div className="flex items-center text-sm text-gray-500">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    {totalResponses} Responses
                </div>
                <span className="text-gray-300">•</span>
                <div className="text-sm text-gray-500">
                    Created {new Date(survey.created_at).toLocaleDateString()}
                </div>
            </div>

            <div className="w-full h-48 p-2 mt-4 rounded-lg bg-gray-50">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                        <XAxis
                            dataKey="name"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <RechartTooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                padding: '8px 12px'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="response"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <Link
                    to={`/surveys/${survey.id}`}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Survey
                </Link>
                <div className="flex items-center gap-3">
                    <Tooltip title="Share Survey" placement="top" arrow TransitionComponent={Fade}>
                        <button
                            onClick={handleOpenShare}
                            className="p-2 transition-colors duration-200 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        >
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip title="View Responses" placement="top" arrow TransitionComponent={Fade}>
                        <button
                            onClick={() => handleViewResponses(survey.id)}
                            className="p-2 transition-colors duration-200 rounded-lg hover:bg-green-50 hover:text-green-600"
                        >
                            <UsersIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip title="Delete Survey" placement="top" arrow TransitionComponent={Fade}>
                        <button
                            onClick={() => onDeleteClick(survey.id)}
                            className="p-2 transition-colors duration-200 rounded-lg hover:bg-red-50 hover:text-red-600"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <ShareSurveyPopup
                openSharePopup={openSharePopup}
                setOpenSharePopup={setOpenSharePopup}
                shareLink={shareLink}
            />
        </div>
    );
}

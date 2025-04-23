import React, { useState, useEffect } from "react";
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
        axios.get("/survey-analytics")
            .then((res) => {
                const allStats = res.data.analytics.surveyStats;

                const monthlyData = Array.from({ length: 12 }, (_, i) => ({
                    name: new Date(0, i).toLocaleString("default", { month: "short" }),
                    count: 0,
                }));

                allStats
                    .filter(item => item.title === survey.title)
                    .forEach(item => {
                        const date = new Date(item.created_at); // or use your date field
                        const monthIndex = date.getMonth();
                        monthlyData[monthIndex].count += item.answers;
                    });

                setGraphData(monthlyData);
            });
    }, [survey.title]);


    return (
        <div className="relative flex flex-col p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 animate-fade-in-down">
            <img
                src={survey.image_url || '/AceLogo.png'}
                alt={survey.title}
                className="w-full h-64 object-cover rounded-md"
            />

            <div className={`absolute top-6 right-6 text-xs py-1 px-2 rounded-full
                ${isSurveyExpired(survey.expire_date)
                    ? "bg-yellow-300 bg-opacity-50 text-yellow-600 border border-yellow-300"
                    : survey.status
                        ? "bg-green-300 bg-opacity-40 text-green-500 border border-green-300"
                        : "bg-red-300 bg-opacity-40 text-red-500 border border-red-300"
                }`}
            >
                {isSurveyExpired(survey.expire_date)
                    ? "Expired"
                    : survey.status
                        ? "Active"
                        : "Closed"}
            </div>

            <h4 className="mt-4 text-lg font-bold">{survey.title}</h4>

            <div className="overflow-hidden flex-1 truncate-ellipsis relative">
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent pointer-events-none h-full max-h-32 overflow-hidden text-gray-500">
                    <div
                        className="h-full max-h-32 overflow-hidden"
                        style={{
                            WebkitLineClamp: 4,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                        }}
                    >
                        {survey.description}
                    </div>
                </div>
            </div>

            {/* 🔥 SimpleLineChart */}
            <div className="mt-4 w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartTooltip />
                        <Line type="monotone" dataKey="count" stroke="#4CAF50" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 🔧 Actions */}
            <div className="flex justify-between items-center mt-3">
                <Link
                    to={`/surveys/${survey.id}`}
                    className="flex py-3 px-4 bg-blue-500 rounded-lg text-white hover:text-white m-2 hover:bg-opacity-75"
                >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Edit
                </Link>
                <div className="flex items-center gap-2">
                    <Tooltip title="Share" placement="bottom" arrow TransitionComponent={Fade}>
                        <button onClick={handleOpenShare} className="hover:bg-blue-100 rounded-full p-2 hover:text-blue-500">
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>

                    <Tooltip title="Responses" placement="bottom" arrow TransitionComponent={Fade}>
                        <button onClick={() => handleViewResponses(survey.id)} className="hover:bg-green-100 rounded-full p-2 hover:text-green-500">
                            <UsersIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>

                    <Tooltip title="Delete" placement="bottom" arrow TransitionComponent={Fade}>
                        <button onClick={() => onDeleteClick(survey.id)} className="hover:bg-red-100 rounded-full p-2 hover:text-red-500">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <ShareSurveyPopup openSharePopup={openSharePopup} setOpenSharePopup={setOpenSharePopup} shareLink={shareLink} />
        </div>
    );
}

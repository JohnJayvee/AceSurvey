import React, { useEffect, useState, useRef } from "react";
import DashboardCard from "../components/DashboardCard";
import axiosClient from "../axios.js";
import TButton from "../components/core/TButton.jsx";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import Loader from "../components/Loader";
import { Divider } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Footer from "../components/Footer.jsx";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';  // Importing Recharts

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});
    const [analyticsData, setAnalyticsData] = useState({});
    const [chartData, setChartData] = useState([]);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return; // skip if already fetched
        hasFetched.current = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [dashboardRes, analyticsRes] = await Promise.all([
                    axiosClient.get('/dashboard'),
                    axiosClient.get('/survey-analytics'),
                ]);

                setData(dashboardRes.data);
                setAnalyticsData(analyticsRes.data.analytics);
                setChartData(generateMonthlyData(analyticsRes.data.analytics.surveyStats));
            } catch (err) {
                console.error('Fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const generateMonthlyData = (surveyStats) => {
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const chartData = months.map(month => ({
            name: month,
            surveys: 0,       // Changed from totalSurveys to total
            responses: 0
        }));

        surveyStats.forEach((surveyStat) => {
            const surveyDate = new Date(surveyStat.created_at);
            // if (isNaN(surveyDate.getTime())) {
            //     console.warn(`Invalid date: ${surveyStat.created_at}`);
            //     return;
            // }

            const surveyMonth = surveyDate.getMonth();
            chartData[surveyMonth].surveys += 1;
            chartData[surveyMonth].responses += surveyStat.answers;
        });

        return chartData;
    };




    const navigate = useNavigate();

    const handleViewResponses = (surveyId) => {
        navigate(`/surveys/${surveyId}/responses`);
    };

    const handleViewDetail = (surveyId, responseId) => {
        navigate(`/surveys/${surveyId}/responses/${responseId}`);
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), "MMMM, dd yyyy | hh:mm a");
    };

    const isSurveyExpired = (expireDate) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const expiration = new Date(expireDate).setHours(0, 0, 0, 0);
        return expiration <= today;
    };

    return (
        <div>
            <div className="flex flex-col w-full gap-5 mx-auto text-gray-700 lg:flex-row xl:w-3/4">
                <div className="flex flex-col w-full lg:w-3/4">
                    {/* Card section */}
                    <div className="flex gap-4">
                        <DashboardCard
                            className="order-1 w-full p-8 rounded-lg lg:order-2"
                            style={{ animationDelay: "0.1s" }}
                        >
                            <div className="pb-2 text-4xl font-semibold md:text-5xl">
                                {loading ? <Skeleton /> : data.totalSurveys}
                            </div>
                            <p className="text-blue-400">
                                {loading ? <Skeleton width={100} /> : "Total Surveys"}
                            </p>
                        </DashboardCard>
                        <DashboardCard
                            className="order-2 w-full p-8 rounded-lg lg:order-4"
                            style={{ animationDelay: "0.2s" }}
                        >
                            <div className="pb-2 text-4xl font-semibold md:text-5xl">
                                {loading ? <Skeleton /> : data.totalAnswers}
                            </div>
                            <p className="text-blue-400">
                                {loading ? <Skeleton width={100} /> : "Total Responses"}
                            </p>
                        </DashboardCard>
                    </div>

                    {/* Latest survey section */}
                    <div className="mt-4">
                        <DashboardCard
                            className="order-3 row-span-2 p-6 lg:order-1"
                            style={{ animationDelay: "0.2s" }}
                        >
                            <p className="mb-4 font-semibold">
                                {loading ? <Skeleton width={150} /> : "Latest Survey"}
                            </p>
                            {loading ? (
                                <div>
                                    <Skeleton height={288} className="mb-4" />
                                    <Skeleton height={24} className="mb-3" />
                                    <Skeleton count={5} className="mb-2" />
                                    <Divider className="my-4" />
                                    <div className="flex justify-between">
                                        <Skeleton width={100} />
                                        <Skeleton width={100} />
                                    </div>
                                </div>
                            ) : (
                                data.latestSurvey && (
                                    <div>
                                        <img
                                            src={data.latestSurvey.image_url || '/AceLogo.png'} // Add default image path here
                                            // className="object-cover w-full mx-auto rounded-lg h-72"
                                            loading="lazy"
                                            className="object-cover w-auto mx-auto rounded-lg h-72"
                                        />
                                        <h3 className="mt-4 mb-3 text-xl font-bold">
                                            {data.latestSurvey.title}
                                        </h3>
                                        <div className="flex justify-between mt-2 mb-1 text-xs md:text-sm">
                                            <div>Created Date:</div>
                                            <div>
                                                {formatDate(
                                                    data.latestSurvey.created_at
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between mb-1 text-xs md:text-sm">
                                            <div>Expire Date:</div>
                                            <div>
                                                {formatDate(
                                                    data.latestSurvey.expire_date
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between mb-1 text-xs md:text-sm">
                                            <div>Status:</div>
                                            <div>
                                                {isSurveyExpired(
                                                    data.latestSurvey.expire_date
                                                )
                                                    ? "Expired"
                                                    : data.latestSurvey.status
                                                        ? "Active"
                                                        : "Closed"}
                                            </div>
                                        </div>
                                        <div className="flex justify-between mb-1 text-xs md:text-sm">
                                            <div>Questions:</div>
                                            <div>
                                                {data.latestSurvey.questions}
                                            </div>
                                        </div>
                                        <div className="flex justify-between mb-3 text-xs md:text-sm">
                                            <div>Responses:</div>
                                            <div>
                                                {data.latestSurvey.answers}
                                            </div>
                                        </div>
                                        <Divider />
                                        <div className="flex justify-between mt-4">
                                            <Link
                                                to={`/surveys/${data.latestSurvey.id}`}
                                                style={{
                                                    textDecoration: "none",
                                                }}
                                            >
                                                <button className="flex px-4 py-2 text-xs text-blue-500 rounded-lg md:text-sm hover:bg-blue-50">
                                                    <PencilIcon className="w-4 h-4 mr-2 md:w-5 md:h-5" />
                                                    Edit Survey
                                                </button>
                                            </Link>

                                            <button
                                                className="flex px-4 py-2 text-xs text-blue-500 rounded-lg md:text-sm hover:bg-blue-50"
                                                onClick={() =>
                                                    handleViewResponses(
                                                        data.latestSurvey.id
                                                    )
                                                }
                                            >
                                                <EyeIcon className="w-4 h-4 mr-2 md:w-5 md:h-5" />
                                                View Responses
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                            {!loading && !data.latestSurvey && (
                                <div className="py-16 text-center text-gray-600">
                                    No surveys available
                                </div>
                            )}
                        </DashboardCard>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="w-full lg:w-2/3">
                    <DashboardCard
                        className="order-4 row-span-2 p-6 mt-5 mb-4 lg:order-3 lg:mt-0"
                        style={{ animationDelay: "0.3s" }}
                    >
                        <p className="mb-4 font-semibold">
                            {loading ? <Skeleton width={150} /> : "Survey Analytics"}
                        </p>
                        {loading ? (
                            <div className="h-96">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="px-4 py-2 mb-2">
                                        <div className="flex justify-between">
                                            <Skeleton width={200} />
                                            <Skeleton width={100} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="surveys"
                                        stroke="#8884d8"
                                        activeDot={{ r: 8 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="responses"
                                        stroke="#82ca9d"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </DashboardCard>

                    <DashboardCard
                        className="order-4 row-span-2 p-6 lg:order-3"
                        style={{ animationDelay: "0.3s" }}
                    >
                        <p className="mb-4 font-semibold">
                            {loading ? <Skeleton width={150} /> : "Latest Responses"}
                        </p>
                        {loading ? (
                            <div className="h-96">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="px-4 py-2 mb-2">
                                        <div className="flex justify-between">
                                            <Skeleton width={200} />
                                            <Skeleton width={100} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            data.latestAnswers && data.latestAnswers.length > 0 ? (
                                <div className="overflow-y-auto text-left h-96">
                                    {data.latestAnswers.map((answer) => (
                                        <div
                                            key={answer.id}
                                            className="py-2 border-gray-200 cursor-pointer border-b-1"
                                            onClick={() =>
                                                handleViewDetail(answer.survey_id, answer.id)
                                            }
                                        >
                                            <div className="flex justify-between px-4 py-2 rounded-lg hover:bg-gray-50 ">
                                                <div className="text-sm font-semibold text-blue-400 md:text-base">
                                                    {answer.survey.title}
                                                </div>
                                                <div>
                                                    <p className="px-2 py-1 text-xs rounded-lg md:text-sm bg-gray-50">
                                                        {formatDate(answer.end_date)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center text-gray-600">
                                    You don't have responses yet
                                </div>
                            )
                        )}
                    </DashboardCard>
                </div>
            </div>

            <Footer />
        </div>
    );
}

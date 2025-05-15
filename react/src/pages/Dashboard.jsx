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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';  // Importing Recharts
import { PieChart, Pie, Cell } from 'recharts'; // Importing PieChart components

const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#FF9800', '#F44336'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}
        >
            {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
        </text>
    );
};

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});
    const [analyticsData, setAnalyticsData] = useState({});
    const [chartData, setChartData] = useState([]);
    const [ratingsData, setRatingsData] = useState([]); // Added state for ratings data
    const [topSurveys, setTopSurveys] = useState([]);
    const [bottomSurveys, setBottomSurveys] = useState([]);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return; // skip if already fetched
        hasFetched.current = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const fetchRatingsData = async () => {
                    try {
                        const response = await axiosClient.get('/total-ratings');
                        const ratings = response.data.ratings;

                        // Default data with zeros (without number prefixes)
                        const defaultData = [
                            { name: 'Very Satisfied', value: 0, rating: '5' },
                            { name: 'Satisfied', value: 0, rating: '4' },
                            { name: 'Undecided', value: 0, rating: '3' },
                            { name: 'Unsatisfied', value: 0, rating: '2' },
                            { name: 'Very Unsatisfied', value: 0, rating: '1' }
                        ];

                        // If we have ratings data, update the values
                        if (ratings && Object.keys(ratings).length > 0) {
                            Object.entries(ratings).forEach(([rating, data]) => {
                                const index = defaultData.findIndex(item => item.rating === rating);
                                if (index !== -1) {
                                    defaultData[index].value = data.count;
                                }
                            });
                        }

                        setRatingsData(defaultData);
                    } catch (error) {
                        console.error('Error fetching ratings:', error);
                        // Set default zero data on error
                        setRatingsData([
                            { name: 'Very Satisfied', value: 0, rating: '5' },
                            { name: 'Satisfied', value: 0, rating: '4' },
                            { name: 'Undecided', value: 0, rating: '3' },
                            { name: 'Unsatisfied', value: 0, rating: '2' },
                            { name: 'Very Unsatisfied', value: 0, rating: '1' }
                        ]);
                    }
                };

                const fetchSurveyRatings = async () => {
                    try {
                        const [topResponse, bottomResponse] = await Promise.all([
                            axiosClient.get('/topSurvey'),
                            axiosClient.get('/botSurvey')
                        ]);

                        // Set the data directly from the API response
                        setTopSurveys(topResponse.data || []);
                        setBottomSurveys(bottomResponse.data || []);

                        // Debug logs
                        console.log('Top surveys:', topResponse.data);
                        console.log('Bottom surveys:', bottomResponse.data);
                    } catch (error) {
                        console.error('Error fetching survey ratings:', error);
                        setTopSurveys([]);
                        setBottomSurveys([]);
                    }
                };

                const [dashboardRes, analyticsRes] = await Promise.all([
                    axiosClient.get('/dashboard'),
                    axiosClient.get('/survey-analytics'),
                    fetchRatingsData(), // Added fetchRatingsData to Promise.all
                    fetchSurveyRatings() // Added fetchSurveyRatings to Promise.all
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
            <div className="flex flex-col w-full gap-5 mx-auto mb-8 text-gray-700 lg:flex-row xl:w-3/4">
                <DashboardCard
                    className={`
                        bg-white
                        rounded-lg
                        shadow-sm
                        w-full
                        h-full
                        flex
                        flex-col
                        w-full h-full p-6 transition-all duration-300 hover:shadow-lg
                    `}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Top Performing Surveys</h2>
                            <p className="text-sm text-gray-600">Surveys with highest response rates</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                    {topSurveys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-gray-500">No data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                layout="vertical"
                                data={topSurveys}
                                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                    stroke="#f0f0f0"
                                />
                                <XAxis
                                    type="number"
                                    domain={[0, 'auto']}
                                    allowDecimals={false}
                                    axisLine={false}
                                    tickLine={false}
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    dataKey="title"
                                    type="category"
                                    width={200}
                                    tick={{
                                        fontSize: 12,
                                        fill: '#4B5563',
                                        fontWeight: 500
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(value) => [`${value} responses`, "Total Responses"]}
                                    cursor={{ fill: 'rgba(224, 224, 224, 0.2)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                        padding: '8px 12px'
                                    }}
                                />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{
                                        paddingTop: '10px'
                                    }}
                                />
                                <Bar
                                    dataKey="answers_count"
                                    fill="#4CAF50"
                                    name="Responses"
                                    barSize={20}
                                    radius={[4, 4, 4, 4]}
                                    label={{
                                        position: 'right',
                                        fill: '#4B5563',
                                        fontSize: 12,
                                        fontWeight: 500
                                    }}
                                >
                                    {topSurveys.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`rgba(76, 175, 80, ${1 - (index * 0.15)})`}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </DashboardCard>

                {/* Surveys Needing Attention */}
                <DashboardCard
                    className={`
                        bg-white
                        rounded-lg
                        shadow-sm
                        w-full
                        h-full
                        flex
                        flex-col
                        w-full h-full p-6 transition-all duration-300 hover:shadow-lg
                    `}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Surveys Needing Attention</h2>
                            <p className="text-sm text-gray-600">Surveys with lowest response rates</p>
                        </div>
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        </div>
                    </div>
                    {bottomSurveys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-gray-500">No data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                layout="vertical"
                                data={bottomSurveys}
                                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                    stroke="#f0f0f0"
                                />
                                <XAxis
                                    type="number"
                                    domain={[0, 'auto']}
                                    allowDecimals={false}
                                    axisLine={false}
                                    tickLine={false}
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    dataKey="title"
                                    type="category"
                                    width={200}
                                    tick={{
                                        fontSize: 12,
                                        fill: '#4B5563',
                                        fontWeight: 500
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(value) => [`${value} responses`, "Total Responses"]}
                                    cursor={{ fill: 'rgba(224, 224, 224, 0.2)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                        padding: '8px 12px'
                                    }}
                                />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{
                                        paddingTop: '10px'
                                    }}
                                />
                                <Bar
                                    dataKey="answers_count"
                                    fill="#FF5722"
                                    name="Responses"
                                    barSize={20}
                                    radius={[4, 4, 4, 4]}
                                    label={{
                                        position: 'right',
                                        fill: '#4B5563',
                                        fontSize: 12,
                                        fontWeight: 500
                                    }}
                                >
                                    {bottomSurveys.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`rgba(255, 87, 34, ${1 - (index * 0.15)})`}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </DashboardCard>
            </div>
            <div className="flex flex-col w-full gap-5 mx-auto text-gray-700 lg:flex-row xl:w-3/4">
                <div className="flex flex-col w-full lg:w-3/4">
                    {/* Card section */}
                    <div className="flex gap-4">
                        <DashboardCard className="order-1 w-full p-6 transition-all duration-300 transform rounded-lg lg:order-2 hover:scale-105 hover:shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="pb-2 text-4xl font-bold tracking-tight text-transparent md:text-5xl bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text">
                                                {loading ? <Skeleton width={60} /> : data.totalSurveys}
                                            </h3>
                                            <p className="text-sm font-medium text-gray-500">
                                                Total Surveys
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    {!loading && (
                                        <div className="inline-flex items-center px-3 py-1 text-sm text-green-600 bg-green-100 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            <span>Active</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!loading && (
                                <div className="mt-4 text-sm text-gray-600">
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <span>Last 30 days</span>
                                        <span className="font-medium text-blue-600">+{data.totalSurveys || 0}</span>
                                    </div>
                                </div>
                            )}
                        </DashboardCard>

                        <DashboardCard className="order-2 w-full p-6 transition-all duration-300 transform rounded-lg lg:order-4 hover:scale-105 hover:shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-green-100 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="pb-2 text-4xl font-bold tracking-tight text-transparent md:text-5xl bg-gradient-to-r from-green-600 to-green-400 bg-clip-text">
                                                {loading ? <Skeleton width={60} /> : data.totalAnswers}
                                            </h3>
                                            <p className="text-sm font-medium text-gray-500">
                                                Total Responses
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    {!loading && (
                                        <div className="inline-flex items-center px-3 py-1 text-sm text-green-600 bg-green-100 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            <span>Active</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!loading && (
                                <div className="mt-4 text-sm text-gray-600">
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <span>Last 30 days</span>
                                        <span className="font-medium text-green-600">+{data.totalAnswers || 0}</span>
                                    </div>
                                </div>
                            )}
                        </DashboardCard>
                    </div>

                    {/* Latest survey section */}
                    <div className="mt-4">
                        <DashboardCard
                            className="order-3 row-span-2 p-6 lg:order-1"
                            style={{ animationDelay: '0.2s' }}
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
                    {/* Rating Distribution Pie Chart - Moved to top */}
                    <DashboardCard
                        className="order-1 row-span-2 p-6 lg:order-1 lg:mt-0"
                        style={{ animationDelay: '0.3s' }}
                    >
                        <p className="mb-4 font-semibold">
                            {loading ? <Skeleton width={150} /> : "Rating Distribution"}
                        </p>
                        {loading ? (
                            <div className="h-72">
                                <Skeleton circle height={288} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={ratingsData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {ratingsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </DashboardCard>

                    {/* Survey Analytics Line Chart */}
                    <DashboardCard
                        className="order-2 row-span-2 p-6 mt-5 mb-4 lg:order-2"
                        style={{ animationDelay: '0.3s' }}
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

                    {/* Latest Responses */}
                    <DashboardCard
                        className="order-3 row-span-2 p-6 mt-5 lg:order-3"
                        style={{ animationDelay: '0.3s' }}
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

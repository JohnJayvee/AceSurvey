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

const cache = {};

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});
    const [analyticsData, setAnalyticsData] = useState({});
    const [chartData, setChartData] = useState([]);
    const [ratingsData, setRatingsData] = useState([]);
    const [topSurveys, setTopSurveys] = useState([]);
    const [bottomSurveys, setBottomSurveys] = useState([]);
    const hasFetched = useRef(false);

    useEffect(() => {
        // Check cache first before fetching
        if (cache['dashboard']) {
            console.log("Using cached dashboard data");
            setData(cache['dashboard'].data);
            setAnalyticsData(cache['dashboard'].analyticsData);
            setChartData(cache['dashboard'].chartData);
            setRatingsData(cache['dashboard'].ratingsData);
            setTopSurveys(cache['dashboard'].topSurveys);
            setBottomSurveys(cache['dashboard'].bottomSurveys);
            setLoading(false);
            return;
        }

        if (hasFetched.current) return; // skip if already fetched
        hasFetched.current = true;

        setLoading(true);

        // Using simple Promise.all exactly as your friend suggested
        Promise.all([
            axiosClient.get('/dashboard'),
            axiosClient.get('/survey-analytics'),
            axiosClient.get('/total-ratings'),
            axiosClient.get('/topSurvey'),
            axiosClient.get('/botSurvey')
        ]).then(([dashboardRes, analyticsRes, ratingsRes, topRes, bottomRes]) => {
            // Process dashboard data
            setData(dashboardRes.data);

            // Process analytics data
            setAnalyticsData(analyticsRes.data.analytics);
            setChartData(generateMonthlyData(analyticsRes.data.analytics.surveyStats));

            // Process ratings data
            const ratings = ratingsRes.data.ratings;
            const defaultData = [
                { name: 'Very Satisfied', value: 0, rating: '5' },
                { name: 'Satisfied', value: 0, rating: '4' },
                { name: 'Undecided', value: 0, rating: '3' },
                { name: 'Unsatisfied', value: 0, rating: '2' },
                { name: 'Very Unsatisfied', value: 0, rating: '1' }
            ];

            if (ratings && Object.keys(ratings).length > 0) {
                Object.entries(ratings).forEach(([rating, data]) => {
                    const index = defaultData.findIndex(item => item.rating === rating);
                    if (index !== -1) {
                        defaultData[index].value = data.count;
                    }
                });
            }

            setRatingsData(defaultData);

            // Process survey ratings
            setTopSurveys(topRes.data || []);
            setBottomSurveys(bottomRes.data || []);

            // Store processed data in cache
            cache['dashboard'] = {
                data: dashboardRes.data,
                analyticsData: analyticsRes.data.analytics,
                chartData: generateMonthlyData(analyticsRes.data.analytics.surveyStats),
                ratingsData: defaultData,
                topSurveys: topRes.data || [],
                bottomSurveys: bottomRes.data || []
            };

            setLoading(false);
        }).catch(error => {
            console.error('Error fetching data:', error);
            setLoading(false);
        });
    }, []); // Empty dependency array makes this run only once

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
                {/* Top Performing Surveys */}
                <DashboardCard
                    className={`
                                        bg-white
                                        rounded-lg
                                        shadow-sm
                                        w-full
                                        h-full
                                        flex
                                        flex-col
                                        p-6 transition-all duration-300 hover:shadow-lg
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
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: window.innerWidth < 768 ? 80 : 120,
                                    bottom: 5
                                }}
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
                                    style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px' }}
                                />
                                <YAxis
                                    dataKey="title"
                                    type="category"
                                    width={window.innerWidth < 768 ? 80 : 200}
                                    tick={{
                                        fontSize: window.innerWidth < 768 ? 10 : 12,
                                        fill: '#4B5563',
                                        fontWeight: 500
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => window.innerWidth < 768 && value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                />
                                <Tooltip
                                    formatter={(value, name, props) => {
                                        // const surveyTitle = props.payload.title;
                                        const surveyTitle = "Total"; // Placeholder for actual title
                                        // Truncate extremely long titles in the tooltip if needed
                                        const displayTitle = surveyTitle.length > 100 ?
                                            surveyTitle.substring(0, 100) + '...' :
                                            surveyTitle;
                                        return [
                                            `${value} responses`,
                                            displayTitle
                                        ];
                                    }}
                                    cursor={{ fill: 'rgba(224, 224, 224, 0.4)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                                        padding: '10px 14px',
                                        maxWidth: '300px',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#333',
                                        transform: 'scale(1.02)',
                                        transition: 'all 0.2s ease',
                                        borderLeft: '4px solid #4CAF50',
                                        // Add these to better control text overflow
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'normal',  // Allow text wrapping
                                        lineHeight: '1.4'      // Better line spacing for readability
                                    }}
                                    wrapperStyle={{
                                        zIndex: 1000,
                                        pointerEvents: 'auto',
                                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                                        // Ensure tooltip has sufficient width but doesn't break layout
                                        width: 'auto',
                                        maxWidth: '100%'
                                    }}
                                    position={{ x: 0, y: 0 }}
                                    allowEscapeViewBox={{ x: true, y: true }}
                                    isAnimationActive={false}
                                    labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
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
                                    barSize={window.innerWidth < 768 ? 15 : 20}
                                    radius={[4, 4, 4, 4]}
                                    label={window.innerWidth < 768 ? null : {
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
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: window.innerWidth < 768 ? 80 : 120,
                                    bottom: 5
                                }}
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
                                    style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px' }}
                                />
                                <YAxis
                                    dataKey="title"
                                    type="category"
                                    width={window.innerWidth < 768 ? 80 : 200}
                                    tick={(props) => {
                                        const { x, y, payload } = props;
                                        const value = payload.value;
                                        const maxLength = window.innerWidth < 768 ? 10 : 25;
                                        const displayText = value.length > maxLength ?
                                            `${value.substring(0, maxLength)}...` : value;

                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={4}
                                                    textAnchor="end"
                                                    fill="#4B5563"
                                                    fontSize={window.innerWidth < 768 ? 10 : 12}
                                                    fontWeight={500}
                                                    className="transition-colors cursor-pointer hover:text-indigo-600"
                                                >
                                                    {displayText}
                                                </text>
                                                {/* Add a hidden title element for tooltip behavior */}
                                                <title>{value}</title>
                                            </g>
                                        );
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(value, name, props) => {
                                        const surveyTitle = "Total"; // Placeholder for actual title
                                        // const surveyTitle = props.payload.title;
                                        // Truncate extremely long titles in the tooltip if needed
                                        const displayTitle = surveyTitle.length > 100 ?
                                            surveyTitle.substring(0, 100) + '...' :
                                            surveyTitle;
                                        return [
                                            `${value} responses`,
                                            displayTitle
                                        ];
                                    }}
                                    cursor={{ fill: 'rgba(224, 224, 224, 0.4)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                                        padding: '10px 14px',
                                        maxWidth: '300px',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#333',
                                        transform: 'scale(1.02)',
                                        transition: 'all 0.2s ease',
                                        borderLeft: '4px solid #FF5722',
                                        // Add these to better control text overflow
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'normal',  // Allow text wrapping
                                        lineHeight: '1.4'      // Better line spacing for readability
                                    }}
                                    wrapperStyle={{
                                        zIndex: 1000,
                                        pointerEvents: 'auto',
                                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                                        // Ensure tooltip has sufficient width but doesn't break layout
                                        width: 'auto',
                                        maxWidth: '100%'
                                    }}
                                    position={{ x: 0, y: 0 }}
                                    allowEscapeViewBox={{ x: true, y: true }}
                                    isAnimationActive={false}
                                    labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
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
                                    barSize={window.innerWidth < 768 ? 15 : 20}
                                    radius={[4, 4, 4, 4]}
                                    label={window.innerWidth < 768 ? null : {
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
                        <DashboardCard className="order-3 row-span-2 p-6 transition-all duration-300 transform hover:shadow-xl bg-gradient-to-br from-white to-gray-50">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Latest Survey</h3>
                                    <p className="text-sm text-gray-600">Most recently created survey</p>
                                </div>
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                            </div>
                            {loading ? (
                                <div>
                                    <Skeleton height={288} className="mb-4 rounded-lg" />
                                    <Skeleton height={24} className="mb-3" />
                                    <Skeleton count={5} className="mb-2" />
                                    <Divider className="my-4" />
                                    <div className="flex justify-between">
                                        <Skeleton width={100} />
                                        <Skeleton width={100} />
                                    </div>
                                </div>
                            ) : (
                                data.latestSurvey ? (
                                    <div className="space-y-4">
                                        <div className="relative overflow-hidden transition-all duration-300 transform rounded-lg group hover:scale-[1.02]">
                                            <img
                                                src={data.latestSurvey.image_url || '/AceLogo.png'}
                                                loading="lazy"
                                                className="object-contain w-full mx-auto rounded-lg h-72 bg-gray-50"
                                                alt={data.latestSurvey.title}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/AceLogo.png';
                                                }}
                                            />
                                            <div className="absolute inset-0 transition-opacity duration-300 bg-black opacity-0 group-hover:opacity-10"></div>
                                        </div>

                                        <h3 className="mt-4 text-xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text">
                                            {data.latestSurvey.title}
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-500">Created Date</p>
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {formatDate(data.latestSurvey.created_at)}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-500">Questions</p>
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {data.latestSurvey.questions}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-500">Expire Date</p>
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {formatDate(data.latestSurvey.expire_date)}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-500">Responses</p>
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {data.latestSurvey.answers}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-2">
                                            <div className={`
                                                px-3 py-1 text-sm font-medium rounded-full
                                                ${isSurveyExpired(data.latestSurvey.expire_date)
                                                    ? "bg-red-100 text-red-600"
                                                    : data.latestSurvey.status
                                                        ? "bg-green-100 text-green-600"
                                                        : "bg-gray-100 text-gray-600"}
                                            `}>
                                                {isSurveyExpired(data.latestSurvey.expire_date)
                                                    ? "Expired"
                                                    : data.latestSurvey.status
                                                        ? "Active"
                                                        : "Closed"}
                                            </div>
                                        </div>

                                        <Divider />

                                        <div className="flex justify-between mt-4 space-x-4">
                                            <Link
                                                to={`/surveys/${data.latestSurvey.id}`}
                                                className="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium text-white transition-all duration-300 bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                            >
                                                <PencilIcon className="w-4 h-4 mr-2" />
                                                Edit Survey
                                            </Link>

                                            <button
                                                className="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium text-indigo-600 transition-all duration-300 bg-indigo-100 rounded-lg hover:bg-indigo-200"
                                                onClick={() => handleViewResponses(data.latestSurvey.id)}
                                            >
                                                <EyeIcon className="w-4 h-4 mr-2" />
                                                View Responses
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="text-gray-500">No surveys available</p>
                                    </div>
                                )
                            )}
                        </DashboardCard>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="w-full lg:w-2/3">
                    {/* Rating Distribution Pie Chart - Enhanced version */}
                    <DashboardCard
                        className="order-1 row-span-2 p-6 transition-all duration-300 transform lg:order-1 lg:mt-0 hover:shadow-xl"
                        style={{ animationDelay: '0.3s' }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Rating Distribution</h3>
                                <p className="text-sm text-gray-600">Overall survey satisfaction levels</p>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                </svg>
                            </div>
                        </div>
                        {loading ? (
                            <div className="h-72">
                                <Skeleton circle height={288} />
                            </div>
                        ) : (
                            <div className="relative">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={ratingsData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={120}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {ratingsData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke="none"
                                                    className="transition-all duration-300 hover:opacity-80"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0];
                                                    return (
                                                        <div style={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                                                            padding: '10px 14px',
                                                            maxWidth: '300px'
                                                        }}>
                                                            <p style={{
                                                                color: data.payload.fill || data.color,
                                                                fontWeight: 'bold',
                                                                fontSize: '15px'
                                                            }}>
                                                                {data.name} : {data.value} responses
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                            wrapperStyle={{
                                                zIndex: 1000,
                                                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={10}
                                            formatter={(value, entry) => (
                                                <span className="text-sm font-medium text-gray-600">
                                                    {value}
                                                </span>
                                            )}
                                            wrapperStyle={{
                                                paddingTop: '20px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {ratingsData.every(item => item.value === 0) && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-gray-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                        </svg>
                                        <p className="text-gray-500">No ratings available</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DashboardCard>

                    {/* Survey Analytics Line Chart */}
                    <DashboardCard
                        className="order-2 row-span-2 p-6 mt-5 mb-4 transition-all duration-300 transform hover:shadow-xl bg-gradient-to-br from-white to-gray-50"
                        style={{ animationDelay: '0.3s' }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Survey Analytics</h3>
                                <p className="text-sm text-gray-600">Monthly survey and response trends</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        {loading ? (
                            <div className="h-96">
                                <Skeleton height={300} className="mb-4 rounded-lg" />
                            </div>
                        ) : (
                            <div className="relative">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <defs>
                                            <linearGradient id="surveysGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="responsesGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            style={{
                                                fontSize: '12px',
                                                fill: '#4B5563'
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            style={{
                                                fontSize: '12px',
                                                fill: '#4B5563'
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                                padding: '8px 12px'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{
                                                paddingBottom: '20px'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="surveys"
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                            dot={{ r: 4, strokeWidth: 2 }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            name="Surveys Created"
                                            fill="url(#surveysGradient)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="responses"
                                            stroke="#82ca9d"
                                            strokeWidth={2}
                                            dot={{ r: 4, strokeWidth: 2 }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            name="Responses Received"
                                            fill="url(#responsesGradient)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>

                                {chartData.length === 0 ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-gray-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <p className="text-gray-500">No analytics data available</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="p-3 rounded-lg bg-purple-50">
                                            <p className="text-sm font-medium text-purple-600">Total Surveys</p>
                                            <p className="text-2xl font-bold text-purple-700">
                                                {chartData.reduce((sum, item) => sum + item.surveys, 0)}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-green-50">
                                            <p className="text-sm font-medium text-green-600">Total Responses</p>
                                            <p className="text-2xl font-bold text-green-700">
                                                {chartData.reduce((sum, item) => sum + item.responses, 0)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DashboardCard>

                    {/* Latest Responses */}
                    <DashboardCard
                        className="order-3 row-span-2 p-6 mt-5 transition-all duration-300 transform lg:order-3 hover:shadow-xl bg-gradient-to-br from-white to-gray-50"
                        style={{ animationDelay: '0.3s' }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Latest Responses</h3>
                                <p className="text-sm text-gray-600">Most recent survey submissions</p>
                            </div>
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="p-4 rounded-lg bg-gray-50 animate-pulse">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-2">
                                                <Skeleton width={200} height={20} />
                                                <Skeleton width={100} height={16} />
                                            </div>
                                            <Skeleton width={100} height={32} className="rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            data.latestAnswers && data.latestAnswers.length > 0 ? (
                                <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                                    {data.latestAnswers.map((answer) => (
                                        <div
                                            key={answer.id}
                                            onClick={() => handleViewDetail(answer.survey_id, answer.id)}
                                            className="p-4 transition-all duration-300 transform bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:scale-[1.01] group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-semibold text-gray-800 transition-colors duration-300 md:text-base group-hover:text-indigo-600 line-clamp-1">
                                                        {answer.survey.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 md:text-sm">
                                                        Response ID: #{answer.id}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full whitespace-nowrap md:text-sm">
                                                        {formatDate(answer.end_date)}
                                                    </span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="w-5 h-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                    <div className="p-4 rounded-full bg-gray-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-medium text-center text-gray-600">No Responses Yet</h4>
                                    <p className="text-sm text-center text-gray-500">Responses will appear here once surveys are completed</p>
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

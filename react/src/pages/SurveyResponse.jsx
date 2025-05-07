import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../axios.js";
import Loader from "../components/Loader";
import { Divider } from "@mui/joy";
import { DataGrid } from "@mui/x-data-grid";
import { gridClasses } from "@mui/x-data-grid";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { FaArrowLeft } from "react-icons/fa6";
import { format } from "date-fns";
import { MdOutlineInfo } from "react-icons/md";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function SurveyResponse() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [survey, setSurvey] = useState({ title: "", status: true });
    const [responses, setResponses] = useState({ data: [] });
    const [responseCount, setResponseCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchSurveyData = async () => {
            try {
                setLoading(true);
                const [surveyResponse, responsesResponse, countResponse] =
                    await Promise.all([
                        axiosClient.get(`/survey/${id}`),
                        axiosClient.get(`/survey/${id}/responses`),
                        axiosClient.get(`/survey/${id}/responses/count`),
                    ]);
                setSurvey(surveyResponse.data.data);
                setResponses(responsesResponse.data);
                setResponseCount(countResponse.data.count);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSurveyData();
        }
    }, [id]);

    const handleGoBack = () => navigate(-1);

    const handleViewDetail = (surveyId, responseId) => {
        navigate(`/surveys/${surveyId}/responses/${responseId}`);
    };

    const downloadCSV = () => {
        if (!responses.data.length || !survey.questions) return;

        const allQuestions = survey.questions.map(q => q.question);
        const headers = ['id', ...allQuestions, 'Date'];
        const csvRows = [headers.join(',')];

        responses.data.forEach(response => {
            // format created_at as before
            const rawDate = response.answers[0]?.created_at || '';
            let formattedDate = '';
            if (rawDate) {
                const d = new Date(rawDate);
                formattedDate = d.toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }

            const row = [
                `"${response.id}"`,
                ...allQuestions.map(q => {
                    // collect all answers for this question
                    const answers = response.answers.filter(ans => ans.question === q);

                    // flatten & normalize each ans.answer
                    const flat = answers.flatMap(ans => {
                        let val = ans.answer;
                        // if it's a JSON-array string, parse it
                        if (typeof val === 'string' && val.trim().startsWith('[') && val.trim().endsWith(']')) {
                            try {
                                const parsed = JSON.parse(val);
                                if (Array.isArray(parsed)) return parsed;
                            } catch (e) { /* fall through */ }
                        }
                        // otherwise treat as single answer
                        return val != null ? [val] : [];
                    });

                    // join with commas
                    const combined = flat.join(',');
                    // escape quotes
                    return `"${combined.replace(/"/g, '""')}"`;
                }),
                `"${formattedDate}"`
            ];

            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${survey.title}_responses.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };









    const columns = [
        {
            field: "answer",
            headerName: "Name",
            width: 300,
            flex: 1,
            minWidth: 150,
        },
        {
            field: "date",
            headerName: "Date",
            width: 300,
            flex: 1,
            minWidth: 150,
        },
        {
            field: "time",
            headerName: "Time",
            width: 300,
            flex: 1,
            minWidth: 150,
        },
        {
            field: "action",
            headerAlign: "center",
            headerName: "Action",
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <div className="flex justify-center gap-2">
                    <Tooltip
                        arrow
                        title="View Details"
                        placement="right"
                        TransitionComponent={Fade}
                    >
                        <div
                            onClick={() => handleViewDetail(id, params.row.id)}
                            className="p-2 my-2 text-black border rounded-lg cursor-pointer"
                        >
                            <MdOutlineInfo size={18} className="text-gray-600" />
                        </div>
                    </Tooltip>
                </div>
            ),
        },
    ];

    const rows = responses.data.map((response) => {
        const createdAt = new Date(response.answers[0]?.created_at);
        const answerDisplay = response.answers[0]?.answer || "No answer";

        return {
            id: response.id,
            answer: answerDisplay,
            date: format(createdAt, "MMMM d, yyyy"),
            time: format(createdAt, "h:mm a"),
        };
    });

    const filteredRows = rows.filter(
        (row) =>
            row.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.time.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="w-full mx-auto lg:w-9/12 xl:w-8/12">
                <div className="w-full mb-4">
                    <Skeleton height={32} width={300} />
                </div>
                <div className="flex justify-between w-full px-4 mb-4 bg-white rounded-lg">
                    <Skeleton circle width={48} height={48} />
                </div>
                <div className="flex flex-col w-full gap-4">
                    <div className="w-full p-6 bg-white rounded-lg">
                        <div className="w-full">
                            <Skeleton height={60} width={120} />
                            <Skeleton height={20} width={200} />
                        </div>
                    </div>
                    <div className="w-full p-4 bg-white rounded-lg">
                        <div className="h-[400px]">
                            {[...Array(5)].map((_, index) => (
                                <div key={index} className="flex justify-between p-4 border-b">
                                    <Skeleton width={200} />
                                    <Skeleton width={150} />
                                    <Skeleton width={150} />
                                    <Skeleton width={80} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error)
        return <div className="text-center text-red-500">Error: {error}</div>;

    if (!responses?.data?.length) {
        return (
            <div className="w-full mx-auto lg:w-9/12 xl:w-8/12">
                <div className="w-full mb-4 text-2xl font-semibold">
                    {survey.title} survey responses
                </div>
                <div className="p-8 text-center bg-white rounded-lg">
                    <p className="text-lg text-gray-600">
                        No responses found for this survey
                    </p>
                    <button
                        onClick={handleGoBack}
                        className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto lg:w-9/12 xl:w-8/12">
            <div className="w-full mb-4 text-2xl font-semibold">
                {survey.title} survey responses
            </div>
            <div
                className="flex items-center justify-between w-full px-4 mb-4 bg-white rounded-lg animate-fade-in-down"
                style={{ animationDelay: "0.1s" }}
            >
                <Tooltip title="Go Back" placement="bottom" TransitionComponent={Fade}>
                    <div
                        className="p-4 rounded-full cursor-pointer hover:bg-gray-100"
                        onClick={handleGoBack}
                    >
                        <FaArrowLeft className="text-gray-700" />
                    </div>
                </Tooltip>
                <button
                    onClick={downloadCSV}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                    Download Response
                </button>
            </div>

            <div className="flex flex-col w-full gap-4">
                <div
                    className="flex w-full bg-white rounded-lg bg-gradient-to-r from-blue-400 to-blue-800 animate-fade-in-down"
                    style={{ animationDelay: "0.2s" }}
                >
                    <div className="w-full ml-4 text-white md:ml-8 mt-14">
                        <div className="flex gap-2">
                            <p className="text-3xl font-semibold md:text-5xl">
                                {responseCount}
                            </p>
                        </div>
                        <p className="text-sm md:text-base">
                            Total responses in this survey
                        </p>
                    </div>
                    <Divider />
                    {survey.image_url && (
                        <img
                            src={survey.image_url}
                            loading="lazy"
                            alt={survey.title}
                            className="object-cover w-1/2 h-40 mt-4 mr-4 rounded-t-md"
                        />
                    )}
                </div>

                <div
                    className="w-full h-full p-4 bg-white rounded-lg animate-fade-in-down"
                    style={{ animationDelay: "0.3s" }}
                >
                    <input
                        type="text"
                        placeholder="Search responses"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 mb-4 border rounded-lg"
                    />
                    <DataGrid
                        sx={{
                            [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: {
                                outline: "none",
                            },
                            [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]: {
                                outline: "none",
                            },
                        }}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10 } },
                        }}
                        rows={filteredRows}
                        columns={columns}
                        pageSizeOptions={[10, 20, 50, 100]}
                        getRowId={(row) => row.id}
                    />
                </div>
            </div>
        </div>
    );
}

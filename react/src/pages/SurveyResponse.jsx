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

        // Collect all questions from the survey
        const allQuestions = survey.questions.map((q) => q.question); // Assuming this is the structure

        const headers = [...allQuestions]; // Column headers are the questions
        const csvRows = [headers.join(",")]; // Add headers to the CSV data

        // Loop through each response and collect answers per question
        responses.data.forEach((response) => {
            // Create a row for each response
            const row = allQuestions.map((q) => {
                // Find all answers for this question
                const answers = response.answers.filter((ans) => ans.question === q);
                // Combine all answers into one string with " | " separator
                const combined = answers.map((ans) => ans.answer || '').join(" | ");
                // Escape quotes
                return `"${combined.replace(/"/g, '""')}"`;
            });

            // Add the row to the CSV data
            csvRows.push(row.join(","));
        });

        // Create a Blob for CSV and trigger the download
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
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
                            className="p-2 my-2 rounded-lg text-black cursor-pointer border"
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
            <div className="w-full lg:w-9/12 xl:w-8/12 mx-auto">
                <div className="w-full mb-4">
                    <Skeleton height={32} width={300} />
                </div>
                <div className="flex justify-between mb-4 bg-white rounded-lg px-4 w-full">
                    <Skeleton circle width={48} height={48} />
                </div>
                <div className="w-full flex gap-4 flex-col">
                    <div className="bg-white rounded-lg w-full p-6">
                        <div className="w-full">
                            <Skeleton height={60} width={120} />
                            <Skeleton height={20} width={200} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 w-full">
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
        return <div className="text-red-500 text-center">Error: {error}</div>;

    if (!responses?.data?.length) {
        return (
            <div className="w-full lg:w-9/12 xl:w-8/12 mx-auto">
                <div className="w-full mb-4 text-2xl font-semibold">
                    {survey.title} survey responses
                </div>
                <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-gray-600 text-lg">
                        No responses found for this survey
                    </p>
                    <button
                        onClick={handleGoBack}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full lg:w-9/12 xl:w-8/12 mx-auto">
            <div className="w-full mb-4 text-2xl font-semibold">
                {survey.title} survey responses
            </div>
            <div
                className="flex justify-between items-center mb-4 bg-white rounded-lg px-4 w-full animate-fade-in-down"
                style={{ animationDelay: "0.1s" }}
            >
                <Tooltip title="Go Back" placement="bottom" TransitionComponent={Fade}>
                    <div
                        className="rounded-full p-4 cursor-pointer hover:bg-gray-100"
                        onClick={handleGoBack}
                    >
                        <FaArrowLeft className="text-gray-700" />
                    </div>
                </Tooltip>
                <button
                    onClick={downloadCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    Download CSV
                </button>
            </div>

            <div className="w-full flex gap-4 flex-col">
                <div
                    className="bg-white rounded-lg w-full flex bg-gradient-to-r from-blue-400 to-blue-800 animate-fade-in-down"
                    style={{ animationDelay: "0.2s" }}
                >
                    <div className="w-full ml-4 md:ml-8 text-white mt-14">
                        <div className="flex gap-2">
                            <p className="text-3xl md:text-5xl font-semibold">
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
                            alt={survey.title}
                            className="w-1/2 h-40 object-cover mt-4 mr-4 rounded-t-md"
                        />
                    )}
                </div>

                <div
                    className="bg-white rounded-lg p-4 w-full h-full animate-fade-in-down"
                    style={{ animationDelay: "0.3s" }}
                >
                    <input
                        type="text"
                        placeholder="Search responses"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-4 px-4 py-2 border rounded-lg w-full"
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

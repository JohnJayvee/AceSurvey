import React, { useEffect, useState } from "react";
import { useStateContext } from "../contexts/ContextProvider";
import SurveyListItem from "../components/SurveyListItem";
import { PlusCircleIcon, DocumentIcon } from "@heroicons/react/24/outline";
import axiosClient from "../axios";
import PaginationLinks from "../components/PaginationLinks";
import Breadcrumbs from "../components/Breadcrumbs";
import { Link } from "react-router-dom";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SearchBar from "../components/SearchBar";
import { motion } from "framer-motion";

export default function Surveys() {
    const { showToast } = useStateContext();
    const [allSurveys, setAllSurveys] = useState([]); // Store all surveys
    const [filteredSurveys, setFilteredSurveys] = useState([]); // Store filtered surveys
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const onDeleteClick = (id) => {
        if (window.confirm("Are you sure you want to delete this survey?")) {
            axiosClient.delete(`/survey/${id}`).then(() => {
                getSurveys();
                showToast("The survey was deleted");
            });
        }
    };

    const onPageClick = (link) => {
        getSurveys(link.url);
    };

    const getSurveys = (url = "/survey") => {
        if (loading) return;

        setLoading(true);

        axiosClient
            .get(url)
            .then(({ data }) => {
                setAllSurveys(data.data);
                setFilteredSurveys(data.data);
                setMeta(data.meta);
            })
            .catch((err) => {
                console.error("Error fetching surveys:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Updated search handler for local filtering
    const handleSearch = (value) => {
        setSearchTerm(value);

        // Remove any trim() check to allow single character searches
        const searchValue = value.toLowerCase();
        const filtered = allSurveys.filter((survey) =>
            survey.title.toLowerCase().includes(searchValue) ||
            survey.description.toLowerCase().includes(searchValue)
        );

        setFilteredSurveys(filtered);
    };

    useEffect(() => {
        getSurveys();
    }, []);

    const breadcrumbLinks = [
        { to: "/dashboard", label: "Home" },
        { to: "", label: "Survey List" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full mx-auto xl:w-11/12"
        >
            {/* Header Section */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col gap-6 mb-8 md:flex-row md:items-center md:justify-between"
            >
                <div className="flex flex-col justify-center">
                    <h1 className="text-2xl font-bold text-gray-900">Survey List</h1>
                    <Breadcrumbs links={breadcrumbLinks} />
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="w-full md:w-64">
                        <SearchBar
                            searchTerm={searchTerm}
                            onSearch={handleSearch}
                            placeholder="Search surveys..."
                        />
                    </div>

                    <Link
                        to="/surveys/create"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 hover:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        <span className="hidden md:inline-block">Create New Survey</span>
                    </Link>
                </div>
            </motion.div>

            {/* Loading State */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {[...Array(8)].map((_, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
                        >
                            <Skeleton height={200} className="object-cover w-full" />
                            <div className="p-5">
                                <Skeleton height={24} width="70%" className="mb-3" />
                                <Skeleton height={16} count={2} className="mb-4" />
                                <div className="flex items-center justify-between">
                                    <Skeleton height={36} width={80} />
                                    <div className="flex gap-2">
                                        <Skeleton height={36} width={36} className="rounded-lg" />
                                        <Skeleton height={36} width={36} className="rounded-lg" />
                                        <Skeleton height={36} width={36} className="rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Content */}
            {!loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {filteredSurveys.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl"
                        >
                            <DocumentIcon className="w-16 h-16 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">
                                {searchTerm ? "No surveys found" : "No surveys yet"}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm
                                    ? "Try adjusting your search terms"
                                    : "Get started by creating your first survey"}
                            </p>
                            {!searchTerm && (
                                <Link
                                    to="/surveys/create"
                                    className="flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    <PlusCircleIcon className="w-5 h-5" />
                                    Create Survey
                                </Link>
                            )}
                        </motion.div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredSurveys.map((survey, index) => (
                                    <motion.div
                                        key={survey.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <SurveyListItem
                                            survey={survey}
                                            onDeleteClick={onDeleteClick}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                            {filteredSurveys.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-8"
                                >
                                    <PaginationLinks
                                        meta={meta}
                                        onPageClick={onPageClick}
                                    />
                                </motion.div>
                            )}
                        </>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}

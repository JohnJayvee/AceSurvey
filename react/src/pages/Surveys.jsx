import React, { useEffect, useState, useRef } from "react";
import { useStateContext } from "../contexts/ContextProvider";
import SurveyListItem from "../components/SurveyListItem";
import { PlusCircleIcon, DocumentIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [surveyToDelete, setSurveyToDelete] = useState(null);
    const [requestInProgress, setRequestInProgress] = useState({});
    const [pageCache, setPageCache] = useState({}); // Add page data caching
    const initialLoadDone = useRef(false);

    const onDeleteClick = (id) => {
        setSurveyToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        axiosClient.delete(`/survey/${surveyToDelete}`).then(() => {
            getSurveys();
            showToast("The survey was deleted");
            setShowDeleteModal(false);
        });
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSurveyToDelete(null);
    };

    // Modify your onPageClick function to replace history state instead of adding to it
    const onPageClick = (link) => {
        // Just fetch data without changing URL
        getSurveys(link.url);
    };

    const getSurveys = (url = "/survey") => {
        if (loading) return;

        // Check if this exact URL is already being requested
        if (requestInProgress[url]) return;

        // Check if we already have this page cached
        if (pageCache[url]) {
            setAllSurveys(pageCache[url].data);
            setFilteredSurveys(pageCache[url].data);
            setMeta(pageCache[url].meta);
            return;
        }

        setLoading(true);
        // Track this URL request
        setRequestInProgress(prev => ({ ...prev, [url]: true }));

        // Using Promise.all for multiple requests
        Promise.all([
            axiosClient.get(url),
            // Add more requests here if needed
            // axiosClient.get('/some-other-endpoint')
        ])
            .then(([surveyResponse]) => {
                const { data } = surveyResponse;

                // Cache the results
                setPageCache(prev => ({
                    ...prev,
                    [url]: { data: data.data, meta: data.meta }
                }));

                setAllSurveys(data.data);
                setFilteredSurveys(data.data);
                setMeta(data.meta);
            })
            .catch((err) => {
                console.error("Error fetching surveys:", err);
            })
            .finally(() => {
                setLoading(false);
                // Clear the tracking for this URL
                setRequestInProgress(prev => {
                    const updated = { ...prev };
                    delete updated[url];
                    return updated;
                });
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
        // Skip if we've already loaded once
        if (initialLoadDone.current) return;

        getSurveys();
        initialLoadDone.current = true;

        return () => {
            // cleanup if needed
        };
    }, []);  // Empty dependency array ensures this runs only once

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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl"
                    >
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-center text-gray-900">
                            Delete Survey
                        </h3>
                        <p className="mb-6 text-sm text-center text-gray-500">
                            Are you sure you want to delete this survey? This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Yes, delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}

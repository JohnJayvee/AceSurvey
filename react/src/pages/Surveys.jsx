import React, { useEffect, useState } from "react";
import { useStateContext } from "../contexts/ContextProvider";
import SurveyListItem from "../components/SurveyListItem";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import axiosClient from "../axios";
import PaginationLinks from "../components/PaginationLinks";
import Breadcrumbs from "../components/Breadcrumbs";
import { Link } from "react-router-dom";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SearchBar from "../components/SearchBar";

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
        <div className="w-full mx-auto xl:w-11/12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col justify-center">
                    <p className="text-2xl font-semibold">Survey List</p>
                    <Breadcrumbs links={breadcrumbLinks} />
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-64"> {/* Fixed width for search bar */}
                        <SearchBar
                            searchTerm={searchTerm}
                            onSearch={handleSearch}
                        />
                    </div>

                    <Link
                        to="/surveys/create"
                        className="flex items-center p-2 text-indigo-500 transition-colors duration-200 border border-indigo-300 rounded-lg bg-indigo-50 hover:text-white hover:bg-indigo-300"
                    >
                        <PlusCircleIcon className="w-6 h-6 mr-0 md:mr-2" />
                        <span className="hidden md:block">Create new</span>
                    </Link>
                </div>
            </div>

            {loading && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <Skeleton height={150} className="mb-4" /> {/* Image placeholder */}
                            <Skeleton height={24} className="mb-2" /> {/* Title */}
                            <Skeleton height={16} count={3} className="mb-4" /> {/* Description */}
                            <div className="flex items-center justify-between">
                                <Skeleton height={36} width={80} /> {/* Edit button */}
                                <div className="flex gap-2">
                                    <Skeleton height={36} width={36} /> {/* Icon button 1 */}
                                    <Skeleton height={36} width={36} /> {/* Icon button 2 */}
                                    <Skeleton height={36} width={36} /> {/* Icon button 3 */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && (
                <div>
                    {filteredSurveys.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                            {searchTerm
                                ? "No surveys found matching your search"
                                : "You don't have surveys created"}
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredSurveys.map((survey) => (
                            <SurveyListItem
                                survey={survey}
                                key={survey.id}
                                onDeleteClick={onDeleteClick}
                            />
                        ))}
                    </div>
                    {filteredSurveys.length > 0 && (
                        <PaginationLinks
                            meta={meta}
                            onPageClick={onPageClick}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

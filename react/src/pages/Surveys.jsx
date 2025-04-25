import React, { useEffect, useState, useCallback, useRef } from "react";
import { useStateContext } from "../contexts/ContextProvider";
import SurveyListItem from "../components/SurveyListItem";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import axiosClient from "../axios";
import PaginationLinks from "../components/PaginationLinks";
import Breadcrumbs from "../components/Breadcrumbs";
import { Link } from "react-router-dom";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { debounce } from 'lodash';

export default function Surveys() {
    const { showToast } = useStateContext();
    const [surveys, setSurveys] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Ref to track ongoing request to prevent duplicates
    const isRequesting = useRef(false);

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

    const debouncedSearch = useCallback(
        debounce((term) => {
            getSurveys(term ? `/survey?search=${encodeURIComponent(term)}` : "/survey");
        }, 300), // Debounce search by 300ms
        []
    );

    const getSurveys = (url = "/survey") => {
        if (loading || isRequesting.current) return;  // Prevent duplicate requests if already loading

        setLoading(true);
        isRequesting.current = true;  // Mark the request as in progress

        console.log("Making request to:", url);  // Log the URL to check the request flow

        axiosClient
            .get(url)
            .then(({ data }) => {
                setSurveys(data.data);
                setMeta(data.meta);
            })
            .catch((err) => {
                console.error("Error fetching surveys:", err);
            })
            .finally(() => {
                setLoading(false);
                isRequesting.current = false;  // Mark the request as completed
            });
    };

    // This function handles the search input changes
    const handleSearch = (value) => {
        setSearchTerm(value);
        debouncedSearch(value);
    };

    useEffect(() => {
        getSurveys();
    }, []);  // This will only run once when the component is mounted

    const breadcrumbLinks = [
        { to: "/dashboard", label: "Home" },
        { to: "", label: "Survey List" },
    ];

    return (
        <div className="w-full xl:w-11/12 mx-auto ">
            <div className="flex justify-between mb-8 ">
                <div className="py-4 items-center">
                    <p className=" font-semibold text-2xl">Survey List</p>
                    <Breadcrumbs links={breadcrumbLinks} />
                </div>

                <div className="py-4">
                    <input
                        type="text"
                        placeholder="Search surveys..."
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)} // Using handleSearch here
                    />
                </div>

                <div className="items-center py-4 ">
                    <Link
                        to="/surveys/create"
                        style={{ textDecoration: "none" }}
                    >
                        <button className="flex p-2 bg-emerald-50 border border-emerald-300 text-emerald-500 rounded-lg hover:text-white hover:bg-emerald-300  ">
                            <PlusCircleIcon className="h-6 w-6 mr-0 md:mr-2" />
                            <p className="hidden md:block self-center">Create new</p>
                        </button>
                    </Link>
                </div>
            </div>

            {loading && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <Skeleton height={150} className="mb-4" /> {/* Image placeholder */}
                            <Skeleton height={24} className="mb-2" /> {/* Title */}
                            <Skeleton height={16} count={3} className="mb-4" /> {/* Description */}
                            <div className="flex justify-between items-center">
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
                    {surveys.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                            You don't have surveys created
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {surveys.map((survey) => (
                            <SurveyListItem
                                survey={survey}
                                key={survey.id}
                                onDeleteClick={onDeleteClick}
                            />
                        ))}
                    </div>
                    {surveys.length > 0 && (
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

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useStateContext } from "@context/ContextProvider";
import SurveyListItem from "@components/SurveyListItem";
import { PlusCircleIcon, DocumentIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import axiosClient from "@api/axios";
import PaginationLinks from "@components/PaginationLinks";
import Breadcrumbs from "@components/Breadcrumbs";
import { Link } from "react-router-dom";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SearchBar from "@components/SearchBar";
import { motion, AnimatePresence } from "framer-motion";

export default function Surveys() {
   const { showToast } = useStateContext();
   const [surveyState, setSurveyState] = useState({
      allSurveys: [],
      filteredSurveys: [],
      meta: {},
   });
   const [uiState, setUiState] = useState({
      loading: false,
      error: null,
      searchTerm: "",
      showDeleteModal: false,
      surveyToDelete: null,
      refreshing: false
   });
   const [requestInProgress, setRequestInProgress] = useState({});
   const [pageCache, setPageCache] = useState({});
   const initialLoadDone = useRef(false);
   const pollInterval = useRef(null);

   // Extract values from state objects for easier access
   const { allSurveys, filteredSurveys, meta } = surveyState;
   const { loading, error, searchTerm, showDeleteModal, surveyToDelete, refreshing } = uiState;

   // Memoized delete handler to prevent unnecessary re-renders
   const onDeleteClick = useCallback((id) => {
      setUiState(prev => ({
         ...prev,
         surveyToDelete: id,
         showDeleteModal: true
      }));
   }, []);

   // Optimistic UI update for deletion
   const confirmDelete = useCallback(() => {
      // Optimistically update UI
      const updatedSurveys = allSurveys.filter(survey => survey.id !== surveyToDelete);
      setSurveyState(prev => ({
         ...prev,
         allSurveys: updatedSurveys,
         filteredSurveys: updatedSurveys.filter(survey =>
            survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            survey.description.toLowerCase().includes(searchTerm.toLowerCase())
         )
      }));

      // Close modal immediately for better UX
      setUiState(prev => ({
         ...prev,
         showDeleteModal: false
      }));

      // Send API request
      axiosClient.delete(`/survey/${surveyToDelete}`)
         .then(() => {
            // Clear cache and show success toast
            setPageCache({});
            showToast("The survey was deleted successfully");
         })
         .catch((err) => {
            console.error("Delete error:", err);
            // Revert optimistic update if API call fails
            showToast("Failed to delete survey. Please try again.", "error");
            getSurveys("/survey", true); // Refresh data from server
         });
   }, [surveyToDelete, allSurveys, searchTerm, showToast]);

   const cancelDelete = useCallback(() => {
      setUiState(prev => ({
         ...prev,
         showDeleteModal: false,
         surveyToDelete: null
      }));
   }, []);

   // Memoized page click handler
   const onPageClick = useCallback((link) => {
      getSurveys(link.url);
   }, []);

   // Enhanced getSurveys function with better error handling
   const getSurveys = useCallback((url = "/survey", forceRefresh = false) => {
      if (loading && !refreshing) return;

      // Check if this exact URL is already being requested
      if (requestInProgress[url]) return;

      // Set loading state based on context
      setUiState(prev => ({
         ...prev,
         loading: !refreshing ? true : prev.loading,
         refreshing: refreshing,
         error: null
      }));

      // Check cached data
      if (!forceRefresh && pageCache[url]) {
         setSurveyState({
            allSurveys: pageCache[url].data,
            filteredSurveys: pageCache[url].data,
            meta: pageCache[url].meta
         });

         setUiState(prev => ({
            ...prev,
            loading: false,
            refreshing: false
         }));
         return;
      }

      // Track this URL request
      setRequestInProgress(prev => ({ ...prev, [url]: true }));

      axiosClient.get(url)
         .then((response) => {
            const { data } = response;

            // Cache the results
            setPageCache(prev => ({
               ...prev,
               [url]: { data: data.data, meta: data.meta }
            }));

            setSurveyState({
               allSurveys: data.data,
               filteredSurveys: data.data,
               meta: data.meta
            });

            // Handle search term if exists
            if (searchTerm) {
               handleSearch(searchTerm);
            }
         })
         .catch((err) => {
            console.error("Error fetching surveys:", err);
            setUiState(prev => ({
               ...prev,
               error: "Failed to load surveys. Please try again."
            }));
            showToast("Failed to load surveys. Please try again.", "error");
         })
         .finally(() => {
            setUiState(prev => ({
               ...prev,
               loading: false,
               refreshing: false
            }));

            // Clear the tracking for this URL
            setRequestInProgress(prev => {
               const updated = { ...prev };
               delete updated[url];
               return updated;
            });
         });
   }, [loading, refreshing, requestInProgress, pageCache, searchTerm, showToast]);

   // Improved search with debouncing
   const handleSearch = useCallback((value) => {
      setUiState(prev => ({
         ...prev,
         searchTerm: value
      }));

      const searchValue = value.toLowerCase();
      const filtered = allSurveys.filter((survey) =>
         survey.title.toLowerCase().includes(searchValue) ||
         survey.description.toLowerCase().includes(searchValue)
      );

      setSurveyState(prev => ({
         ...prev,
         filteredSurveys: filtered
      }));
   }, [allSurveys]);

   // Manual refresh function
   const handleRefresh = useCallback(() => {
      setUiState(prev => ({
         ...prev,
         refreshing: true
      }));
      setPageCache({});
      getSurveys("/survey", true);
   }, [getSurveys]);

   // Setup polling for real-time updates
   useEffect(() => {
      // Skip if we've already loaded once
      if (!initialLoadDone.current) {
         getSurveys();
         initialLoadDone.current = true;
      }

      // Setup polling every 30 seconds
      pollInterval.current = setInterval(() => {
         if (!document.hidden) { // Only poll when tab is visible
            getSurveys("/survey", true);
         }
      }, 30000);

      return () => {
         clearInterval(pollInterval.current);
      };
   }, [getSurveys]);

   // Add this to your Surveys.jsx component
   useEffect(() => {
      const handleSurveyUpdate = (event) => {
         const { action } = event.detail;

         console.log('Survey update event received in Surveys page:', action);

         // Clear page cache
         setPageCache({});

         // Force refresh surveys list
         getSurveys("/survey", true); // Force refresh
      };

      window.addEventListener('surveyUpdated', handleSurveyUpdate);

      return () => {
         window.removeEventListener('surveyUpdated', handleSurveyUpdate);
      };
   }, [getSurveys]);

   const breadcrumbLinks = [
      { to: "/dashboard", label: "Home" },
      { to: "", label: "Survey List" },
   ];

   // Render error state
   if (error && !loading && filteredSurveys.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Failed to load surveys</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
               onClick={handleRefresh}
               className="flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
               <ArrowPathIcon className="w-5 h-5" />
               Try Again
            </button>
         </div>
      );
   }

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

               <div className="flex gap-2">
                  <button
                     onClick={handleRefresh}
                     disabled={loading || refreshing}
                     className="p-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                     <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>

                  <Link
                     to="/surveys/create"
                     className="flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 hover:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                     <PlusCircleIcon className="w-5 h-5" />
                     <span className="hidden md:inline-block">Create New Survey</span>
                  </Link>
               </div>
            </div>
         </motion.div>

         {/* Loading State */}
         {loading && !refreshing && (
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
         {(!loading || refreshing) && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className={refreshing ? 'opacity-60' : ''}
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
                        <AnimatePresence>
                           {filteredSurveys.map((survey, index) => (
                              <motion.div
                                 key={survey.id}
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.9 }}
                                 transition={{ delay: index * 0.05 }}
                                 layout
                              >
                                 <SurveyListItem
                                    survey={survey}
                                    onDeleteClick={onDeleteClick}
                                 />
                              </motion.div>
                           ))}
                        </AnimatePresence>
                     </div>
                     {filteredSurveys.length > 0 && meta.links && meta.links.length > 3 && (
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
         <AnimatePresence>
            {showDeleteModal && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
               >
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
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
               </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
   );
}

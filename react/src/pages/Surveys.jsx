import React, { useCallback } from "react";
import { PlusCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Breadcrumbs from "@components/Breadcrumbs";
import { Link } from "react-router-dom";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import SearchBar from "@components/SearchBar";
import SurveyGrid from "@components/SurveyGrid";
import DeleteModal from "@components/DeleteModal";
import { motion } from "framer-motion";
import { useSurveys } from "@hooks/useSurveys";
import { useDeleteModal } from "@hooks/useDeleteModal";
import { useStateContext } from '@context/ContextProvider';

const LoadingSkeleton = () => (
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
);

const ErrorState = ({ error, onRetry }) => (
   <div className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl">
      <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">Failed to load surveys</h3>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      <button
         onClick={onRetry}
         className="flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
         <ArrowPathIcon className="w-5 h-5" />
         Try Again
      </button>
   </div>
);

export default function Surveys() {
   const { currentUser } = useStateContext();
   const {
      filteredSurveys,
      meta,
      loading,
      error,
      searchTerm,
      refreshing,
      getSurveys,
      handleSearch,
      deleteSurvey,
      refresh
   } = useSurveys();

   const { isOpen, surveyToDelete, openModal, closeModal } = useDeleteModal();

   const handlePageClick = useCallback((link) => {
      getSurveys(link.url);
   }, [getSurveys]);

   const handleDeleteConfirm = useCallback(async () => {
      if (!surveyToDelete) return;

      closeModal();
      try {
         await deleteSurvey(surveyToDelete);
      } catch (error) {
         // Error handling is done in the hook
      }
   }, [surveyToDelete, deleteSurvey, closeModal]);

   const breadcrumbLinks = [
      { to: "/dashboard", label: "Home" },
      { to: "", label: "Survey List" },
   ];

   // Render error state
   if (error && !loading && filteredSurveys.length === 0) {
      return <ErrorState error={error} onRetry={refresh} />;
   }

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="ace-surveys-page"
      >
         {/* Header Section */}
         <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="ace-page-heading"
         >
            <div className="flex flex-col justify-center">
               <span className="ace-eyebrow">ASK. LISTEN. UNDERSTAND.</span><h1>{currentUser.is_admin ? 'All surveys' : 'Your surveys'}</h1><p>{currentUser.is_admin ? 'Browse surveys created across all accounts.' : 'A home for every question and every perspective.'}</p>

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
                     onClick={refresh}
                     disabled={loading || refreshing}
                     aria-label="Refresh surveys"
                     className="p-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                     <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>

                  <Link
                     to="/surveys/create"
                     className="flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 hover:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                     <PlusCircleIcon className="w-5 h-5" />
                     <span className="inline-block">Create survey</span>
                  </Link>
               </div>
            </div>
         </motion.div>

         {/* Content */}
         {loading && !refreshing ? (
            <LoadingSkeleton />
         ) : (
            <SurveyGrid
               surveys={filteredSurveys}
               meta={meta}
               searchTerm={searchTerm}
               onDeleteClick={openModal}
               onPageClick={handlePageClick}
               refreshing={refreshing}
            />
         )}

         {/* Delete Confirmation Modal */}
         <DeleteModal
            isOpen={isOpen}
            onConfirm={handleDeleteConfirm}
            onCancel={closeModal}
            title="Delete Survey"
            message="Are you sure you want to delete this survey? This action cannot be undone."
         />
      </motion.div>
   );
}

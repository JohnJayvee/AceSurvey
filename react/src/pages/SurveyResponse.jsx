import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { debounce } from 'lodash';

// Components
import SurveyHeader from "@components/SurveyHeader";
import SurveyStats from "@components/SurveyStats";
import RatingChart from "@components/RatingChart";
import ResponsesTable from "@components/ResponsesTable";

// Hooks
import { useSurveyData } from "@hooks/useSurveyData";
import { useWindowSize } from "@hooks/useWindowSize";
import { useCSVDownload } from "@hooks/useCSVDownload";

// Utils
import { transformResponsesData, filterResponses } from "@utils/surveyUtils";

export default function SurveyResponse() {
   const { id } = useParams();
   const navigate = useNavigate();
   const [searchQuery, setSearchQuery] = useState("");

   const { width } = useWindowSize();
   const { survey, responses, responseCount, ratingsData, loading, error } = useSurveyData(id);
   const { downloadCSV } = useCSVDownload(survey, responses);

   const handleGoBack = () => navigate(-1);

   const handleViewDetail = (surveyId, responseId) => {
      navigate(`/surveys/${surveyId}/responses/${responseId}`);
   };

   if (loading) return <SurveyResponseSkeleton />;
   if (error) return <ErrorDisplay error={error} />;
   if (!responses?.data?.length) return <NoResponsesDisplay survey={survey} onGoBack={handleGoBack} />;

   const rows = transformResponsesData(responses.data, survey);
   const filteredRows = filterResponses(rows, searchQuery);

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="ace-responses-page"
      >
         <SurveyHeader
            title={survey.title}
            onGoBack={handleGoBack}
            onDownload={downloadCSV}
         />

         <div className="grid gap-4 sm:gap-6">
            <SurveyStats
               responseCount={responseCount}
               survey={survey}
            />

            <RatingChart
               ratingsData={ratingsData}
               width={width}
            />

            <ResponsesTable
               rows={filteredRows}
               searchQuery={searchQuery}
               onSearchChange={setSearchQuery}
               onViewDetail={(responseId) => handleViewDetail(id, responseId)}
               width={width}
            />
         </div>
      </motion.div>
   );
}

// Skeleton component using CSS-based skeleton loading
const SurveyResponseSkeleton = () => (
   <div className="w-full mx-auto lg:w-9/12 xl:w-8/12">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between w-full mb-6">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-80 animate-pulse"></div>
         </div>
         <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      <div className="flex flex-col w-full gap-4">
         {/* Stats Skeleton */}
         <div className="w-full p-6 bg-white rounded-lg shadow-sm">
            <div className="h-6 mb-4 bg-gray-200 rounded w-36 animate-pulse"></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
               {[...Array(4)].map((_, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                     <div className="w-24 h-4 mb-2 bg-gray-200 rounded animate-pulse"></div>
                     <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
               ))}
            </div>
         </div>

         {/* Chart Skeleton */}
         <div className="w-full p-6 bg-white rounded-lg shadow-sm">
            <div className="w-32 h-6 mb-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center justify-center h-64">
               <div className="w-48 h-48 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
               {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                     <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
               ))}
            </div>
         </div>

         {/* Table Skeleton */}
         <div className="w-full p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <div className="h-6 bg-gray-200 rounded w-36 animate-pulse"></div>
               <div className="w-64 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            <div className="overflow-hidden border border-gray-200 rounded-lg">
               {/* Table Header */}
               <div className="flex p-4 border-b bg-gray-50">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-4 ml-auto bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-4 ml-auto bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 ml-auto bg-gray-200 rounded animate-pulse"></div>
               </div>

               {/* Table Rows */}
               {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center p-4 border-b border-gray-200">
                     <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                     <div className="w-24 h-4 ml-auto bg-gray-200 rounded animate-pulse"></div>
                     <div className="w-20 h-4 ml-auto bg-gray-200 rounded animate-pulse"></div>
                     <div className="w-16 h-8 ml-auto bg-gray-200 rounded animate-pulse"></div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   </div>
);

// Error display component
const ErrorDisplay = ({ error }) => (
   <div className="w-full mx-auto lg:w-9/12 xl:w-8/12">
      <div className="p-8 text-center bg-white rounded-lg shadow-sm">
         <div className="mb-4 text-4xl">⚠️</div>
         <h2 className="mb-2 text-xl font-semibold text-gray-900">Unable to Load Survey</h2>
         <p className="mb-4 text-gray-600">
            {error.includes('canceled') ?
               'Request was interrupted. Please try again.' :
               error
            }
         </p>
         <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
         >
            Retry
         </button>
      </div>
   </div>
);

// No responses display component
const NoResponsesDisplay = ({ survey, onGoBack }) => (
   <div className="w-full mx-auto lg:w-9/12 xl:w-8/12">
      <div className="w-full mb-4 text-2xl font-semibold">
         {survey?.title} survey responses
      </div>
      <div className="p-8 text-center bg-white rounded-lg shadow-sm">
         <div className="mb-4 text-4xl">📊</div>
         <p className="mb-4 text-lg text-gray-600">
            No responses found for this survey
         </p>
         <button
            onClick={onGoBack}
            className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
         >
            Go Back
         </button>
      </div>
   </div>
);

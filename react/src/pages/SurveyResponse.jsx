import PropTypes from 'prop-types';
import SurveyResponseSkeleton from '@components/SurveyResponseSkeleton';
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";


// Components
import SurveyHeader from "@components/SurveyHeader";
import ResponseOverview from "@components/ResponseOverview";

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
   const { downloadCSV, exporting, exportError } = useCSVDownload(survey);

   const handleGoBack = () => navigate('/surveys');

   const handleViewDetail = (surveyId, responseId) => {
      navigate(`/surveys/${surveyId}/responses/${responseId}`);
   };

   if (loading) return <SurveyResponseSkeleton />;
   if (error) return <ErrorDisplay error={error} />;


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
            exporting={exporting}
         />
         {exportError && <p role="alert" className="p-3 mb-4 text-red-700 bg-red-50 rounded-lg">{exportError}</p>}

         <div className="grid gap-4 sm:gap-6">
            <ResponseOverview survey={survey} responseCount={responseCount} ratingsData={ratingsData} />
            {responseCount > responses.data.length && <p className="text-sm text-gray-500">Showing the latest {responses.data.length.toLocaleString()} responses. Export CSV includes all {responseCount.toLocaleString()} responses.</p>}
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
ErrorDisplay.propTypes = {
   error: PropTypes.string,
};

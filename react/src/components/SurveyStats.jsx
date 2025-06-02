import React from "react";
import { format } from "date-fns";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";

const SurveyStats = ({ responseCount, survey, onGoBack, width, onOpenShare, onViewResponses, onDelete }) => {
   const navigate = useNavigate();

   const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
         return format(new Date(dateString), "MMMM d, yyyy");
      } catch (error) {
         return "Invalid Date";
      }
   };

   const getStatusBadge = (status) => {
      const isActive = status === 1 || status === true || status === "active";
      return (
         <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive
               ? "bg-green-100 text-green-800"
               : "bg-red-100 text-red-800"
               }`}
         >
            {isActive ? "Active" : "Inactive"}
         </span>
      );
   };

   // Handle back navigation with fallback
   const handleGoBack = (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("Back button clicked!");
      console.log("onGoBack prop:", onGoBack);
      console.log("onGoBack type:", typeof onGoBack);

      // If onGoBack prop is provided and is a function, use it
      if (onGoBack && typeof onGoBack === 'function') {
         console.log("Using provided onGoBack function...");
         try {
            onGoBack();
            console.log("onGoBack called successfully");
         } catch (error) {
            console.error("Error calling onGoBack:", error);
         }
      } else {
         // Fallback: navigate to surveys page directly
         console.log("onGoBack not provided, using fallback navigation");
         try {
            navigate('/surveys');
            console.log("Navigated to /surveys successfully");
         } catch (error) {
            console.error("Error navigating:", error);
         }
      }
   };

   return (
      <div className="space-y-4">
         {/* Back Button Section - 100% identical to SurveyActions */}
         <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-3 bg-white border border-gray-100 shadow-sm sm:p-4 rounded-xl backdrop-blur-xl bg-opacity-90">
            <Tooltip title="Back to Surveys" placement="bottom" TransitionComponent={Fade}>
               <button
                  onClick={handleGoBack}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 transition-all duration-200 rounded-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                  type="button"
               >
                  <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{width < 768 ? "Back" : "Back to Surveyss"}</span>
               </button>
            </Tooltip>
         </div>

         {/* Survey Statistics */}
         <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Survey Statistics</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
               <div className="p-4 border border-gray-200 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Total Responses</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                     {responseCount || 0}
                  </dd>
               </div>

               <div className="p-4 border border-gray-200 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Survey Status</dt>
                  <dd className="mt-1">
                     {getStatusBadge(survey?.status)}
                  </dd>
               </div>

               <div className="p-4 border border-gray-200 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                     {formatDate(survey?.created_at)}
                  </dd>
               </div>

               <div className="p-4 border border-gray-200 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                     {formatDate(survey?.updated_at)}
                  </dd>
               </div>
            </div>

            {survey?.description && (
               <div className="p-4 mt-4 rounded-lg bg-gray-50">
                  <dt className="mb-2 text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-700">
                     {survey.description}
                  </dd>
               </div>
            )}
         </div>
      </div>
   );
};

export default SurveyStats;

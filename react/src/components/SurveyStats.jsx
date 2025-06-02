import React from "react";
import { format } from "date-fns";

const SurveyStats = ({ responseCount, survey }) => {
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

   return (
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
   );
};

export default SurveyStats;

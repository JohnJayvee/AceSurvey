import React from "react";
import { ArrowLeftIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

const SurveyHeader = ({ title, onGoBack, onDownload }) => {
   return (
      <div className="flex items-center justify-between w-full mb-6">
         <div className="flex items-center gap-4">
            <button
               onClick={onGoBack}
               className="flex items-center justify-center w-10 h-10 text-gray-600 transition-colors bg-white rounded-lg hover:bg-gray-50 hover:text-gray-800"
               aria-label="Go back"
            >
               <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
               {title} Survey Responses
            </h1>
         </div>

         <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
         >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Download CSV</span>
            <span className="sm:hidden">CSV</span>
         </button>
      </div>
   );
};

export default SurveyHeader;

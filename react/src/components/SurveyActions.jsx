import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa6';
import {
   ArrowTopRightOnSquareIcon,
   EyeIcon,
   UsersIcon,
   TrashIcon,
} from "@heroicons/react/24/outline";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";

const SurveyActions = ({
   id,
   survey,
   onGoBack,
   onOpenShare,
   onViewResponses,
   onDelete,
   width
}) => {
   // Don't render if survey is not loaded yet
   if (!survey || !survey.id) {
      return null;
   }

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="sticky top-0 z-10 flex flex-col justify-between gap-3 p-3 mb-4 bg-white border border-gray-100 shadow-sm sm:flex-row sm:p-4 sm:mb-6 rounded-xl backdrop-blur-xl bg-opacity-90 sm:gap-4"
      >
         {/* Back Button */}
         <div className="flex items-center space-x-2">
            <Tooltip title="Go Back" placement="bottom" TransitionComponent={Fade}>
               <button
                  onClick={onGoBack}
                  className="p-1.5 sm:p-2 transition-all duration-200 rounded-lg hover:bg-gray-100 active:bg-gray-200"
               >
                  <FaArrowLeft className="w-4 h-4 text-gray-700 sm:w-5 sm:h-5" />
               </button>
            </Tooltip>
         </div>

         {/* Action Buttons - Only show if we have an ID (editing mode) */}
         {id && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
               {/* Share Survey Button */}
               <Tooltip title="Share Survey" placement="bottom" TransitionComponent={Fade}>
                  <button
                     onClick={onOpenShare}
                     className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 transition-all duration-200 rounded-lg bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                     <ArrowTopRightOnSquareIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                     <span className="hidden sm:inline">Share</span>
                  </button>
               </Tooltip>

               {/* View Responses Button */}
               <Tooltip title="View Responses" placement="bottom" TransitionComponent={Fade}>
                  <button
                     onClick={() => onViewResponses(survey.id)}
                     className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-green-600 transition-all duration-200 rounded-lg bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  >
                     <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                     <span className="hidden sm:inline">{width < 768 ? "Views" : "Responses"}</span>
                  </button>
               </Tooltip>

               {/* Preview Survey Button */}
               <Tooltip title="Preview Survey" placement="bottom" TransitionComponent={Fade}>
                  <a
                     href={`/survey/public/${survey.slug}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-purple-600 transition-all duration-200 rounded-lg bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                  >
                     <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                     <span className="hidden sm:inline">{width < 768 ? "View" : "Preview"}</span>
                  </a>
               </Tooltip>

               {/* Delete Survey Button */}
               {survey.can_manage !== false && <Tooltip title="Delete Survey" placement="bottom" TransitionComponent={Fade}>
                  <button
                     onClick={() => onDelete(survey.id)}
                     className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 transition-all duration-200 rounded-lg bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                     <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                     <span className="hidden sm:inline">{width < 768 ? "Del" : "Delete"}</span>
                  </button>
               </Tooltip>}
            </div>
         )}
      </motion.div>
   );
};

export default SurveyActions;

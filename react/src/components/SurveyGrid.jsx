import React, { useEffect, useState } from 'react';
import axiosClient from '@api/axios';
import { motion, AnimatePresence } from "framer-motion";
import { DocumentIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import SurveyListItem from "@components/SurveyListItem";
import PaginationLinks from "@components/PaginationLinks";

export default function SurveyGrid({
   surveys,
   meta,
   searchTerm,
   onDeleteClick,
   onPageClick,
   refreshing
}) {
   const [analyticsData, setAnalyticsData] = useState([]);
   const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
   useEffect(() => {
      const controller = new AbortController();
      setIsLoadingAnalytics(true);
      axiosClient.get('/survey-analytics', { signal: controller.signal })
         .then(({ data }) => {
            if (!controller.signal.aborted) setAnalyticsData(data.analytics?.surveyStats || []);
         })
         .catch(() => {
            if (!controller.signal.aborted) setAnalyticsData([]);
         })
         .finally(() => {
            if (!controller.signal.aborted) setIsLoadingAnalytics(false);
         });
      return () => controller.abort();
   }, [meta]);

   if (surveys.length === 0) {
      return (
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
                  className="ace-button mt-4"
               >
                  <PlusCircleIcon className="w-5 h-5" />
                  Create Survey
               </Link>
            )}
         </motion.div>
      );
   }

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className={refreshing ? 'opacity-60' : ''}
      >
         <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
               {surveys.map((survey, index) => (
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
                        analyticsData={analyticsData}
                        isLoadingAnalytics={isLoadingAnalytics}
                        onDeleteClick={onDeleteClick}
                     />
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>

         {surveys.length > 0 && meta.links && meta.links.length > 3 && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.3 }}
               className="mt-8"
            >
               <PaginationLinks meta={meta} onPageClick={onPageClick} />
            </motion.div>
         )}
      </motion.div>
   );
}

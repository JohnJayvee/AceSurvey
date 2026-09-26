import React, { useState, useEffect } from "react";
import {
   ArrowTopRightOnSquareIcon,
   PencilIcon,
   TrashIcon,
   UsersIcon,
} from "@heroicons/react/24/outline";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import ShareSurveyPopup from "@components/ShareSurveyPopup";
import { Link, useNavigate } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartTooltip } from "recharts";

import { debounce } from 'lodash';
import logo from "@images/AceLogo.png";

export default function SurveyListItem({ survey, onDeleteClick, analyticsData, isLoadingAnalytics }) {
   const [openSharePopup, setOpenSharePopup] = useState(false);
   const [shareLink, setShareLink] = useState("");
   const [graphData, setGraphData] = useState([]);
   const [totalResponses, setTotalResponses] = useState(0);


   const navigate = useNavigate();



   const isSurveyExpired = (expireDate) => {
      const today = new Date().setHours(0, 0, 0, 0);
      const expiration = new Date(expireDate).setHours(0, 0, 0, 0);
      return expiration <= today;
   };

   // Debounced function for sharing
   const handleOpenShare = debounce(() => {
      setShareLink(`${window.location.origin}/survey/public/${survey.slug}`);
      setOpenSharePopup(true);
   }, 300);

   // Debounced function for viewing responses
   const handleViewResponses = debounce((surveyId) => {
      navigate(`/surveys/${surveyId}/responses`);
   }, 300);

   // Process analytics data when it becomes available
   useEffect(() => {
      if (!analyticsData || !Array.isArray(analyticsData)) return;

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
         name: new Date(0, i).toLocaleString("default", { month: "short" }),
         response: 0,
      }));

      let total = 0;

      // Filter analytics data for this specific survey
      const surveyAnalytics = analyticsData.filter(item => {
         // Match by both title and ID for better accuracy
         return item.title === survey.title || item.survey_id === survey.id;
      });

      surveyAnalytics.forEach(item => {
         try {
            const date = new Date(item.created_at);
            if (!isNaN(date.getTime())) {
               const monthIndex = date.getMonth();
               const responses = parseInt(item.answers) || 0;
               monthlyData[monthIndex].response += responses;
               total += responses;
            }
         } catch (error) {
            console.error("Error processing analytics item:", error, item);
         }
      });

      setGraphData(monthlyData);
      setTotalResponses(total);
   }, [analyticsData, survey.title, survey.id]);

   // Helper function to format dates
   const formatDate = (dateString) => {
      try {
         return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
         });
      } catch (error) {
         return 'Invalid Date';
      }
   };

   // Helper function to get status styling
   const getStatusStyling = () => {
      if (isSurveyExpired(survey.expire_date)) {
         return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      }
      return survey.status
         ? "bg-green-100 text-green-700 border border-green-200"
         : "bg-red-100 text-red-700 border border-red-200";
   };

   // Helper function to get status text
   const getStatusText = () => {
      if (isSurveyExpired(survey.expire_date)) {
         return "Expired";
      }
      return survey.status ? "Active" : "Closed";
   };

   return (
      <div className="relative flex flex-col p-6 transition-all duration-300 bg-white border border-gray-200 rounded-xl group hover:border-blue-500 hover:shadow-lg animate-fade-in-down">
         {/* Survey Image */}
         <div className="relative overflow-hidden rounded-lg aspect-video bg-gray-50">
            <img
               src={survey.image_url || logo}
               loading="lazy"
               alt={survey.title || 'Survey'}
               className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
               onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = logo;
               }}
            />
         </div>

         {/* Status Badge */}
         <div className={`absolute top-8 right-8 text-xs font-medium py-1.5 px-3 rounded-full ${getStatusStyling()}`}>
            {getStatusText()}
         </div>

         {/* Survey Title */}
         <h4 className="mt-6 text-lg font-bold text-gray-900 line-clamp-1" title={survey.title}>
            {survey.title}
         </h4>

         {/* Survey Stats */}
         <div className="flex items-center mt-2 space-x-2">
            <div className="flex items-center text-sm text-gray-500">
               <UsersIcon className="w-4 h-4 mr-1" />
               {isLoadingAnalytics ? (
                  <span className="animate-pulse">Loading...</span>
               ) : (
                  `${totalResponses} Response${totalResponses !== 1 ? 's' : ''}`
               )}
            </div>
            <span className="text-gray-300">•</span>
            <div className="text-sm text-gray-500">
               Created {formatDate(survey.created_at)}
            </div>
         </div>

         {/* Analytics Graph */}
         <div className="w-full h-48 p-2 mt-4 rounded-lg bg-gray-50">
            {isLoadingAnalytics ? (
               <div className="flex items-center justify-center w-full h-full">
                  <div className="text-sm text-gray-500 animate-pulse">Loading analytics...</div>
               </div>
            ) : graphData.length > 0 && graphData.some(item => item.response > 0) ? (
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                     <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                     />
                     <YAxis
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                     />
                     <RechartTooltip
                        contentStyle={{
                           backgroundColor: 'rgba(255, 255, 255, 0.95)',
                           border: 'none',
                           borderRadius: '8px',
                           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                           padding: '8px 12px'
                        }}
                        labelFormatter={(label) => `Month: ${label}`}
                        formatter={(value) => [`${value} responses`, 'Responses']}
                     />
                     <Line
                        type="monotone"
                        dataKey="response"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        dot={{ fill: '#4F46E5', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        connectNulls={false}
                     />
                  </LineChart>
               </ResponsiveContainer>
            ) : (
               <div className="flex items-center justify-center w-full h-full">
                  <div className="text-sm text-gray-400">No response data available</div>
               </div>
            )}
         </div>

         {/* Action Buttons */}
         <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <Link
               to={`/surveys/${survey.id}`}
               className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
               <PencilIcon className="w-4 h-4 mr-2" />
               Edit Survey
            </Link>

            <div className="flex items-center gap-3">
               <Tooltip title="Share Survey" placement="top" arrow TransitionComponent={Fade}>
                  <button
                     onClick={handleOpenShare}
                     className="p-2 transition-colors duration-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                     aria-label="Share Survey"
                  >
                     <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                  </button>
               </Tooltip>

               <Tooltip title="View Responses" placement="top" arrow TransitionComponent={Fade}>
                  <button
                     onClick={() => handleViewResponses(survey.id)}
                     className="p-2 transition-colors duration-200 rounded-lg hover:bg-green-50 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                     aria-label="View Responses"
                  >
                     <UsersIcon className="w-5 h-5" />
                  </button>
               </Tooltip>

               <Tooltip title="Delete Survey" placement="top" arrow TransitionComponent={Fade}>
                  <button
                     onClick={() => onDeleteClick(survey.id)}
                     className="p-2 transition-colors duration-200 rounded-lg hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                     aria-label="Delete Survey"
                  >
                     <TrashIcon className="w-5 h-5" />
                  </button>
               </Tooltip>
            </div>
         </div>

         {/* Share Popup */}
         <ShareSurveyPopup
            openSharePopup={openSharePopup}
            setOpenSharePopup={setOpenSharePopup}
            shareLink={shareLink}
         />
      </div>
   );
}

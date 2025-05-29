import React, { useState, useEffect, useRef } from "react";
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
import axios from "@api/axios";
import { debounce } from 'lodash'; // Add this import
import logo from "@images/AceLogo.png"; // Update path according to your logo location

// Put these at the top level of your file (outside any component)
const cache = {};
let isAnalyticsFetching = false;
let analyticsPromise = null;

export default function SurveyListItem({ survey, onDeleteClick }) {
   const [openSharePopup, setOpenSharePopup] = useState(false);
   const [shareLink, setShareLink] = useState("");
   const [graphData, setGraphData] = useState([]);
   const [totalResponses, setTotalResponses] = useState(0);
   const [analyticsData, setAnalyticsData] = useState(null);
   const navigate = useNavigate();
   const hasFetched = useRef(false);

   const isSurveyExpired = (expireDate) => {
      const today = new Date().setHours(0, 0, 0, 0);
      const expiration = new Date(expireDate).setHours(0, 0, 0, 0);
      return expiration <= today;
   };

   // Improved API call logic to prevent duplicates
   useEffect(() => {
      // Check if analytics are already cached
      if (cache['survey-analytics']) {
         setAnalyticsData(cache['survey-analytics']);
         return;
      }

      // If a request is already in progress, wait for that instead of making a new one
      if (isAnalyticsFetching) {
         analyticsPromise.then(data => {
            setAnalyticsData(data);
         }).catch(error => {
            console.error("Error from existing analytics request:", error);
         });
         return;
      }

      // Start a new request and track it globally
      isAnalyticsFetching = true;

      // Create and store the promise for other components to use
      analyticsPromise = axios.get("/survey-analytics")
         .then(res => {
            const data = res.data.analytics.surveyStats;
            // Store in cache for future components
            cache['survey-analytics'] = data;
            isAnalyticsFetching = false;
            return data;
         })
         .catch(error => {
            console.error("Error fetching analytics:", error);
            isAnalyticsFetching = false;
            throw error;
         });

      // Use the promise for this component
      analyticsPromise.then(data => {
         setAnalyticsData(data);
      });
   }, []);

   // Debounced function for sharing (following your friend's pattern)
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
      if (!analyticsData) return;

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
         name: new Date(0, i).toLocaleString("default", { month: "short" }),
         response: 0,
      }));

      let total = 0;

      analyticsData
         .filter(item => item.title === survey.title)
         .forEach(item => {
            const date = new Date(item.created_at);
            const monthIndex = date.getMonth();
            monthlyData[monthIndex].response += item.answers;
            total += item.answers;
         });

      setGraphData(monthlyData);
      setTotalResponses(total);
   }, [analyticsData, survey.title]);

   return (
      <div className="relative flex flex-col p-6 transition-all duration-300 bg-white border border-gray-200 rounded-xl group hover:border-blue-500 hover:shadow-lg animate-fade-in-down">
         <div className="relative overflow-hidden rounded-lg aspect-video bg-gray-50">
            <img
               src={survey.image_url || logo}
               loading="lazy"
               alt={survey.title}
               className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
               onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = logo;
               }}
            />
         </div>

         <div className={`absolute top-8 right-8 text-xs font-medium py-1.5 px-3 rounded-full
                ${isSurveyExpired(survey.expire_date)
               ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
               : survey.status
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
            }`}>
            {isSurveyExpired(survey.expire_date)
               ? "Expired"
               : survey.status
                  ? "Active"
                  : "Closed"}
         </div>

         <h4 className="mt-6 text-lg font-bold text-gray-900 line-clamp-1">{survey.title}</h4>

         <div className="flex items-center mt-2 space-x-2">
            <div className="flex items-center text-sm text-gray-500">
               <UsersIcon className="w-4 h-4 mr-1" />
               {totalResponses} Responses
            </div>
            <span className="text-gray-300">•</span>
            <div className="text-sm text-gray-500">
               Created {new Date(survey.created_at).toLocaleDateString()}
            </div>
         </div>

         <div className="w-full h-48 p-2 mt-4 rounded-lg bg-gray-50">
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
                  />
                  <RechartTooltip
                     contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        padding: '8px 12px'
                     }}
                  />
                  <Line
                     type="monotone"
                     dataKey="response"
                     stroke="#4F46E5"
                     strokeWidth={2}
                     dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                     activeDot={{ r: 6, strokeWidth: 0 }}
                  />
               </LineChart>
            </ResponsiveContainer>
         </div>

         <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <Link
               to={`/surveys/${survey.id}`}
               className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
               <PencilIcon className="w-4 h-4 mr-2" />
               Edit Survey
            </Link>
            <div className="flex items-center gap-3">
               <Tooltip title="Share Survey" placement="top" arrow TransitionComponent={Fade}>
                  <button
                     onClick={handleOpenShare}
                     className="p-2 transition-colors duration-200 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                  >
                     <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                  </button>
               </Tooltip>
               <Tooltip title="View Responses" placement="top" arrow TransitionComponent={Fade}>
                  <button
                     onClick={() => handleViewResponses(survey.id)}
                     className="p-2 transition-colors duration-200 rounded-lg hover:bg-green-50 hover:text-green-600"
                  >
                     <UsersIcon className="w-5 h-5" />
                  </button>
               </Tooltip>
               <Tooltip title="Delete Survey" placement="top" arrow TransitionComponent={Fade}>
                  <button
                     onClick={() => onDeleteClick(survey.id)}
                     className="p-2 transition-colors duration-200 rounded-lg hover:bg-red-50 hover:text-red-600"
                  >
                     <TrashIcon className="w-5 h-5" />
                  </button>
               </Tooltip>
            </div>
         </div>

         <ShareSurveyPopup
            openSharePopup={openSharePopup}
            setOpenSharePopup={setOpenSharePopup}
            shareLink={shareLink}
         />
      </div>
   );
}

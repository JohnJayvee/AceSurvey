import { useEffect, useState, useRef } from "react";
import axiosClient from "../api/axios.js";
import { processRatingsData, generateMonthlyData } from "../utils/dashboardUtils";

const cache = {};

export const useDashboardData = () => {
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [data, setData] = useState({
      totalSurveys: 0,
      totalAnswers: 0,
      latestSurvey: null,
      latestAnswers: [],
      ratingsData: [],
      chartData: [],
      topSurveys: [],
      bottomSurveys: []
   });
   const hasFetched = useRef(false);

   useEffect(() => {
      // Check cache first
      if (cache['dashboard']) {
         console.log("Using cached dashboard data");
         setData(cache['dashboard']);
         setLoading(false);
         return;
      }

      if (hasFetched.current) return;
      hasFetched.current = true;

      setLoading(true);
      setError(null);

      Promise.all([
         axiosClient.get('/dashboard'),
         axiosClient.get('/survey-analytics'),
         axiosClient.get('/total-ratings'),
         axiosClient.get('/topSurvey'),
         axiosClient.get('/botSurvey')
      ])
         .then(([dashboardRes, analyticsRes, ratingsRes, topRes, bottomRes]) => {
            const processedData = {
               totalSurveys: dashboardRes.data.totalSurveys || 0,
               totalAnswers: dashboardRes.data.totalAnswers || 0,
               latestSurvey: dashboardRes.data.latestSurvey || null,
               latestAnswers: dashboardRes.data.latestAnswers || [],
               ratingsData: processRatingsData(ratingsRes.data.ratings),
               chartData: generateMonthlyData(analyticsRes.data.analytics.surveyStats),
               topSurveys: topRes.data || [],
               bottomSurveys: bottomRes.data || []
            };

            setData(processedData);
            cache['dashboard'] = processedData;
            setLoading(false);
         })
         .catch(error => {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
            setLoading(false);
         });
   }, []);

   return { data, loading, error };
};

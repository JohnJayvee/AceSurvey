import { useEffect, useState } from "react";
import axiosClient from "../api/axios.js";
import { processRatingsData, generateMonthlyData } from "../utils/dashboardUtils";



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


   useEffect(() => {
      const controller = new AbortController();
      const options = { signal: controller.signal };
      setLoading(true);
      setError(null);

      Promise.all([
         axiosClient.get('/dashboard', options),
         axiosClient.get('/survey-analytics', options),
         axiosClient.get('/total-ratings', options),
         axiosClient.get('/topSurvey', options),
         axiosClient.get('/botSurvey', options)
      ])
         .then(([dashboardRes, analyticsRes, ratingsRes, topRes, bottomRes]) => {
            if (controller.signal.aborted) return;
            const processedData = {
               totalSurveys: dashboardRes.data.totalSurveys || 0,
               totalAnswers: dashboardRes.data.totalAnswers || 0,
               latestSurvey: dashboardRes.data.latestSurvey || null,
               latestAnswers: dashboardRes.data.latestAnswers || [],
               ratingsData: processRatingsData(ratingsRes.data.ratings),
               chartData: generateMonthlyData(analyticsRes.data.analytics?.surveyStats || []),
               topSurveys: topRes.data || [],
               bottomSurveys: bottomRes.data || []
            };

            setData(processedData);

            setLoading(false);
         })
         .catch(() => {
            if (controller.signal.aborted) return;
            setError('Failed to load dashboard data');
            setLoading(false);
         });
      return () => controller.abort();
   }, []);

   return { data, loading, error };
};

import { useEffect, useState, useRef, useCallback } from "react";
import axiosClient from "@api/axios.js";

// Simple cache without global state pollution
const cache = new Map();
const requestsInProgress = new Map();

export const useSurveyData = (surveyId) => {
   const [survey, setSurvey] = useState({ title: "", status: true });
   const [responses, setResponses] = useState({ data: [] });
   const [responseCount, setResponseCount] = useState(0);
   const [ratingsData, setRatingsData] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const abortControllerRef = useRef(null);
   const isMountedRef = useRef(true);

   const resetState = useCallback(() => {
      setSurvey({ title: "", status: true });
      setResponses({ data: [] });
      setResponseCount(0);
      setRatingsData([]);
      setError(null);
   }, []);

   useEffect(() => {
      isMountedRef.current = true;
      return () => {
         isMountedRef.current = false;
      };
   }, []);

   useEffect(() => {
      if (!surveyId) {
         setLoading(false);
         return;
      }

      // Reset state when surveyId changes
      resetState();

      // Check cache first
      const cacheKey = `survey_${surveyId}`;
      if (cache.has(cacheKey)) {
         const cachedData = cache.get(cacheKey);
         if (isMountedRef.current) {
            setSurvey(cachedData.survey);
            setResponses(cachedData.responses);
            setResponseCount(cachedData.responseCount);
            setRatingsData(cachedData.ratingsData);
            setLoading(false);
         }
         return;
      }

      // Check if request is already in progress
      if (requestsInProgress.has(surveyId)) {
         const existingRequest = requestsInProgress.get(surveyId);
         existingRequest
            .then((data) => {
               if (isMountedRef.current) {
                  setSurvey(data.survey);
                  setResponses(data.responses);
                  setResponseCount(data.responseCount);
                  setRatingsData(data.ratingsData);
                  setLoading(false);
               }
            })
            .catch((err) => {
               if (isMountedRef.current && err.name !== 'AbortError') {
                  setError(err.message || "Failed to load data");
                  setLoading(false);
               }
            });
         return;
      }

      fetchSurveyData(surveyId);

      return () => {
         if (abortControllerRef.current) {
            abortControllerRef.current.abort();
         }
      };
   }, [surveyId, resetState]);

   const fetchSurveyData = async (id) => {
      try {
         setLoading(true);
         setError(null);

         // Cancel any existing request
         if (abortControllerRef.current) {
            abortControllerRef.current.abort();
         }

         abortControllerRef.current = new AbortController();
         const { signal } = abortControllerRef.current;

         // Create the request promise
         const requestPromise = Promise.all([
            axiosClient.get(`/survey/${id}`, {
               signal,
               timeout: 10000 // 10 second timeout
            }),
            axiosClient.get(`/survey/${id}/responses`, {
               signal,
               timeout: 10000
            }),
            axiosClient.get(`/survey/${id}/responses/count`, {
               signal,
               timeout: 10000
            }),
            axiosClient.get(`/total-department-ratings/${id}`, {
               signal,
               timeout: 10000
            })
         ]).then(([surveyRes, responsesRes, countRes, ratingsRes]) => {
            const surveyData = surveyRes.data.data || { title: "", status: true };
            const responsesData = responsesRes.data || { data: [] };
            const countData = countRes.data.count || 0;
            const processedRatingsData = processRatingsData(ratingsRes.data.ratings);

            return {
               survey: surveyData,
               responses: responsesData,
               responseCount: countData,
               ratingsData: processedRatingsData
            };
         });

         // Store the promise for deduplication
         requestsInProgress.set(id, requestPromise);

         const data = await requestPromise;

         // Only update state if component is still mounted
         if (!isMountedRef.current) return;

         // Cache the results
         cache.set(`survey_${id}`, data);

         setSurvey(data.survey);
         setResponses(data.responses);
         setResponseCount(data.responseCount);
         setRatingsData(data.ratingsData);

      } catch (err) {
         if (!isMountedRef.current) return;

         if (err.name !== 'AbortError' && err.code !== 'ECONNABORTED') {
            console.error('Survey data fetch error:', err);
            setError(err.response?.data?.message || err.message || "Failed to load survey data");
         }
      } finally {
         if (isMountedRef.current) {
            setLoading(false);
         }
         requestsInProgress.delete(id);
      }
   };

   return { survey, responses, responseCount, ratingsData, loading, error };
};

const processRatingsData = (ratings) => {
   const defaultData = [
      { name: 'Very Satisfied', value: 0, rating: '5' },
      { name: 'Satisfied', value: 0, rating: '4' },
      { name: 'Undecided', value: 0, rating: '3' },
      { name: 'Unsatisfied', value: 0, rating: '2' },
      { name: 'Very Unsatisfied', value: 0, rating: '1' }
   ];

   if (ratings && typeof ratings === 'object' && Object.keys(ratings).length > 0) {
      Object.entries(ratings).forEach(([rating, data]) => {
         const index = defaultData.findIndex(item => item.rating === rating);
         if (index !== -1 && data && typeof data.count === 'number') {
            defaultData[index].value = data.count;
         }
      });
   }

   return defaultData;
};

import { useState, useEffect, useRef, useCallback } from "react";
import axiosClient from "@api/axios.js";

// Simple cache to prevent repeated requests
const cache = new Map();
const requestsInProgress = new Map();

export const useSurveySelector = () => {
   const [surveys, setSurveys] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [searchTerm, setSearchTerm] = useState("");

   const abortControllerRef = useRef(null);
   const isMountedRef = useRef(true);

   useEffect(() => {
      isMountedRef.current = true;
      return () => { isMountedRef.current = false; };
   }, []);

   const fetchSurveys = useCallback(async () => {
      const cacheKey = "all_surveys";

      if (cache.has(cacheKey)) {
         setSurveys(cache.get(cacheKey));
         setLoading(false);
         return;
      }

      if (requestsInProgress.has(cacheKey)) {
         const existingRequest = requestsInProgress.get(cacheKey);
         existingRequest.then(data => {
            if (isMountedRef.current) setSurveys(data);
         }).catch(err => {
            if (isMountedRef.current) setError(err.message || "Failed to load surveys");
         });
         return;
      }

      try {
         setLoading(true);
         setError(null);

         if (abortControllerRef.current) abortControllerRef.current.abort();
         abortControllerRef.current = new AbortController();
         const { signal } = abortControllerRef.current;

         const requestPromise = axiosClient.get("/survey/links", { signal }).then(res => res.data);
         requestsInProgress.set(cacheKey, requestPromise);

         const data = await requestPromise;

         if (!isMountedRef.current) return;

         cache.set(cacheKey, data);
         setSurveys(data);
      } catch (err) {
         if (!isMountedRef.current) return;
         if (err.name !== "AbortError") {
            setError(err.response?.data?.message || err.message || "Failed to load surveys");
         }
      } finally {
         if (isMountedRef.current) setLoading(false);
         requestsInProgress.delete(cacheKey);
      }
   }, []);

   const filteredSurveys = surveys.filter(s =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase())
   );

   useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

   return {
      surveys,
      filteredSurveys,
      loading,
      error,
      searchTerm,
      setSearchTerm,
      refetch: fetchSurveys
   };
};

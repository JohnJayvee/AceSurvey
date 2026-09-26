import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axiosClient from "@api/axios.js";

export const useSurveySelector = () => {
   const [surveys, setSurveys] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [searchTerm, setSearchTerm] = useState("");
   const active = useRef(null);

   const fetchSurveys = useCallback(async () => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      setLoading(true);
      setError(null);
      try {
         const { data } = await axiosClient.get("/survey/links", { signal: controller.signal });
         if (!controller.signal.aborted) setSurveys(Array.isArray(data) ? data : []);
      } catch (error) {
         if (!controller.signal.aborted) setError(error.response?.data?.message || "Failed to load surveys. Please try again.");
      } finally {
         if (!controller.signal.aborted) setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchSurveys();
      return () => active.current?.abort();
   }, [fetchSurveys]);

   const filteredSurveys = useMemo(() => surveys.filter(survey =>
      (survey.title || "").toLowerCase().includes(searchTerm.toLowerCase())
   ), [surveys, searchTerm]);

   return { surveys, filteredSurveys, loading, error, searchTerm, setSearchTerm, refetch: fetchSurveys };
};

import { useState, useRef, useCallback, useEffect } from 'react';
import axiosClient from "@api/axios";
import { useStateContext } from "@context/ContextProvider";

export function useSurveys() {
   const { showToast } = useStateContext();
   const toastRef = useRef(showToast);
   toastRef.current = showToast;
   const [state, setState] = useState({
      surveys: [], meta: {}, loading: true, error: null, searchTerm: "", refreshing: false
   });
   const activeRequest = useRef(null);
   const currentUrl = useRef("/survey");
   const searchValue = useRef('');
   const searchTimer = useRef(null);
   const updateState = useCallback(updates => setState(prev => ({ ...prev, ...updates })), []);

   const getSurveys = useCallback(async (url = currentUrl.current, forceRefresh = false) => {
      activeRequest.current?.abort();
      const controller = new AbortController();
      activeRequest.current = controller;
      currentUrl.current = url;
      updateState({ loading: !forceRefresh, refreshing: forceRefresh, error: null });
      try {
         const page = new URL(url, window.location.origin).searchParams.get('page') || 1;
         const { data } = await axiosClient.get('/survey', { signal: controller.signal, params: { page, search: searchValue.current.trim() || undefined } });
         if (!controller.signal.aborted) updateState({ surveys: data.data || [], meta: data.meta || {} });
      } catch (error) {
         if (!controller.signal.aborted) {
            updateState({ error: "Failed to load surveys. Please try again." });
            toastRef.current("Failed to load surveys. Please try again.", "error");
         }
      } finally {
         if (!controller.signal.aborted) {
            activeRequest.current = null;
            updateState({ loading: false, refreshing: false });
         }
      }
   }, [updateState]);

   const handleSearch = useCallback(value => {
      clearTimeout(searchTimer.current);
      activeRequest.current?.abort();
      searchValue.current = value;
      currentUrl.current = '/survey';
      updateState({ searchTerm: value, surveys: [], meta: {}, error: null, loading: true, refreshing: false });
      searchTimer.current = setTimeout(() => {
         searchTimer.current = null;
         getSurveys('/survey');
      }, 300);
   }, [getSurveys, updateState]);

   const deleteSurvey = useCallback(async surveyId => {
      try {
         await axiosClient.delete('/survey/' + surveyId);
         toastRef.current("The survey was deleted successfully");
         await getSurveys("/survey", true);
      } catch (error) {
         toastRef.current("Failed to delete survey. Please try again.", "error");
         throw error;
      }
   }, [getSurveys]);
   const refresh = useCallback(() => getSurveys(currentUrl.current, true), [getSurveys]);

   useEffect(() => {
      getSurveys();
      const interval = setInterval(() => {
         if (!document.hidden && !activeRequest.current && !searchTimer.current) getSurveys(currentUrl.current, true);
      }, 30000);
      const onUpdate = () => getSurveys(currentUrl.current, true);
      window.addEventListener('surveyUpdated', onUpdate);
      return () => {
         clearInterval(interval);
         clearTimeout(searchTimer.current);
         activeRequest.current?.abort();
         window.removeEventListener('surveyUpdated', onUpdate);
      };
   }, [getSurveys]);

   return { ...state, filteredSurveys: state.surveys, getSurveys, handleSearch, deleteSurvey, refresh };
}

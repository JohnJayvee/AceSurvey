import { useState, useRef, useCallback, useEffect } from 'react';
import axiosClient from "@api/axios";
import { useStateContext } from "@context/ContextProvider";

export function useSurveys() {
   const { showToast } = useStateContext();
   const [state, setState] = useState({
      surveys: [],
      filteredSurveys: [],
      meta: {},
      loading: false,
      error: null,
      searchTerm: "",
      refreshing: false
   });

   const [requestInProgress, setRequestInProgress] = useState({});
   const [pageCache, setPageCache] = useState({});
   const initialLoadDone = useRef(false);
   const pollInterval = useRef(null);

   const updateState = useCallback((updates) => {
      setState(prev => ({ ...prev, ...updates }));
   }, []);

   const getSurveys = useCallback((url = "/survey", forceRefresh = false) => {
      if (state.loading && !state.refreshing) return;
      if (requestInProgress[url]) return;

      updateState({
         loading: !state.refreshing,
         refreshing: state.refreshing,
         error: null
      });

      if (!forceRefresh && pageCache[url]) {
         updateState({
            surveys: pageCache[url].data,
            filteredSurveys: pageCache[url].data,
            meta: pageCache[url].meta,
            loading: false,
            refreshing: false
         });
         return;
      }

      setRequestInProgress(prev => ({ ...prev, [url]: true }));

      axiosClient.get(url)
         .then((response) => {
            const { data } = response;

            setPageCache(prev => ({
               ...prev,
               [url]: { data: data.data, meta: data.meta }
            }));

            updateState({
               surveys: data.data,
               filteredSurveys: data.data,
               meta: data.meta
            });
         })
         .catch((err) => {
            console.error("Error fetching surveys:", err);
            updateState({
               error: "Failed to load surveys. Please try again."
            });
            showToast("Failed to load surveys. Please try again.", "error");
         })
         .finally(() => {
            updateState({ loading: false, refreshing: false });
            setRequestInProgress(prev => {
               const updated = { ...prev };
               delete updated[url];
               return updated;
            });
         });
   }, [state.loading, state.refreshing, requestInProgress, pageCache, showToast, updateState]);

   const handleSearch = useCallback((value) => {
      updateState({ searchTerm: value });

      const searchValue = value.toLowerCase();
      const filtered = state.surveys.filter((survey) =>
         survey.title.toLowerCase().includes(searchValue) ||
         survey.description.toLowerCase().includes(searchValue)
      );

      updateState({ filteredSurveys: filtered });
   }, [state.surveys, updateState]);

   const deleteSurvey = useCallback((surveyId) => {
      const updatedSurveys = state.surveys.filter(survey => survey.id !== surveyId);
      updateState({
         surveys: updatedSurveys,
         filteredSurveys: updatedSurveys.filter(survey =>
            survey.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            survey.description.toLowerCase().includes(state.searchTerm.toLowerCase())
         )
      });

      return axiosClient.delete(`/survey/${surveyId}`)
         .then(() => {
            setPageCache({});
            showToast("The survey was deleted successfully");
         })
         .catch((err) => {
            console.error("Delete error:", err);
            showToast("Failed to delete survey. Please try again.", "error");
            getSurveys("/survey", true);
            throw err;
         });
   }, [state.surveys, state.searchTerm, showToast, getSurveys, updateState]);

   const refresh = useCallback(() => {
      updateState({ refreshing: true });
      setPageCache({});
      getSurveys("/survey", true);
   }, [getSurveys, updateState]);

   // Setup initial load and polling
   useEffect(() => {
      if (!initialLoadDone.current) {
         getSurveys();
         initialLoadDone.current = true;
      }

      pollInterval.current = setInterval(() => {
         if (!document.hidden) {
            getSurveys("/survey", true);
         }
      }, 30000);

      return () => clearInterval(pollInterval.current);
   }, [getSurveys]);

   // Listen for survey updates
   useEffect(() => {
      const handleSurveyUpdate = () => {
         setPageCache({});
         getSurveys("/survey", true);
      };

      window.addEventListener('surveyUpdated', handleSurveyUpdate);
      return () => window.removeEventListener('surveyUpdated', handleSurveyUpdate);
   }, [getSurveys]);

   return {
      ...state,
      getSurveys,
      handleSearch,
      deleteSurvey,
      refresh
   };
}

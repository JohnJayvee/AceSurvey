import { useCallback } from 'react';

// In-memory cache for survey data
const cache = {};
const isFetching = {};
let cacheAccount;
const syncAccount = () => {
   const token = localStorage.getItem('TOKEN') || sessionStorage.getItem('TOKEN');
   if (token !== cacheAccount) {
      Object.keys(cache).forEach(key => delete cache[key]);
      Object.keys(isFetching).forEach(key => delete isFetching[key]);
      cacheAccount = token;
   }
};

const cacheManager = {
   clear: (pattern) => {
      if (pattern === 'surveys') {
         // Clear all survey-related cache entries
         Object.keys(cache).forEach(key => {
            if (key.includes('survey') || key.includes('/survey')) {
               delete cache[key];
            }
         });

         // Clear any global cache references
         if (window.cache && window.cache['survey-analytics']) {
            delete window.cache['survey-analytics'];
         }

         if (window.surveysCache) window.surveysCache = {};
         if (window.pageCache) window.pageCache = {};

         // Clear localStorage survey entries
         Object.keys(localStorage).forEach(key => {
            if (key.includes('survey') || key.includes('surveys')) {
               localStorage.removeItem(key);
            }
         });

         // Clear React Query cache if available
         if (window.queryClient) {
            window.queryClient.invalidateQueries(['surveys']);
         }

         console.log('All survey caches cleared');
      } else if (pattern) {
         delete cache[pattern];
      }
   },

   clearAll: () => {
      Object.keys(cache).forEach(key => delete cache[key]);
      if (window.surveysCache) window.surveysCache = {};
      if (window.pageCache) window.pageCache = {};
      if (window.cache) window.cache = {};
      console.log('All caches cleared');
   },

   get: (key) => {
      syncAccount();
      return cache[key];
   },

   set: (key, data) => {
      syncAccount();
      cache[key] = data;
   },

   has: (key) => {
      syncAccount();
      return key in cache;
   },

   delete: (key) => {
      delete cache[key];
   }
};

export const useSurveyCache = () => {
   const clearSurveyCache = useCallback(() => {
      cacheManager.clear('surveys');
   }, []);

   const getCachedSurvey = useCallback((id) => {
      if (!id) return null;
      return cacheManager.get(`survey_${id}`);
   }, []);

   const setCachedSurvey = useCallback((id, data) => {
      if (!id) return;
      if (data === null) {
         cacheManager.delete(`survey_${id}`);
      } else {
         cacheManager.set(`survey_${id}`, data);
      }
   }, []);

   const isSurveyFetching = useCallback((id) => {
      if (!id) return false;
      return Boolean(isFetching[id]);
   }, []);

   const setFetching = useCallback((id, status) => {
      if (!id) return;
      if (status) {
         isFetching[id] = true;
      } else {
         delete isFetching[id];
      }
   }, []);

   const clearAllCache = useCallback(() => {
      cacheManager.clearAll();
   }, []);

   const getCachedData = useCallback((key) => {
      return cacheManager.get(key);
   }, []);

   const setCachedData = useCallback((key, data) => {
      cacheManager.set(key, data);
   }, []);

   const removeCachedData = useCallback((key) => {
      cacheManager.delete(key);
   }, []);

   const hasCachedData = useCallback((key) => {
      return cacheManager.has(key);
   }, []);

   return {
      clearSurveyCache,
      getCachedSurvey,
      setCachedSurvey,
      isSurveyFetching,
      setFetching,
      cacheManager,
      clearAllCache,
      getCachedData,
      setCachedData,
      removeCachedData,
      hasCachedData
   };
};

export default useSurveyCache;

import { useEffect, useState } from 'react';
import axiosClient from '@api/axios.js';

export const useSurveyData = (surveyId) => {
   const [state, setState] = useState({ survey: { title: '', status: true }, responses: { data: [] }, responseCount: 0, ratingsData: [], loading: true, error: null });
   useEffect(() => {
      const controller = new AbortController();
      const { signal } = controller;
      setState({ survey: { title: '', status: true }, responses: { data: [] }, responseCount: 0, ratingsData: [], loading: Boolean(surveyId), error: null });
      if (!surveyId) return;
      const options = { signal };
      Promise.all([
         axiosClient.get('/survey/' + surveyId, options),
         axiosClient.get('/survey/' + surveyId + '/responses', options),
         axiosClient.get('/survey/' + surveyId + '/responses/count', options),
         axiosClient.get('/total-department-ratings/' + surveyId, options),
      ]).then(([survey, responses, count, ratings]) => {
         if (signal.aborted) return;
         setState({ survey: survey.data.data, responses: responses.data, responseCount: count.data.count || 0, ratingsData: processRatingsData(ratings.data.ratings), loading: false, error: null });
      }).catch(error => {
         if (!signal.aborted) setState(prev => ({ ...prev, loading: false, error: error.response?.data?.message || 'Failed to load survey data. Please try again.' }));
      });
      return () => controller.abort();
   }, [surveyId]);
   return state;
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

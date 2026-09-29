import { useState, useRef, useCallback, useEffect } from 'react';
import axiosClient from '@api/axios.js';
import { useSurveyCache } from './useSurveyCache';
import useUnsavedChanges from './useUnsavedChanges';
import { validateImage } from '../utils/surveyValidation';

export const useSurveyForm = (id, showToast, navigate) => {
   const { getCachedSurvey, setCachedSurvey, cacheManager } = useSurveyCache();
   const activeRequest = useRef(null);
   useEffect(() => () => activeRequest.current?.abort(), [id]);

   const getTomorrowDate = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      return tomorrow.toISOString().split("T")[0];
   };

   const [survey, setSurvey] = useState({
      title: "",
      slug: "",
      status: true,
      description: "",
      image: null,
      image_url: null,
      expire_date: getTomorrowDate(),
      questions: [],
   });

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [baseline, setBaseline] = useState(() => JSON.stringify(survey));
   const allowNavigation = useUnsavedChanges(survey.can_manage !== false && JSON.stringify(survey) !== baseline);
   const imageReader = useRef(null);
   const [readingImage, setReadingImage] = useState(false);
   useEffect(() => () => imageReader.current?.abort(), [id]);

   const clearError = () => {
      setError("");
   };

   const handleImageChange = (ev) => {
      const file = ev.target.files[0];
      ev.target.value = '';
      if (!file) return;
      imageReader.current?.abort();
      const validationError = validateImage(file);
      if (validationError) { setReadingImage(false); setError(validationError); return; }
      setError('');
      setReadingImage(true);
      const reader = new FileReader();
      imageReader.current = reader;
      reader.onload = () => {
         setSurvey(prev => ({
            ...prev,
            image: file,
            image_url: reader.result,
         }));
         setReadingImage(false);
      };
      reader.onerror = () => { setReadingImage(false); setError('Could not read this image. Please select it again.'); };
      reader.onabort = () => setReadingImage(false);
      try { reader.readAsDataURL(file); }
      catch { reader.onerror(); }
   };

   const handleSubmit = async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (loading || readingImage) return;

      setLoading(true);
      setError("");

      try {
         const payload = { ...survey };
         if (payload.image) {
            payload.image = payload.image_url;
         }
         delete payload.image_url;

         const response = id
            ? await axiosClient.put(`/survey/${id}`, payload)
            : await axiosClient.post("/survey", payload);

         cacheManager.clear('surveys');

         if (id && getCachedSurvey(id)) {
            setCachedSurvey(id, null);
         }

         window.dispatchEvent(new CustomEvent('surveyUpdated', {
            detail: {
               surveyId: id || response.data.data.id,
               action: id ? 'update' : 'create',
               surveyData: response.data.data
            }
         }));

         allowNavigation();
         navigate("/surveys");
         showToast(id ? "The survey was updated" : "The survey was created");
      } catch (err) {
         if (err?.response?.data?.errors) {
            const allErrors = Object.values(err.response.data.errors).flat();
            setError(allErrors.join('\n'));
         } else if (err?.response?.data?.message) {
            setError(err.response.data.message);
         } else {
            setError("An error occurred while saving the survey");
         }
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const fetchSurvey = useCallback(async () => {
      if (!id) return;

      activeRequest.current?.abort();
      const controller = new AbortController();
      activeRequest.current = controller;
      setLoading(true);
      setError('');
      try {
         const { data } = await axiosClient.get('/survey/' + id, { signal: controller.signal });
         if (!controller.signal.aborted) {
            setSurvey(data.data);
            setBaseline(JSON.stringify(data.data));
         }
      } catch (error) {
         if (!controller.signal.aborted) setError(error.response?.data?.message || 'Failed to load the survey');
      } finally {
         if (!controller.signal.aborted) setLoading(false);
      }
   }, [id]);

   const updateSurveyField = useCallback((field, value) => {
      setSurvey(prev => ({
         ...prev,
         [field]: value
      }));
   }, []);

   return {
      survey,
      setSurvey,
      updateSurveyField,
      loading,
      error,
      clearError,
      handleSubmit,
      handleImageChange,
      fetchSurvey,
      readingImage,
      allowNavigation
   };
};

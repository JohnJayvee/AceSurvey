import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "@api/axios";
import PublicQuestionView from "@components/PublicQuestionView";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import AnimatedBackground from "@components/AnimatedBackground";
import { motion } from "framer-motion";

import ErrorMessage from "@components/ErrorMessage";
import SimpleProgressBar from "@components/SimpleProgressBar";
import logo from '@images/AceLogo.png';

// Constants
const INITIAL_SURVEY_STATE = {
   id: null,
   questions: [],
   title: '',
   description: '',
   status: false,
   expire_date: new Date().toISOString(),
   image_url: null
};

const MOTION_VARIANTS = {
   fadeIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
   },
   scaleIn: {
      initial: { scale: 0 },
      animate: { scale: 1 }
   }
};

// Components
const LoadingSkeleton = () => (
   <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-11/12 py-12 mx-auto md:w-3/4 xl:w-1/2">
         {/* Header skeleton */}
         <motion.div
            {...MOTION_VARIANTS.fadeIn}
            className="p-6 mb-6 bg-white border-0 shadow-lg rounded-2xl backdrop-blur-xl"
         >
            <div className="flex flex-col gap-6 md:flex-row">
               <div className="w-full md:w-1/2">
                  <Skeleton height={400} className="rounded-xl" />
               </div>
               <div className="w-full space-y-4 md:w-1/2">
                  <Skeleton height={48} className="w-3/4" />
                  <div className="flex gap-2">
                     <Skeleton height={28} width={80} className="rounded-full" />
                     <Skeleton height={28} width={120} className="rounded-full" />
                  </div>
                  <Skeleton count={3} height={20} />
                  <Skeleton height={120} className="rounded-xl" />
               </div>
            </div>
         </motion.div>

         {/* Questions skeleton */}
         <div className="space-y-4">
            {[1, 2, 3].map((index) => (
               <QuestionSkeleton key={index} />
            ))}
         </div>

         {/* Submit button skeleton */}
         <motion.div
            {...MOTION_VARIANTS.fadeIn}
            transition={{ delay: 0.4 }}
            className="flex justify-end mt-6"
         >
            <Skeleton height={48} width={140} className="rounded-xl" />
         </motion.div>
      </div>
   </div>
);

// Example: Enhanced loading skeleton for questions
const QuestionSkeleton = () => (
   <motion.div
      {...MOTION_VARIANTS.fadeIn}
      className="p-6 bg-white shadow-lg rounded-2xl backdrop-blur-xl"
   >
      <Skeleton height={24} width="60%" className="mb-4" />
      <Skeleton height={20} width="40%" className="mb-3" />
      <div className="space-y-2">
         <Skeleton height={40} />
         <Skeleton height={40} />
         <Skeleton height={40} />
      </div>
   </motion.div>
);

const ErrorDisplay = ({ error }) => (
   <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex flex-col items-center p-10">
         <motion.div
            {...MOTION_VARIANTS.scaleIn}
            transition={{ type: "spring", stiffness: 100 }}
            className="p-4 mt-16 bg-red-100 rounded-full"
         >
            <ExclamationTriangleIcon className="w-24 h-24 text-red-500" />
         </motion.div>
         <motion.div
            {...MOTION_VARIANTS.fadeIn}
            transition={{ delay: 0.2 }}
            className="p-8 mt-6 text-center bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl max-w-[40rem]"
         >
            <h1 className="text-2xl font-bold text-gray-900">{error}</h1>
            <p className="mt-4 text-gray-600">
               Please check the survey link and try again.
            </p>
            <button
               onClick={() => window.history.back()}
               className="px-6 py-2 mt-6 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
               Go Back
            </button>
         </motion.div>
      </div>
   </div>
);

const StatusBadge = ({ status }) => (
   <span className={`px-3 py-1 text-sm font-medium rounded-full ${status
      ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
      : "bg-red-100 text-red-700 ring-1 ring-red-600/20"
      }`}>
      {status ? "Active" : "Closed"}
   </span>
);

const ExpirationBadge = ({ expireDate }) => (
   <span className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full ring-1 ring-gray-600/10">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {expireDate ? 'Expires: ' + new Date(expireDate + 'T00:00:00').toLocaleDateString() : 'No expiration'}
   </span>
);

const SurveyImage = ({ imageUrl, title }) => (
   <div className="relative h-[300px] rounded-xl overflow-hidden bg-gray-50">
      <img
         src={imageUrl || logo}
         loading="lazy"
         className={`w-full h-full transition-transform duration-300 hover:scale-105 ${!imageUrl ? 'object-contain p-8' : 'object-cover'
            }`}
         alt={title}
         onError={(e) => {
            e.target.onerror = null;
            e.target.src = logo;
            e.target.className = 'object-contain w-full h-full p-8';
         }}
      />
   </div>
);

const SurveyHeader = ({ survey }) => (
   <motion.div
      {...MOTION_VARIANTS.fadeIn}
      className="p-8 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
   >
      <div className="flex flex-col gap-8 md:flex-row">
         <div className="w-full md:w-1/2">
            <SurveyImage imageUrl={survey.image_url} title={survey.title} />
         </div>
         <div className="w-full space-y-4 md:w-1/2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
               {survey.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
               <StatusBadge status={survey.status} />
               <ExpirationBadge expireDate={survey.expire_date} />
            </div>
            <p className="p-4 leading-relaxed text-gray-600 bg-gray-50 rounded-xl">
               {survey.description}
            </p>
         </div>
      </div>
   </motion.div>
);

const SuccessMessage = () => (
   <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 text-center bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
   >
      <motion.div
         {...MOTION_VARIANTS.scaleIn}
         transition={{ type: "spring", stiffness: 100 }}
         className="p-2 mx-auto mb-6 bg-green-100 rounded-full w-fit"
      >
         <CheckCircleIcon className="w-16 h-16 text-green-500" />
      </motion.div>
      <h2 className="mb-3 text-2xl font-bold text-gray-900">Thank You!</h2>
      <p className="text-gray-600">
         Your response has been successfully recorded.
      </p>
      <button
         onClick={() => window.location.reload()}
         className="px-6 py-2 mt-6 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
         Submit Another Response
      </button>
   </motion.div>
);

const QuestionsList = ({ questions, answers, onAnswerChange }) => (
   <div className="space-y-4">
      {questions.map((question, index) => (
         <motion.div
            key={question.id}
            {...MOTION_VARIANTS.fadeIn}
            transition={{ delay: index * 0.1 }}
         >
            <PublicQuestionView
               question={question}
               index={index}
               answer={answers[question.id]}
               answerChanged={(val) => onAnswerChange(question, val)}
            />
         </motion.div>
      ))}
   </div>
);

const SubmitButton = ({ isSubmitting, onSubmit }) => (
   <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex justify-end"
   >
      <button
         className={`px-6 py-3 text-base font-medium text-white transition-all duration-300 bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
         type="button"
         disabled={isSubmitting}
         onClick={onSubmit}
      >
         {isSubmitting ? 'Submitting...' : 'Submit Survey'}
      </button>
   </motion.div>
);

// Custom Hooks
const useSurveyData = (slug) => {
   const [survey, setSurvey] = useState(INITIAL_SURVEY_STATE);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const fetchSurvey = useCallback(async (signal) => {
      setLoading(true);
      setError(null);

      try {
         const response = await axiosClient.get('survey/get-by-slug/' + slug, { signal });
         if (signal?.aborted) return;

         if (!response.data?.data) {
            throw new Error("Invalid API response format");
         }


         setSurvey(response.data.data);
      } catch (error) {
         if (signal?.aborted) return;
         setError(error.message || "Failed to load survey");
      } finally {
         if (!signal?.aborted) setLoading(false);
      }
   }, [slug]);

   return { survey, loading, error, fetchSurvey };
};

const useSurveySubmission = (surveyId) => {
   const [answers, setAnswers] = useState({});
   const [submissionError, setSubmissionError] = useState(null);
   const [surveyFinished, setSurveyFinished] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const submitting = useRef(false);
   useEffect(() => {
      setAnswers({});
      setSurveyFinished(false);
      setSubmissionError(null);
   }, [surveyId]);

   const handleAnswerChange = useCallback((question, value) => {
      // Live update - add/remove answers dynamically
      setAnswers(prev => {
         const newAnswers = { ...prev };
         if (Array.isArray(value) ? value.length > 0 : value != null && value !== '') {
            newAnswers[question.id] = value;
         } else {
            delete newAnswers[question.id];
         }
         return newAnswers;
      });
   }, []);

   const handleSubmit = useCallback(async (e) => {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

      if (submitting.current || !surveyId) return;
      submitting.current = true;

      console.log('Submitting survey with answers:', answers);

      setIsSubmitting(true);
      setSubmissionError(null);

      try {
         const response = await axiosClient.post(`survey/${surveyId}/answer`, { answers });
         console.log('Survey submitted successfully:', response);
         setSurveyFinished(true);
      } catch (error) {
         console.error("Error submitting survey:", error);
         setSubmissionError(
            error.response?.data?.message ||
            "There was a problem submitting your response. Please try again."
         );
      } finally {
         submitting.current = false;
         setIsSubmitting(false);
      }
   }, [answers, surveyId]);

   return {
      answers,
      submissionError,
      setSubmissionError,
      surveyFinished,
      isSubmitting,
      handleAnswerChange,
      handleSubmit
   };
};

// Main Component
export default function SurveyPublicView() {
   const { slug } = useParams();
   const { survey, loading, error, fetchSurvey } = useSurveyData(slug);
   const {
      answers,
      submissionError,
      setSubmissionError,
      surveyFinished,
      isSubmitting,
      handleAnswerChange,
      handleSubmit
   } = useSurveySubmission(survey.id);

   useEffect(() => {
      const controller = new AbortController();
      if (slug) fetchSurvey(controller.signal);
      return () => controller.abort();
   }, [fetchSurvey, slug]);

   if (loading) return <LoadingSkeleton />;
   if (error) return <ErrorDisplay error={error} />;

   return (
      <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
         <div className="absolute inset-0 opacity-40">
            <AnimatedBackground />
         </div>
         <div className="relative z-10 w-11/12 py-12 mx-auto md:w-3/4 xl:w-1/2">
            <div className="space-y-6">
               <SurveyHeader survey={survey} />

               <SimpleProgressBar current={Object.keys(answers).length} total={(survey.questions || []).length} />

               {surveyFinished ? (
                  <SuccessMessage />
               ) : (
                  <>
                     <QuestionsList
                        questions={survey.questions || []}
                        answers={answers}
                        onAnswerChange={handleAnswerChange}
                     />
                     {submissionError && (
                        <div className="mb-4">
                           <ErrorMessage
                              error={submissionError}
                              onClear={() => setSubmissionError(null)}
                           />
                        </div>
                     )}
                     <SubmitButton
                        isSubmitting={isSubmitting}
                        onSubmit={handleSubmit}
                     />
                  </>
               )}
            </div>
         </div>
      </div>
   );
}

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "@api/axios.js";
import RespondentAnswerView from "@components/RespondentAnswerView.jsx";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { FaArrowLeft } from "react-icons/fa6";
import { motion } from "framer-motion";
import logo from "@images/AceLogo.png";

// Loading skeleton component
const LoadingSkeleton = () => (
   <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full min-h-screen bg-gray-50"
   >
      <div className="w-11/12 py-6 mx-auto space-y-6 md:w-3/4 xl:w-1/2">
         <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-between w-full px-6 py-4 bg-white shadow-sm rounded-xl"
         >
            <div className="py-2">
               <Skeleton circle width={40} height={40} />
            </div>
         </motion.div>

         <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-6 p-6 bg-white border border-gray-200 shadow-sm rounded-xl md:flex-row"
         >
            <div className="w-full md:w-1/2">
               <Skeleton height={320} className="rounded-lg" />
            </div>
            <div className="w-full space-y-4 lg:w-1/2">
               <Skeleton height={48} width="80%" />
               <Skeleton count={2} />
               <Skeleton height={100} />
            </div>
         </motion.div>

         <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-6"
         >
            {[1, 2, 3].map((_, index) => (
               <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl"
               >
                  <Skeleton height={24} width="60%" className="mb-4" />
                  <Skeleton height={40} />
               </motion.div>
            ))}
         </motion.div>
      </div>
   </motion.div>
);

// Error display component
const ErrorDisplay = ({ error }) => (
   <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen p-6 bg-gray-50"
   >
      <div className="p-6 text-red-600 bg-white shadow-sm rounded-xl">
         Error: {error}
      </div>
   </motion.div>
);

// No data display component
const NoDataDisplay = () => (
   <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen p-6 bg-gray-50"
   >
      <div className="p-6 text-gray-600 bg-white shadow-sm rounded-xl">
         No data available
      </div>
   </motion.div>
);

// Header component with back button
const Header = ({ onGoBack }) => (
   <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex justify-between w-full px-6 py-4 bg-white shadow-sm rounded-xl"
   >
      <div className="py-2">
         <Tooltip title="Go Back" placement="bottom" TransitionComponent={Fade}>
            <motion.div
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="p-4 transition-colors rounded-full cursor-pointer hover:bg-gray-100"
               onClick={onGoBack}
            >
               <FaArrowLeft className="text-gray-700" />
            </motion.div>
         </Tooltip>
      </div>
   </motion.div>
);

// Survey details component
const SurveyDetails = ({ responseDetails }) => (
   <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col gap-6 p-6 bg-white border border-gray-200 shadow-sm rounded-xl md:flex-row"
   >
      <div className="w-full md:w-1/2">
         <img
            src={responseDetails.image_url || logo}
            loading="lazy"
            className="object-contain w-full rounded-md h-80 bg-gray-50"
            alt={responseDetails.title}
         />
      </div>
      <div className="w-full lg:w-1/2">
         <h1 className="my-3 text-4xl font-semibold">
            {responseDetails.title}
         </h1>
         <p className="mb-1 text-sm text-gray-500">
            Status: {responseDetails.status ? "Active" : "Closed"}
         </p>
         <p className="mb-3 overflow-y-auto text-sm text-gray-500 max-h-48">
            {responseDetails.description}
         </p>
      </div>
   </motion.div>
);

// Questions list component
const QuestionsList = ({ questions, answers }) => (
   <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="w-full space-y-6"
   >
      {questions.map((question, index) => (
         <RespondentAnswerView
            key={question.id}
            question={question}
            answer={
               answers.find(
                  (a) => a.survey_question_id === question.id
               )?.answer || ""
            }
            index={index}
         />
      ))}
   </motion.div>
);

// Custom hook for fetching response details
const useResponseDetails = (surveyId, responseId) => {
   const [responseDetails, setResponseDetails] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   useEffect(() => {
      let isMounted = true;
      const controller = new AbortController();

      const fetchResponseDetails = async () => {
         try {
            setLoading(true);
            setError(null);

            const response = await axiosClient.getWithCache(
               `/survey/${surveyId}/responses/${responseId}/details`,
               {},
               {
                  signal: controller.signal,
                  requestKey: `respondent_details_${surveyId}_${responseId}_${Date.now()}`,
                  cancelPrevious: false
               }
            );

            if (isMounted) {
               setResponseDetails(response.data);
               setLoading(false);
            }
         } catch (error) {
            if (isMounted && !error.isCanceled && error.name !== 'AbortError') {
               setError(
                  error.response ? error.response.data.message : error.message
               );
               setLoading(false);
            }
         }
      };

      if (surveyId && responseId) {
         fetchResponseDetails();
      }

      return () => {
         isMounted = false;
         controller.abort();
      };
   }, [surveyId, responseId]);

   return { responseDetails, loading, error };
};

export default function Respondent() {
   const { surveyId, responseId } = useParams();
   const navigate = useNavigate();
   const { responseDetails, loading, error } = useResponseDetails(surveyId, responseId);

   const handleGoBack = () => navigate(-1);

   // Early returns for loading and error states
   if (loading) return <LoadingSkeleton />;
   if (error) return <ErrorDisplay error={error} />;
   if (!responseDetails?.questions) return <NoDataDisplay />;

   // Transform questions to answers format
   const answers = responseDetails.questions.map((question) => ({
      survey_question_id: question.id,
      answer: question.answer || "",
   }));

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="relative w-full min-h-screen bg-gray-50"
      >
         <div className="w-11/12 py-6 mx-auto space-y-6 md:w-3/4 xl:w-1/2">
            <Header onGoBack={handleGoBack} />
            <SurveyDetails responseDetails={responseDetails} />
            <QuestionsList
               questions={responseDetails.questions}
               answers={answers}
            />
         </div>
      </motion.div>
   );
}

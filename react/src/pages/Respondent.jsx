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

// Animation variants for consistent motion
const motionVariants = {
   container: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
   },
   item: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 }
   }
};

// Loading skeleton components
const SkeletonCard = ({ delay = 0, children }) => (
   <motion.div
      initial={motionVariants.item.initial}
      animate={motionVariants.item.animate}
      transition={{ delay }}
      className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl"
   >
      {children}
   </motion.div>
);

const LoadingSkeleton = () => (
   <motion.div
      initial={motionVariants.container.initial}
      animate={motionVariants.container.animate}
      className="relative w-full min-h-screen bg-gray-50"
   >
      <div className="w-11/12 py-6 mx-auto space-y-6 md:w-3/4 xl:w-1/2">
         {/* Header skeleton */}
         <SkeletonCard>
            <div className="flex justify-between w-full">
               <Skeleton circle width={40} height={40} />
            </div>
         </SkeletonCard>

         {/* Survey details skeleton */}
         <SkeletonCard delay={0.1}>
            <div className="flex flex-col gap-6 md:flex-row">
               <div className="w-full md:w-1/2">
                  <Skeleton height={320} className="rounded-lg" />
               </div>
               <div className="w-full space-y-4 lg:w-1/2">
                  <Skeleton height={48} width="80%" />
                  <Skeleton count={2} />
                  <Skeleton height={100} />
               </div>
            </div>
         </SkeletonCard>

         {/* Questions skeleton */}
         <div className="w-full space-y-6">
            {[1, 2, 3].map((_, index) => (
               <SkeletonCard key={index} delay={0.2 + index * 0.1}>
                  <Skeleton height={24} width="60%" className="mb-4" />
                  <Skeleton height={40} />
               </SkeletonCard>
            ))}
         </div>
      </div>
   </motion.div>
);

// Reusable message display component
const MessageDisplay = ({ message, type = "info" }) => {
   const bgColor = type === "error" ? "text-red-600" : "text-gray-600";

   return (
      <motion.div
         initial={motionVariants.container.initial}
         animate={motionVariants.container.animate}
         className="flex items-center justify-center min-h-screen p-6 bg-gray-50"
      >
         <div className={`p-6 bg-white shadow-sm rounded-xl ${bgColor}`}>
            {type === "error" ? "Error: " : ""}{message}
         </div>
      </motion.div>
   );
};

// Header component with back button
const Header = ({ onGoBack }) => (
   <motion.div
      initial={motionVariants.item.initial}
      animate={motionVariants.item.animate}
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

// Survey status badge component
const StatusBadge = ({ status }) => (
   <span className={`px-2 py-1 text-xs font-medium rounded-full ${status
         ? "bg-green-100 text-green-800"
         : "bg-red-100 text-red-800"
      }`}>
      {status ? "Active" : "Closed"}
   </span>
);

// Survey details component
const SurveyDetails = ({ responseDetails }) => (
   <motion.div
      initial={motionVariants.item.initial}
      animate={motionVariants.item.animate}
      transition={{ delay: 0.1 }}
      className="flex flex-col gap-6 p-6 bg-white border border-gray-200 shadow-sm rounded-xl md:flex-row"
   >
      <div className="w-full md:w-1/2">
         <img
            src={responseDetails.image_url || logo}
            loading="lazy"
            className="object-contain w-full rounded-md h-80 bg-gray-50"
            alt={responseDetails.title}
            onError={(e) => {
               e.target.src = logo;
            }}
         />
      </div>
      <div className="w-full lg:w-1/2">
         <h1 className="my-3 text-4xl font-semibold">
            {responseDetails.title}
         </h1>
         <div className="mb-3">
            <StatusBadge status={responseDetails.status} />
         </div>
         <p className="mb-3 overflow-y-auto text-sm text-gray-500 max-h-48">
            {responseDetails.description}
         </p>
      </div>
   </motion.div>
);

// Questions list component
const QuestionsList = ({ questions, answers }) => (
   <motion.div
      initial={motionVariants.item.initial}
      animate={motionVariants.item.animate}
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
      if (!surveyId || !responseId) {
         setError("Invalid survey or response ID");
         setLoading(false);
         return;
      }

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
                  requestKey: `respondent_details_${surveyId}_${responseId}`,
                  cancelPrevious: false
               }
            );

            if (isMounted) {
               setResponseDetails(response.data);
            }
         } catch (error) {
            if (isMounted && !error.isCanceled && error.name !== 'AbortError') {
               setError(
                  error.response?.data?.message || error.message || "Failed to load response details"
               );
            }
         } finally {
            if (isMounted) {
               setLoading(false);
            }
         }
      };

      fetchResponseDetails();

      return () => {
         isMounted = false;
         controller.abort();
      };
   }, [surveyId, responseId]);

   return { responseDetails, loading, error };
};

// Helper function to transform questions to answers format
const transformQuestionsToAnswers = (questions) => {
   return questions?.map((question) => ({
      survey_question_id: question.id,
      answer: question.answer || "",
   })) || [];
};

// Main component
export default function Respondent() {
   const { surveyId, responseId } = useParams();
   const navigate = useNavigate();
   const { responseDetails, loading, error } = useResponseDetails(surveyId, responseId);

   const handleGoBack = () => navigate(-1);

   // Early returns for different states
   if (loading) return <LoadingSkeleton />;
   if (error) return <MessageDisplay message={error} type="error" />;
   if (!responseDetails?.questions) return <MessageDisplay message="No data available" />;

   // Transform questions to answers format
   const answers = transformQuestionsToAnswers(responseDetails.questions);

   return (
      <motion.div
         initial={motionVariants.container.initial}
         animate={motionVariants.container.animate}
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

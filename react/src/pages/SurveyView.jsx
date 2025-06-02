import React, { useEffect, useState, useRef } from "react";
import {
   ArrowTopRightOnSquareIcon,
   EyeIcon,
   UsersIcon,
   TrashIcon,
   ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import axiosClient from "@api/axios.js";
import { useNavigate, useParams } from "react-router-dom";
import SurveyQuestions from "@components/SurveyQuestions.jsx";
import { useStateContext } from "@context/ContextProvider.jsx";
import ShareSurveyPopup from "../components/ShareSurveyPopup.jsx";
import { motion } from "framer-motion";
import { debounce } from 'lodash';
import ErrorMessage from "@components/ErrorMessage";
import logo from "@images/AceLogo.png";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Custom hooks
import { useWindowSize } from '../hooks/useWindowSize';
import { useSurveyCache } from '../hooks/useSurveyCache';
import { useSurveyForm } from '../hooks/useSurveyForm';

// Components
import SurveyHeader from '../components/SurveyHeader';
import SurveyActions from '../components/SurveyActions';
import SurveyFormFields from '../components/SurveyFormFields';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

// Loading Skeleton Component
const LoadingSkeleton = ({ width }) => (
   <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="px-4 py-8 mx-auto max-w-7xl">
         {/* Header Skeleton */}
         <div className="mb-6 sm:mb-8">
            <Skeleton height={width < 640 ? 28 : width < 768 ? 32 : 40} width={width < 640 ? 250 : 300} className="mb-2" />
            <Skeleton height={width < 640 ? 16 : 20} width={width < 640 ? 300 : 400} />
         </div>

         {/* Actions Skeleton */}
         <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 p-3 mb-4 bg-white border border-gray-100 shadow-sm sm:p-4 sm:mb-6 rounded-xl backdrop-blur-xl bg-opacity-90">
            {[1, 2, 3, 4].map((i) => (
               <Skeleton key={i} width={width < 640 ? 60 : width < 768 ? 80 : 100} height={width < 640 ? 32 : 40} borderRadius={8} />
            ))}
         </div>

         {/* Form Fields Skeleton */}
         <div className="mb-4 overflow-hidden bg-white shadow-sm rounded-xl sm:mb-6">
            <div className="p-3 space-y-4 sm:p-4 md:p-6 lg:p-8 sm:space-y-6">
               <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                  {/* Image Section Skeleton */}
                  <div className="space-y-3 sm:space-y-4">
                     <div className="overflow-hidden rounded-lg aspect-video">
                        <Skeleton height="100%" className="rounded-lg" />
                     </div>
                     <Skeleton height={width < 640 ? 36 : 40} className="rounded-lg" />
                  </div>

                  {/* Form Fields Skeleton */}
                  <div className="space-y-4 sm:space-y-6">
                     {/* Title Field */}
                     <div className="relative p-3 sm:p-4">
                        <Skeleton height={16} width={100} className="mb-2" />
                        <Skeleton height={width < 640 ? 40 : width < 768 ? 44 : 48} className="rounded-lg" />
                     </div>

                     {/* Description Field */}
                     <div className="relative p-3 sm:p-4">
                        <Skeleton height={16} width={80} className="mb-2" />
                        <Skeleton height={width < 640 ? 60 : width < 768 ? 80 : 96} className="rounded-lg" />
                        <Skeleton height={12} width="80%" className="mt-2" />
                     </div>

                     {/* Date Field */}
                     <div className="relative p-3 sm:p-4">
                        <Skeleton height={16} width={90} className="mb-2" />
                        <Skeleton height={width < 640 ? 40 : width < 768 ? 44 : 48} className="rounded-lg" />
                     </div>

                     {/* Status Field */}
                     <div className="relative p-3 sm:p-4">
                        <Skeleton height={16} width={100} className="mb-2" />
                        <div className="p-2.5 sm:p-3 rounded-lg bg-gray-50">
                           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-0">
                              <div>
                                 <Skeleton height={14} width={180} className="mb-1" />
                                 <Skeleton height={12} width={220} />
                              </div>
                              <Skeleton height={20} width={60} borderRadius={20} />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Questions Skeleton */}
         <div className="p-3 mb-4 bg-white shadow-sm sm:p-4 md:p-6 rounded-xl sm:mb-6">
            <Skeleton height={24} width={150} className="mb-4" />
            {[1, 2, 3].map((i) => (
               <div key={i} className="p-4 mb-6 border border-gray-200 rounded-lg">
                  <div className="flex flex-col mb-3 sm:flex-row sm:items-center sm:justify-between">
                     <Skeleton height={20} width={120} />
                     <Skeleton height={32} width={80} borderRadius={6} />
                  </div>
                  <Skeleton height={48} className="mb-3 rounded-lg" />
                  <div className="space-y-2">
                     <Skeleton height={36} className="rounded-lg" />
                     <Skeleton height={36} className="rounded-lg" />
                  </div>
               </div>
            ))}
         </div>

         {/* Submit Button Skeleton */}
         <div className="flex justify-end">
            <Skeleton height={width < 640 ? 36 : 40} width={width < 640 ? 120 : 140} className="rounded-lg" />
         </div>
      </div>
   </div>
);

export default function SurveyView() {
   const { showToast } = useStateContext();
   const navigate = useNavigate();
   const { id } = useParams();
   const { width } = useWindowSize();

   // Custom hooks for form management
   const {
      survey,
      setSurvey,
      updateSurveyField,
      loading,
      error,
      clearError,
      handleSubmit,
      handleImageChange,
      fetchSurvey
   } = useSurveyForm(id, showToast, navigate);

   // Cache management
   const { clearSurveyCache } = useSurveyCache();

   // UI state
   const [openSharePopup, setOpenSharePopup] = useState(false);
   const [shareLink, setShareLink] = useState("");
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [surveyToDelete, setSurveyToDelete] = useState(null);

   // Effects
   useEffect(() => {
      if (id) {
         fetchSurvey();
      }
   }, [id, fetchSurvey]);

   // Event handlers
   const handleDeleteClick = debounce((surveyId) => {
      setSurveyToDelete(surveyId);
      setShowDeleteModal(true);
   }, 300);

   const handleConfirmDelete = async () => {
      try {
         await axiosClient.delete(`/survey/${surveyToDelete}`);
         clearSurveyCache();
         navigate("/surveys");
         showToast("The survey was deleted");
      } catch (error) {
         console.error("Error deleting survey:", error);
         showToast("Failed to delete the survey");
      } finally {
         setShowDeleteModal(false);
         setSurveyToDelete(null);
      }
   };

   const handleOpenShare = debounce(() => {
      setShareLink(`${window.location.origin}/survey/public/${survey.slug}`);
      setOpenSharePopup(true);
   }, 300);

   const handleGoBack = debounce(() => {
      navigate(-1);
   }, 300);

   const handleViewResponses = debounce((surveyId) => {
      navigate(`/surveys/${surveyId}/responses`);
   }, 300);

   const handleQuestionsUpdate = (questions) => {
      setSurvey(prevSurvey => ({
         ...prevSurvey,
         questions
      }));
   };

   if (loading) {
      return <LoadingSkeleton width={width} />;
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
         <div className="px-4 py-8 mx-auto max-w-7xl">
            <SurveyHeader id={id} />

            <SurveyActions
               id={id}
               survey={survey}
               onGoBack={handleGoBack}
               onOpenShare={handleOpenShare}
               onViewResponses={handleViewResponses}
               onDelete={handleDeleteClick}
               width={width}
            />

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
               <SurveyFormFields
                  survey={survey}
                  setSurvey={setSurvey}
                  updateSurveyField={updateSurveyField}
                  onImageChange={handleImageChange}
                  width={width}
                  logo={logo}
               />

               {error && (
                  <div className="my-3 sm:my-4">
                     <ErrorMessage error={error} onClear={clearError} />
                  </div>
               )}

               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-white shadow-sm sm:p-4 md:p-6 rounded-xl"
               >
                  <SurveyQuestions
                     questions={survey.questions}
                     onQuestionsUpdate={handleQuestionsUpdate}
                  />
               </motion.div>

               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end"
               >
                  <button
                     type="submit"
                     className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                     {id ? "Update Survey" : "Create Survey"}
                  </button>
               </motion.div>
            </form>

            <DeleteConfirmationModal
               isOpen={showDeleteModal}
               onConfirm={handleConfirmDelete}
               onCancel={() => {
                  setShowDeleteModal(false);
                  setSurveyToDelete(null);
               }}
            />

            <ShareSurveyPopup
               openSharePopup={openSharePopup}
               setOpenSharePopup={setOpenSharePopup}
               shareLink={shareLink}
            />
         </div>
      </div>
   );
}

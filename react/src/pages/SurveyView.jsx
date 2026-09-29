import SurveyEditorSkeleton from '@components/SurveyEditorSkeleton';
import { useEffect, useState } from "react";

import axiosClient from "@api/axios.js";
import { useNavigate, useParams } from "react-router-dom";
import SurveyQuestions from "@components/SurveyQuestions.jsx";
import { useStateContext } from "@context/ContextProvider.jsx";
import ShareSurveyPopup from "../components/ShareSurveyPopup.jsx";
import { motion } from "framer-motion";
import ErrorMessage from "@components/ErrorMessage";
import logo from "@images/AceLogo.png";

import 'react-loading-skeleton/dist/skeleton.css';

// Custom hooks
import { useWindowSize } from '../hooks/useWindowSize';
import { useSurveyCache } from '../hooks/useSurveyCache';
import { useSurveyForm } from '../hooks/useSurveyForm';

// Components

import SurveyActions from '../components/SurveyActions';
import SurveyFormFields from '../components/SurveyFormFields';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

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
      fetchSurvey,
      readingImage,
      allowNavigation
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
   const handleDeleteClick = (surveyId) => {
      setSurveyToDelete(surveyId);
      setShowDeleteModal(true);
   };

   const handleConfirmDelete = async () => {
      try {
         await axiosClient.delete(`/survey/${surveyToDelete}`);
         clearSurveyCache();
         allowNavigation();
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

   const handleOpenShare = () => {
      setShareLink(`${window.location.origin}/survey/public/${survey.slug}`);
      setOpenSharePopup(true);
   };

   const handleGoBack = () => {
      navigate('/surveys');
   };

   const handleViewResponses = (surveyId) => {
      navigate(`/surveys/${surveyId}/responses`);
   };

   const handleQuestionsUpdate = (questions) => {
      if (survey.can_manage === false) return;
      setSurvey(prevSurvey => ({
         ...prevSurvey,
         questions
      }));
   };

   if (loading) {
      return <SurveyEditorSkeleton />;
   }

   return (
      <div className="survey-builder">
         <div className="builder-content">
            <header className="builder-heading"><div><button type="button" className="ace-back-link" onClick={handleGoBack}>← Back to surveys</button><span className="ace-eyebrow">SURVEY STUDIO</span><h1>{id ? "Make every question count." : "Start a new conversation."}</h1><p>Shape your survey, add your questions, and invite a little perspective.</p></div><span className="builder-question-count">{survey.questions?.length || 0} questions</span></header>

            <SurveyActions
               id={id}
               survey={survey}
               onGoBack={handleGoBack}
               onOpenShare={handleOpenShare}
               onViewResponses={handleViewResponses}
               onDelete={handleDeleteClick}
               width={width}
            />

            {survey.can_manage === false && <p className="p-4 mb-4 bg-teal-50 rounded-lg">You are viewing another user&apos;s survey. Only its creator can edit or delete it.</p>}
            <form onSubmit={event => { if (survey.can_manage === false) event.preventDefault(); else handleSubmit(event); }} className="space-y-4 sm:space-y-6">
               <fieldset disabled={survey.can_manage === false} className="space-y-4 sm:space-y-6">
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
                  className="builder-questions"
               >
                  <div className="builder-section-title"><span>02</span><div><h2>Build your questions</h2><p>Keep it focused. A thoughtful question invites a useful answer.</p></div></div>
                  <SurveyQuestions
                     questions={survey.questions}
                     onQuestionsUpdate={handleQuestionsUpdate}
                  />
               </motion.div>

               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="builder-savebar"
               >
                  <p>Ready to share? Save your changes first.</p>
                  {survey.can_manage !== false && <button
                     type="submit"
                     disabled={readingImage}
                     className="ace-button"
                  >
                     {readingImage ? "Reading image..." : id ? "Save changes" : "Create survey"}
                  </button>}
               </motion.div>
               </fieldset>
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

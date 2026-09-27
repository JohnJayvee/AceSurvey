import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import axiosClient from "@api/axios";
import PublicQuestionView from "@components/PublicQuestionView";


import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";



import ErrorMessage from "@components/ErrorMessage";

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

// Respondent-facing layout
const PublicTopbar = () => <div className="respondent-topbar"><Link to="/survey-selection"><img src={logo} alt="" /><span>AceSurvey</span></Link><span>A space for your perspective</span></div>;
const LoadingSkeleton = () => <div className="respondent-page" role="status" aria-busy="true" aria-label="Loading survey"><PublicTopbar /><span className="sr-only">Loading survey...</span><div className="respondent-content" aria-hidden="true"><div className="respondent-intro"><div className="response-placeholder w-16 h-16 mb-6" /><div className="response-placeholder w-40 h-3 mb-4" /><div className="response-placeholder w-80 max-w-full h-10 mb-5" /><div className="response-placeholder w-full h-4 mb-3" /><div className="response-placeholder w-3/4 h-4" /></div><div className="response-placeholder w-full h-16 my-6" />{[1,2,3].map(i => <div className="respondent-placeholder-question" key={i}><div className="response-placeholder w-3/4 h-5 mb-6" /><div className="response-placeholder w-full h-12" /></div>)}</div></div>;
const ErrorDisplay = ({ error }) => <div className="respondent-page"><PublicTopbar /><main className="respondent-content"><div className="respondent-result" role="alert"><ExclamationTriangleIcon /><span className="ace-eyebrow">SURVEY UNAVAILABLE</span><h1>We couldn't open this survey.</h1><p>{error}</p><p>It may be closed, expired, or no longer available.</p><Link className="ace-button" to="/survey-selection">Browse surveys</Link></div></main></div>;
const SurveyHeader = ({ survey }) => <header className="respondent-intro">
   <div className="respondent-intro-top"><img src={survey.image_url || logo} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = logo; }} /><span className="respondent-invitation">YOUR EXPERIENCE. YOUR VOICE.</span></div>
   <h1>{survey.title}</h1><p>{survey.description || 'Thank you for taking a moment to share your experience. Your feedback helps us understand what matters to you.'}</p>
   <div className="respondent-meta"><span>{survey.questions?.length || 0} questions</span><span>{survey.expire_date ? 'Open through ' + new Date(survey.expire_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'No closing date'}</span></div>
</header>;
const SuccessMessage = () => <section className="respondent-result" role="status"><CheckCircleIcon /><span className="ace-eyebrow">RESPONSE RECEIVED</span><h2>Thank you for sharing.</h2><p>Your response has been recorded. We appreciate the time you took to tell us about your experience.</p><Link className="ace-button ace-button-secondary" to="/survey-selection">Explore other surveys</Link><button type="button" className="respondent-again" onClick={() => window.location.reload()}>Submit another response</button></section>;
const QuestionsList = ({ questions, answers, onAnswerChange }) => <div className="respondent-questions">{questions.map((question, index) => <PublicQuestionView key={question.id} question={question} index={index} answer={answers[question.id]} answerChanged={value => onAnswerChange(question, value)} />)}</div>;
const SubmitButton = ({ isSubmitting }) => <div className="respondent-submit"><div><strong>Every perspective makes a difference.</strong><p>Review your answers before submitting.</p></div><button className="ace-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit response'}</button></div>;
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



      setIsSubmitting(true);
      setSubmissionError(null);

      try {
         await axiosClient.post(`survey/${surveyId}/answer`, { answers });

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

   const answered = Object.keys(answers).length;
   const total = survey.questions?.length || 0;
   const progress = total ? Math.round(answered / total * 100) : 0;
   return <div className="respondent-page">
      <PublicTopbar />
      <main className="respondent-content">
         <SurveyHeader survey={survey} />
         {surveyFinished ? <SuccessMessage /> : <>
            <div className="respondent-progress"><div><span>Your progress</span><strong>{answered} of {total} answered</strong></div><div role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="respondent-progress-track"><span style={{ width: progress + '%' }} /></div></div>
            <form onSubmit={handleSubmit}>
               <fieldset disabled={isSubmitting} className="min-w-0">
                  <QuestionsList questions={survey.questions || []} answers={answers} onAnswerChange={handleAnswerChange} />
                  {submissionError && <div className="my-5"><ErrorMessage error={submissionError} onClear={() => setSubmissionError(null)} /></div>}
                  <SubmitButton isSubmitting={isSubmitting} />
               </fieldset>
            </form>
         </>}
         <footer className="respondent-footer"><span>Powered by AceSurvey</span><span>Thoughtful questions. Meaningful answers.</span></footer>
      </main>
   </div>;
}

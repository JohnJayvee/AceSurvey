import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import axiosClient from '@api/axios';
import RespondentAnswerView from '@components/RespondentAnswerView';
import RespondentSkeleton from '@components/RespondentSkeleton';
import logo from '@images/AceLogo.png';
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

export default function Respondent() {
   const { surveyId, responseId } = useParams();
   const { responseDetails: details, loading, error } = useResponseDetails(surveyId, responseId);
   if (loading) return <RespondentSkeleton />;
   const back = <Link className="ace-back-link" to={'/surveys/' + surveyId + '/responses'}><ArrowLeftIcon />Back to responses</Link>;
   if (error || !details?.questions) return <section className="answer-detail">{back}<div className="answer-summary" role="alert"><h1>Unable to open this response</h1><p>{error || 'No response data is available.'}</p></div></section>;
   const answered = details.questions.filter(question => {
      if (question.answer == null || question.answer === '') return false;
      if (question.type === 'checkboxes') {
         try { const parsed = JSON.parse(question.answer); return Array.isArray(parsed) ? parsed.length > 0 : true; } catch { return true; }
      }
      return true;
   }).length;
   return <div className="answer-detail">
      {back}
      <header className="answer-detail-heading"><div><span className="ace-eyebrow">A CLOSER LOOK</span><h1>One response. A new perspective.</h1><p>Review the feedback shared with your survey.</p></div><span className="answer-reference">Response #{responseId}</span></header>
      <div className="answer-detail-grid">
         <aside className="answer-summary"><img src={details.image_url || logo} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = logo; }} /><span className="ace-eyebrow">ABOUT THIS RESPONSE</span><h2>{details.title}</h2>{details.description && <p>{details.description}</p>}<dl><div><dt>Response ID</dt><dd>#{responseId}</dd></div><div><dt>Questions</dt><dd>{details.questions.length}</dd></div><div><dt>Answered</dt><dd>{answered} of {details.questions.length}</dd></div></dl><Link to={'/surveys/' + surveyId + '/responses'}>Survey overview<ArrowUpRightIcon /></Link><div className="answer-readonly">Submitted answers are shown as received and cannot be edited here.</div></aside>
         <section className="answer-detail-list" aria-label="Submitted answers"><div className="answer-list-heading"><h2>Submitted answers</h2><span>{answered} answered</span></div>{details.questions.length ? details.questions.map((question, index) => <RespondentAnswerView key={question.id} question={question} index={index} answer={question.answer} />) : <div className="answer-card">No questions are available for this response.</div>}</section>
      </div>
   </div>;
}
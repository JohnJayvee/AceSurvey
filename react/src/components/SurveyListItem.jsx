import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon, ShareIcon, TrashIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import ShareSurveyPopup from "@components/ShareSurveyPopup";
import { isSurveyExpired } from "@utils/dashboardUtils";
import logo from "@images/AceLogo.png";

export default function SurveyListItem({ survey, onDeleteClick, analyticsData = [], isLoadingAnalytics }) {
   const [openSharePopup, setOpenSharePopup] = useState(false);
   const totalResponses = survey.answers_count ?? analyticsData.filter(item => String(item.survey_id ?? item.id) === String(survey.id)).reduce((sum, item) => sum + Number(item.answers || 0), 0);
   const expired = isSurveyExpired(survey.expire_date);
   const status = expired ? 'Expired' : survey.status ? 'Active' : 'Closed';
   return <article className="ace-survey-card">
      <div className="ace-survey-card-body"><div className="ace-survey-card-top"><img className="ace-survey-card-icon" src={survey.image_url || logo} alt="" loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = logo; }} /><span className={'ace-status ' + (survey.status && !expired ? 'active' : 'closed')}>{status}</span></div>
         <h3><Link to={'/surveys/' + survey.id}>{survey.title}</Link></h3><p className="line-clamp-2">{survey.description || 'A space to listen, learn, and understand.'}</p>
         <div className="ace-survey-card-meta"><span><strong>{isLoadingAnalytics ? '…' : totalResponses}</strong> responses</span><span>{survey.questions?.length || 0} questions</span></div>
      </div>
      <div className="ace-survey-card-footer"><Link className="ace-text-link" to={'/surveys/' + survey.id}>Open survey<ArrowUpRightIcon /></Link>
         <button className="ace-icon-button" title="Share survey" aria-label={'Share ' + survey.title} onClick={() => setOpenSharePopup(true)}><ShareIcon /></button>
         <Link className="ace-icon-button" title="View responses" aria-label={'Responses for ' + survey.title} to={'/surveys/' + survey.id + '/responses'}><ChartBarIcon /></Link>
         {survey.can_manage !== false && <button className="ace-icon-button danger" title="Delete survey" aria-label={'Delete ' + survey.title} onClick={() => onDeleteClick(survey.id)}><TrashIcon /></button>}
      </div>
      {openSharePopup && <ShareSurveyPopup openSharePopup={openSharePopup} setOpenSharePopup={setOpenSharePopup} shareLink={window.location.origin + '/survey/public/' + survey.slug} />}
   </article>;
}

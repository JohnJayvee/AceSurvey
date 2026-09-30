import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, ShareIcon, TrashIcon, ChartBarIcon, ClockIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ShareSurveyPopup from '@components/ShareSurveyPopup';
import { isSurveyExpired } from '@utils/dashboardUtils';

export default function SurveyListItem({ survey, onDeleteClick }) {
   const [openSharePopup, setOpenSharePopup] = useState(false);
   const [imageFailed, setImageFailed] = useState(false);
   const status = isSurveyExpired(survey.expire_date) ? 'Expired' : survey.status ? 'Active' : 'Closed';
   const expiration = survey.expire_date ? new Date(survey.expire_date + 'T00:00:00') : null;
   const date = expiration && !Number.isNaN(expiration.getTime()) ? expiration.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
   return <article className="library-card">
      <div className="library-card-body"><div className="library-card-top"><div className="library-card-icon">{survey.image_url && !imageFailed ? <img src={survey.image_url} alt="" loading="lazy" onError={() => setImageFailed(true)} /> : <ClipboardDocumentListIcon />}</div><span className={'library-badge ' + status.toLowerCase()}><i />{status}</span></div>
         <h3><Link to={'/surveys/' + survey.id}>{survey.title}</Link></h3><p className="library-description">{survey.description || 'A space to listen, learn, and understand what matters to your audience.'}</p>
         <div className="library-card-stats"><div><ChatBubbleLeftRightIcon /><strong>{survey.answers_count == null ? '—' : Number(survey.answers_count).toLocaleString()}</strong><span>responses</span></div><div><ClipboardDocumentListIcon /><strong>{survey.questions?.length || 0}</strong><span>questions</span></div></div>
         <div className="library-card-date"><ClockIcon /><span>{date ? `${status === 'Expired' ? 'Expired' : 'Closes'} ${date}` : 'No expiration date'}</span>{survey.can_manage === false && <span className="library-view-only">View only</span>}</div>
      </div>
      <footer className="library-card-footer"><Link to={'/surveys/' + survey.id}>Open survey<ArrowUpRightIcon /></Link><div><button type="button" title="Share survey" aria-label={'Share ' + survey.title} onClick={() => setOpenSharePopup(true)}><ShareIcon /></button><Link title="View responses" aria-label={'Responses for ' + survey.title} to={'/surveys/' + survey.id + '/responses'}><ChartBarIcon /></Link>{survey.can_manage !== false && <button type="button" className="library-delete" title="Delete survey" aria-label={'Delete ' + survey.title} onClick={() => onDeleteClick(survey.id)}><TrashIcon /></button>}</div></footer>
      {openSharePopup && <ShareSurveyPopup openSharePopup={openSharePopup} setOpenSharePopup={setOpenSharePopup} shareLink={window.location.origin + '/survey/public/' + survey.slug} />}
   </article>;
}
SurveyListItem.propTypes = { survey: PropTypes.object.isRequired, onDeleteClick: PropTypes.func.isRequired };

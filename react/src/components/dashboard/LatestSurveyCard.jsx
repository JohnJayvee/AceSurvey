import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { isSurveyExpired } from '@utils/dashboardUtils';

export default function LatestSurveyCard({ survey, onViewResponses }) {
   return <section className="ace-card ace-latest-survey"><div className="ace-card-heading"><div><h2>Your latest survey</h2><p>Pick up where you left off</p></div><ClipboardDocumentListIcon /></div>
      {survey ? <><div className="ace-latest-body"><span className={'ace-status ' + (survey.status && !isSurveyExpired(survey.expire_date) ? 'active' : 'closed')}>{isSurveyExpired(survey.expire_date) ? 'Expired' : survey.status ? 'Accepting responses' : 'Closed'}</span><h3>{survey.title}</h3><div className="ace-survey-numbers"><div><strong>{survey.questions || 0}</strong><span>questions</span></div><div><strong>{survey.answers || 0}</strong><span>responses</span></div></div></div><div className="ace-card-actions"><Link className="ace-button ace-button-secondary" to={'/surveys/' + survey.id}>Edit survey</Link><button className="ace-text-link" onClick={() => onViewResponses(survey.id)}>View responses<ArrowUpRightIcon /></button></div></> : <div className="ace-empty"><h3>Make room for new perspectives</h3><p>Your most recent survey will live here.</p><Link className="ace-text-link" to="/surveys/create">Create a survey →</Link></div>}
   </section>;
}
LatestSurveyCard.propTypes = {
   survey: PropTypes.object,
   onViewResponses: PropTypes.func,
};

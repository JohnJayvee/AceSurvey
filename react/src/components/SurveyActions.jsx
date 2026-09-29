import PropTypes from 'prop-types';
import { ShareIcon, EyeIcon, ChartBarIcon, TrashIcon } from '@heroicons/react/24/outline';
export default function SurveyActions({ survey, onOpenShare, onViewResponses, onDelete }) {
   if (!survey?.id) return null;
   return <nav className="builder-actions" aria-label="Survey actions">
      <button type="button" onClick={onOpenShare}><ShareIcon />Share survey</button>
      <button type="button" onClick={() => onViewResponses(survey.id)}><ChartBarIcon />Responses</button>
      <a href={'/survey/public/' + survey.slug} target="_blank" rel="noopener noreferrer"><EyeIcon />Preview</a>
      {survey.can_manage !== false && <button className="builder-delete" type="button" onClick={() => onDelete(survey.id)}><TrashIcon />Delete</button>}
   </nav>;
}
SurveyActions.propTypes = {
   survey: PropTypes.object,
   onOpenShare: PropTypes.func,
   onViewResponses: PropTypes.func,
   onDelete: PropTypes.func,
};

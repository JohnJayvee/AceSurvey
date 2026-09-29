import PropTypes from 'prop-types';
import { ClipboardDocumentListIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function DashboardStats({ totalSurveys = 0, totalAnswers = 0, loading = false }) {
   const stats = [
      { title: 'Total surveys', value: totalSurveys, caption: 'Questions that start conversations', icon: ClipboardDocumentListIcon },
      { title: 'Responses collected', value: totalAnswers, caption: 'Every perspective counts', icon: ChatBubbleLeftRightIcon },
   ];
   return <div className="ace-stat-grid">{stats.map(({ title, value, caption, icon: Icon }) =>
      <section className="ace-stat-card" key={title}><div className="ace-stat-top"><span>{title}</span><Icon /></div><strong>{loading ? '—' : Number(value).toLocaleString()}</strong><p>{caption}</p></section>
   )}</div>;
}
DashboardStats.propTypes = {
   totalSurveys: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
   totalAnswers: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
   loading: PropTypes.bool,
};

import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { useStateContext } from '@context/ContextProvider';
import { useDashboardData } from '@hooks/useDashboardData';
import LatestSurveyCard from '@components/dashboard/LatestSurveyCard';
import RatingDistributionChart from '@components/dashboard/RatingDistributionChart';
import SurveyAnalyticsChart from '@components/dashboard/SurveyAnalyticsChart';
import LatestResponsesList from '@components/dashboard/LatestResponsesList';
import DashboardSkeleton from '@components/dashboard/DashboardSkeleton';

function Ranking({ title, caption, surveys }) {
   const largest = Math.max(1, ...surveys.map(item => Number(item.answers_count ?? item.answers ?? 0)));
   return <section className="ace-card dashboard-ranking"><div className="ace-card-heading"><div><h2>{title}</h2><p>{caption}</p></div></div>
      {surveys.length ? <ol>{surveys.slice(0, 5).map((survey, index) => {
         const count = Number(survey.answers_count ?? survey.answers ?? 0);
         return <li key={survey.id}><span className="dashboard-rank">{String(index + 1).padStart(2, '0')}</span><Link to={'/surveys/' + survey.id + '/responses'}><span>{survey.title}</span><div className="dashboard-rank-track"><i style={{ width: count / largest * 100 + '%' }} /></div></Link><strong>{count.toLocaleString()}<small>responses</small></strong></li>;
      })}</ol> : <div className="ace-empty"><h3>No surveys yet</h3><p>Your survey rankings will appear here.</p></div>}
   </section>;
}
Ranking.propTypes = {
   title: PropTypes.string,
   caption: PropTypes.string,
   surveys: PropTypes.arrayOf(PropTypes.object),
};


export default function Dashboard() {
   const navigate = useNavigate();
   const { currentUser } = useStateContext();
   const { data, loading, error } = useDashboardData();
   if (loading) return <DashboardSkeleton />;
   if (error) return <div className="ace-empty" role="alert"><h2>We couldn&apos;t load your dashboard</h2><p>{error}</p><button className="ace-button" onClick={() => window.location.reload()}>Try again</button></div>;
   const ratings = data.ratingsData.reduce((sum, item) => sum + Number(item.value || 0), 0);
   const average = data.totalSurveys ? Math.round(data.totalAnswers / data.totalSurveys) : 0;
   const stats = [
      ['Your surveys', data.totalSurveys, 'Created in your workspace'],
      ['Total responses', data.totalAnswers, 'Every perspective counts'],
      ['Responses per survey', average, 'Average across your surveys'],
      ['Ratings collected', ratings, 'Individual rating answers'],
   ];
   return <div className="dashboard-redesign">
      <header className="dashboard-welcome"><div><span className="ace-eyebrow">YOUR PERSONAL WORKSPACE</span><h1>A little feedback.<br /><span>A clearer picture.</span></h1><p>Welcome back{currentUser.name ? ', ' + currentUser.name.split(' ')[0] : ''}. See what your community is sharing.</p><div className="dashboard-welcome-actions"><Link className="ace-button" to="/surveys/create"><PlusIcon />Create survey</Link><Link className="dashboard-browse" to="/surveys">Browse surveys<ArrowUpRightIcon /></Link></div></div><div className="dashboard-welcome-note"><span>ASK. LISTEN. IMPROVE.</span><strong>Good questions<br />make a difference.</strong><p>Your next insight starts with a conversation.</p><div className="dashboard-note-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></div></header>
      <div className="dashboard-metric-grid">{stats.map(([label, value, caption], index) => <section key={label} className={'dashboard-metric metric-' + index}><span>{label}</span><strong>{Number(value).toLocaleString()}</strong><small>{caption}</small></section>)}</div>
      <div className="dashboard-section-label"><h2>Your feedback, at a glance</h2><span>Activity and ratings across your surveys</span></div>
      <div className="dashboard-insights"><SurveyAnalyticsChart monthlyActivity={data.monthlyActivity} /><RatingDistributionChart data={data.ratingsData} /></div>
      <div className="dashboard-section-label"><h2>Pick up where you left off</h2><Link to="/surveys">View surveys<ArrowUpRightIcon /></Link></div>
      <div className="dashboard-recent"><LatestSurveyCard survey={data.latestSurvey} onViewResponses={id => navigate('/surveys/' + id + '/responses')} /><LatestResponsesList responses={data.latestAnswers} onViewDetail={(id, responseId) => navigate('/surveys/' + id + '/responses/' + responseId)} /></div>
      <div className="dashboard-section-label"><h2>How your surveys compare</h2><span>Ranked by response count</span></div>
      <div className="dashboard-rankings"><Ranking title="Most responses" caption="The conversations with the most participation" surveys={data.topSurveys} /><Ranking title="Room for more feedback" caption="Share these surveys to invite more perspectives" surveys={data.bottomSurveys} /></div>
   </div>;
}

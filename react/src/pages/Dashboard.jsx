import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { useStateContext } from "@context/ContextProvider";
import { useDashboardData } from "@hooks/useDashboardData";
import DashboardStats from "@components/dashboard/DashboardStats";
import SurveyPerformanceCharts from "@components/dashboard/SurveyPerformanceCharts";
import LatestSurveyCard from "@components/dashboard/LatestSurveyCard";
import RatingDistributionChart from "@components/dashboard/RatingDistributionChart";
import SurveyAnalyticsChart from "@components/dashboard/SurveyAnalyticsChart";
import LatestResponsesList from "@components/dashboard/LatestResponsesList";

export default function Dashboard() {
   const navigate = useNavigate();
   const { currentUser } = useStateContext();
   const { data, loading, error } = useDashboardData();
   return <div className="ace-dashboard">
      <div className="ace-page-heading"><div><span className="ace-eyebrow">YOUR WORKSPACE AT A GLANCE</span><h1>Welcome back{currentUser.name ? ', ' + currentUser.name.split(' ')[0] : ''}.</h1><p>Here’s what your community is telling you.</p></div><Link className="ace-button" to="/surveys/create"><PlusIcon />Create survey</Link></div>
      {error ? <div className="ace-empty" role="alert"><h2>We couldn’t load your overview</h2><p>{error}</p><button className="ace-button ace-button-secondary" onClick={() => window.location.reload()}>Try again</button></div> : <>
         <DashboardStats totalSurveys={data.totalSurveys} totalAnswers={data.totalAnswers} loading={loading} />
         {loading ? <div className="ace-dashboard-grid" aria-label="Loading dashboard" aria-busy="true"><div className="ace-skeleton" /><div className="ace-skeleton" /></div> : <>
            <div className="ace-dashboard-grid"><SurveyAnalyticsChart data={data.chartData} /><RatingDistributionChart data={data.ratingsData} /></div>
            <div className="ace-section-heading"><h2>Keep the conversation going</h2><Link to="/surveys">All surveys<ArrowUpRightIcon /></Link></div>
            <div className="ace-dashboard-grid"><LatestSurveyCard survey={data.latestSurvey} onViewResponses={id => navigate('/surveys/' + id + '/responses')} /><LatestResponsesList responses={data.latestAnswers} onViewDetail={(id, responseId) => navigate('/surveys/' + id + '/responses/' + responseId)} /></div>
            <div className="ace-section-heading"><h2>Survey performance</h2><span>Ranked by response count</span></div>
            <div className="ace-performance-grid"><SurveyPerformanceCharts topSurveys={data.topSurveys} bottomSurveys={data.bottomSurveys} /></div>
         </>}
      </>}
   </div>;
}

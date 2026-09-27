import { isSurveyExpired } from '@utils/dashboardUtils';

const dateLabel = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not available';

export default function ResponseOverview({ survey, responseCount, ratingsData }) {
   const total = ratingsData.reduce((sum, item) => sum + Number(item.value || 0), 0);
   const positive = ratingsData.filter(item => Number(item.rating) >= 4).reduce((sum, item) => sum + Number(item.value || 0), 0);
   const expired = isSurveyExpired(survey.expire_date);
   const status = expired ? 'Expired' : survey.status ? 'Accepting responses' : 'Closed';
   return <>
      <div className="response-metrics">
         <article><span>Total responses</span><strong>{Number(responseCount).toLocaleString()}</strong><small>Perspectives collected</small></article>
         <article><span>Questions</span><strong>{survey.questions?.length || 0}</strong><small>In this survey</small></article>
         <article><span>Positive ratings</span><strong>{total ? Math.round(positive / total * 100) + '%' : '—'}</strong><small>{total ? 'Satisfied or very satisfied' : 'No ratings yet'}</small></article>
         <article><span>Collection status</span><strong className="response-status">{status}</strong><small>{survey.expire_date ? 'Closes ' + dateLabel(survey.expire_date) : 'No expiration date'}</small></article>
      </div>
      <div className="response-overview">
         <section className="response-panel"><div className="response-panel-heading"><div><span className="ace-eyebrow">THE FEEDBACK PICTURE</span><h2>Rating breakdown</h2></div><span className="response-count">{total.toLocaleString()} ratings</span></div>
            {total ? <div className="response-bars">{ratingsData.map(item => {
               const percentage = total ? Number(item.value) / total * 100 : 0;
               return <div className="response-bar-row" key={item.rating}><span>{item.name}</span><div className="response-bar-track" aria-hidden="true"><div style={{ width: percentage + '%' }} /></div><strong>{Math.round(percentage)}%</strong><small>{item.value}</small></div>;
            })}</div> : <div className="response-empty">Ratings will appear here when respondents submit rating answers.</div>}
         </section>
         <section className="response-panel response-about"><span className="ace-eyebrow">SURVEY DETAILS</span><h2>About this survey</h2><p>{survey.description || 'No description provided.'}</p><dl><div><dt>Created</dt><dd>{dateLabel(survey.created_at)}</dd></div><div><dt>Last updated</dt><dd>{dateLabel(survey.updated_at)}</dd></div></dl></section>
      </div>
   </>;
}
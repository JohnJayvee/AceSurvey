import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
export default function LatestResponsesList({ responses = [], onViewDetail }) {
   return <section className="ace-card"><div className="ace-card-heading"><div><h2>Latest responses</h2><p>Fresh perspectives, all in one place</p></div><span className="ace-tag">Recent</span></div>
      {responses.length ? <div className="ace-response-list">{responses.slice(0, 5).map(response => <button key={response.id} onClick={() => onViewDetail(response.survey_id, response.id)}><span className="ace-response-icon">↗</span><span><strong>{response.survey?.title || 'Survey response'}</strong><small>{response.end_date ? new Date(response.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'} · Response #{response.id}</small></span><ArrowUpRightIcon /></button>)}</div> : <div className="ace-empty"><span className="ace-empty-symbol">↳</span><h3>You’re ready to listen</h3><p>Share a survey and your responses will appear here.</p></div>}
   </section>;
}

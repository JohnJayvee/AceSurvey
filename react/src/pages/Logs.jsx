import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowPathIcon, ClockIcon, FunnelIcon, ShieldCheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import axiosClient from '@api/axios';
import { useStateContext } from '@context/ContextProvider';
import '@css/logs.css';

const emptyFilters = { action: '', from: '', to: '' };
const levels = [['', 'All activity'], ['info', 'Information'], ['warning', 'Warnings'], ['error', 'Errors']];
const formatAction = action => (action || 'Application event').replaceAll('_', ' ');
const formatDate = value => {
   const date = new Date(value);
   return Number.isNaN(date.getTime()) ? ['Unknown date', ''] : [
      date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
   ];
};

export default function Logs() {
   const { currentUser } = useStateContext();
   const [page, setPage] = useState(1);
   const [level, setLevel] = useState('');
   const [draft, setDraft] = useState(emptyFilters);
   const [filters, setFilters] = useState(emptyFilters);
   const [revision, setRevision] = useState(0);
   const [result, setResult] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const filtered = Boolean(level || Object.values(filters).some(Boolean));
   const reset = () => { setLevel(''); setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); };

   useEffect(() => {
      if (!currentUser.is_admin) return;
      const controller = new AbortController();
      setLoading(true);
      setError('');
      axiosClient.get('/logs', { params: { page, level: level || undefined, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) }, signal: controller.signal, cache: false })
         .then(({ data }) => { if (!controller.signal.aborted) setResult(data); })
         .catch(error => { if (!controller.signal.aborted) setError(error.response?.status === 403 ? 'Admin access is required.' : 'Could not load activity. Please try again.'); })
         .finally(() => { if (!controller.signal.aborted) setLoading(false); });
      return () => controller.abort();
   }, [currentUser.is_admin, page, level, filters, revision]);

   if (!currentUser.id) return <p role="status">Loading your account…</p>;
   if (!currentUser.is_admin) return <Navigate to="/dashboard" replace />;
   const logs = result?.data || [];
   const count = loading || error ? '—' : (result?.total ?? logs.length).toLocaleString();

   return <section className="logs-page">
      <div className="ace-page-heading">
         <div><span className="ace-eyebrow">ADMINISTRATION</span><h1>Activity logs</h1><p>A clear view of what’s happening across your workspace.</p></div>
         <button className="ace-button ace-button-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}><ArrowPathIcon className={loading ? 'logs-spinning' : ''} />Refresh activity</button>
      </div>

      <div className="logs-overview">
         <div className="logs-overview-icon"><ShieldCheckIcon /></div>
         <div><h2>Your workspace activity trail</h2><p>Follow account activity, survey changes, and application events.</p></div>
         <div className="logs-total"><strong>{count}</strong><span>{filtered ? 'matching events' : 'recorded events'}</span></div>
      </div>

      <div className="logs-panel">
         <div className="logs-panel-heading"><div><h2>Event history</h2><p><ClockIcon />Newest events first · Times shown in your local timezone</p></div><span className="logs-admin-label">Admin access</span></div>
         <div className="logs-levels" role="group" aria-label="Filter by severity">
            {levels.map(([value, label]) => <button key={value} type="button" aria-pressed={level === value} onClick={() => { setLevel(value); setPage(1); }}><span className={'logs-dot ' + (value || 'all')} />{label}</button>)}
         </div>
         <form className="logs-filters" onSubmit={event => { event.preventDefault(); setFilters({ ...draft, action: draft.action.trim() }); setPage(1); }}>
            <div className="logs-action-filter"><label htmlFor="log-action">Event type</label><input id="log-action" value={draft.action} maxLength={255} placeholder="Exact action, e.g. login_success" onChange={event => setDraft({ ...draft, action: event.target.value })} /></div>
            <div><label htmlFor="log-from">From date</label><input id="log-from" type="date" value={draft.from} max={draft.to || undefined} onChange={event => setDraft({ ...draft, from: event.target.value })} /></div>
            <div><label htmlFor="log-to">To date</label><input id="log-to" type="date" value={draft.to} min={draft.from || undefined} onChange={event => setDraft({ ...draft, to: event.target.value })} /></div>
            <button type="submit" className="ace-button ace-button-secondary"><FunnelIcon />Apply filters</button>
            {(filtered || Object.values(draft).some(Boolean)) && <button type="button" className="logs-clear" onClick={reset}>Clear</button>}
         </form>
         <div aria-busy={loading}>
            {error ? <div className="logs-state" role="alert"><h3>Activity couldn’t be loaded</h3><p>{error}</p><button className="ace-button ace-button-secondary" onClick={() => setRevision(value => value + 1)}>Try again</button></div>
               : loading ? <div className="logs-state" role="status"><ArrowPathIcon className="logs-spinning" /><p>Loading activity…</p></div>
                  : !logs.length ? <div className="logs-state"><ClockIcon /><h3>{filtered ? 'No matching events' : 'No activity yet'}</h3><p>{filtered ? 'Try another severity, event type, or date range.' : 'Account and survey events will appear here as they happen.'}</p>{filtered && <button className="ace-button ace-button-secondary" onClick={reset}>Clear filters</button>}</div>
                     : <div className="logs-table-wrap"><table className="logs-table">
                        <caption className="sr-only">Application activity logs, newest first</caption>
                        <thead><tr><th scope="col">Event / details</th><th scope="col">Severity</th><th scope="col">User</th><th scope="col">Date & time</th></tr></thead>
                        <tbody>{logs.map(log => {
                           const [date, time] = formatDate(log.created_at);
                           const severity = ['info', 'warning', 'error'].includes(log.level) ? log.level : 'other';
                           return <tr key={log.id}>
                              <td className="logs-event"><strong>{formatAction(log.action)}</strong><p>{log.message}</p>
                                 <details><summary>View details <span>#{log.id}</span></summary><div className="logs-event-details"><dl><dt>Action</dt><dd>{log.action || '—'}</dd><dt>IP address</dt><dd>{log.ip_address || 'Not recorded'}</dd><dt>User agent</dt><dd>{log.user_agent || 'Not recorded'}</dd></dl>{log.context && Object.keys(log.context).length > 0 && <pre aria-label="Event context">{JSON.stringify(log.context, null, 2)}</pre>}</div></details>
                              </td>
                              <td><span className={'logs-badge ' + severity}><span className={'logs-dot ' + severity} />{log.level || 'Unknown'}</span></td>
                              <td><div className="logs-user"><span className="logs-avatar" aria-hidden="true">{log.user?.name?.slice(0, 1).toUpperCase() || 'S'}</span><div><strong>{log.user?.name || 'Guest / System'}</strong><span>{log.user?.email || 'Automated or unauthenticated event'}</span></div></div></td>
                              <td className="logs-date"><time dateTime={log.created_at}>{date}<span>{time}</span></time></td>
                           </tr>;
                        })}</tbody>
                     </table></div>}
         </div>
         {!loading && !error && <nav aria-label="Log pagination" className="logs-pagination">
            <p>{logs.length ? `Showing ${result?.from ?? 1}–${result?.to ?? logs.length} of ${result?.total ?? logs.length} events` : '0 events'}</p>
            <div><button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeftIcon /></button><span>Page {result?.current_page || 1} of {result?.last_page || 1}</span><button aria-label="Next page" disabled={page >= (result?.last_page || 1)} onClick={() => setPage(value => value + 1)}><ChevronRightIcon /></button></div>
         </nav>}
      </div>
   </section>;
}


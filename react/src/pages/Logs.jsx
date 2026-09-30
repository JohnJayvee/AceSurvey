import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowPathIcon, ClockIcon, FunnelIcon, CommandLineIcon, ChevronLeftIcon, ChevronRightIcon, SignalIcon, PauseIcon, ExclamationTriangleIcon, ExclamationCircleIcon, InformationCircleIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import axiosClient from '@api/axios';
import { useStateContext } from '@context/ContextProvider';
import '@css/logs.css';

const emptyFilters = { action: '', from: '', to: '' };
const levels = [['', 'All events'], ['info', 'Information'], ['warning', 'Warnings'], ['error', 'Errors']];
const severityLabel = { info: 'Information', warning: 'Warning', error: 'Error', other: 'Other' };
const formatAction = action => (action || 'Application event').replaceAll('_', ' ');
const formatDate = value => {
   const date = new Date(value);
   return !value || Number.isNaN(date.getTime()) ? ['Unknown date', '—'] : [
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
   const [autoRefresh, setAutoRefresh] = useState(true);
   const [visible, setVisible] = useState(() => !document.hidden);
   const [result, setResult] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [updatedAt, setUpdatedAt] = useState(null);
   const filtered = Boolean(level || Object.values(filters).some(Boolean));
   const polling = autoRefresh && page === 1 && visible;
   const reset = () => { setLevel(''); setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); };

   useEffect(() => {
      const sync = () => setVisible(!document.hidden);
      document.addEventListener('visibilitychange', sync);
      return () => document.removeEventListener('visibilitychange', sync);
   }, []);

   useEffect(() => {
      setResult(null);
      setUpdatedAt(null);
   }, [page, level, filters]);

   useEffect(() => {
      if (!currentUser.is_admin) return;
      const controller = new AbortController();
      const fetchLogs = async () => {
         setLoading(true);
         try {
            const { data } = await axiosClient.get('/logs', {
               params: { page, level: level || undefined, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) },
               signal: controller.signal, cache: false,
            });
            if (controller.signal.aborted) return;
            setResult(data);
            setUpdatedAt(new Date());
            setError('');
         } catch (error) {
            if (!controller.signal.aborted) setError(error.response?.status === 403 ? 'Admin access is required.' : 'Could not refresh events. Check your connection and try again.');
         } finally {
            if (!controller.signal.aborted) {
               setLoading(false);
            }
         }
      };
      fetchLogs();
      return () => controller.abort();
   }, [currentUser.is_admin, page, level, filters, revision]);

   useEffect(() => {
      if (!currentUser.is_admin || !polling || loading) return;
      const timer = setTimeout(() => setRevision(value => value + 1), 30000);
      return () => clearTimeout(timer);
   }, [currentUser.is_admin, polling, loading]);

   if (!currentUser.id) return <p role="status">Loading your account…</p>;
   if (!currentUser.is_admin) return <Navigate to="/dashboard" replace />;
   const logs = result?.data || [];
   const counts = logs.reduce((totals, log) => {
      totals[Object.hasOwn(totals, log.level) ? log.level : 'other']++;
      return totals;
   }, { info: 0, warning: 0, error: 0, other: 0 });
   const latestAlert = logs.find(log => ['warning', 'error'].includes(log.level));
   const summaryCards = [
      { label: filtered ? 'Matching events' : 'Recorded events', value: result?.total ?? logs.length, caption: 'Across all matching pages', tone: 'primary', Icon: RectangleStackIcon },
      { label: 'Information', value: counts.info, caption: 'Events on this page', tone: 'info', Icon: InformationCircleIcon },
      { label: 'Warnings', value: counts.warning, caption: 'Events on this page', tone: 'warning', Icon: ExclamationTriangleIcon },
      { label: 'Errors', value: counts.error, caption: 'Events on this page', tone: 'error', Icon: ExclamationCircleIcon },
   ];
   const status = error ? 'Refresh failed' : loading ? 'Syncing events' : polling ? 'Auto-refresh on' : 'Auto-refresh paused';

   return <section className="logs-page">
      <div className="ace-page-heading logs-heading">
         <div><span className="ace-eyebrow">WORKSPACE OBSERVABILITY</span><h1>Activity monitor<span className="logs-heading-tag">ADMIN</span></h1><p>Follow the events behind every sign-in, survey, and response.</p></div>
         <div className="logs-heading-actions">
            <button type="button" className="logs-live-toggle" aria-pressed={autoRefresh} onClick={() => setAutoRefresh(value => !value)}>{autoRefresh ? <PauseIcon /> : <SignalIcon />}{autoRefresh ? 'Pause auto-refresh' : 'Enable auto-refresh'}</button>
            <button className="ace-button" disabled={loading} onClick={() => setRevision(value => value + 1)}><ArrowPathIcon className={loading ? 'logs-spinning' : ''} />Refresh</button>
         </div>
      </div>

      <div className={'logs-sync-bar' + (error ? ' has-error' : '')}>
         <div role="status"><span className={'logs-status-dot ' + (error ? 'error' : polling ? 'active' : '')} /><strong>{status}</strong><span className="logs-sync-note">{page > 1 ? 'Return to page 1 for automatic updates' : polling ? 'Checks for new events every 30 seconds' : 'Refresh manually whenever you need'}</span></div>
         <span><ClockIcon />{updatedAt ? `Last synced ${updatedAt.toLocaleTimeString()}` : 'Waiting for first sync'}</span>
      </div>

      <div className="logs-summary-grid" aria-label="Event summary">
         {summaryCards.map(({ label, value, caption, tone, Icon }) => <article key={label} className={'logs-summary-card ' + tone}>
            <div className="logs-metric-heading"><span>{label}</span><Icon /></div><strong>{result ? Number(value).toLocaleString() : '—'}</strong><p>{caption}{error && result ? ' · Last synced data' : ''}</p>
         </article>)}
      </div>

      <div className="logs-insights">
         <article className="logs-distribution">
            <div className="logs-insight-heading"><h2>Severity overview</h2><span>Current page · {logs.length} events</span></div>
            <div className="logs-distribution-bar" aria-hidden="true">{result && logs.length ? Object.entries(counts).filter(([, count]) => count).map(([severity, count]) => <span key={severity} className={severity} style={{ width: `${count / logs.length * 100}%` }} />) : <span className="empty" />}</div>
            <div className="logs-distribution-legend">{Object.entries(counts).filter(([severity, count]) => severity !== 'other' || count).map(([severity, count]) => <span key={severity}><i className={'logs-dot ' + severity} />{severityLabel[severity]}<strong>{result ? count : '—'}</strong></span>)}</div>
         </article>
         <article className={'logs-latest-alert ' + (latestAlert?.level || '')}>
            <div className="logs-alert-icon"><ExclamationTriangleIcon /></div>
            <div><span className="logs-small-label">LATEST WARNING OR ERROR ON THIS PAGE</span><h2>{!result ? 'Waiting for events' : latestAlert ? formatAction(latestAlert.action) : 'No warnings or errors in this view'}</h2><p>{latestAlert ? latestAlert.message : 'Review the event stream below for the full activity trail.'}</p>{latestAlert && <span className="logs-alert-time">#{latestAlert.id} · {formatDate(latestAlert.created_at).join(' · ')}</span>}</div>
         </article>
      </div>

      <div className="logs-panel">
         <div className="logs-panel-heading"><div><h2><CommandLineIcon />Event stream<span className="logs-stream-count">{result ? (result.total ?? logs.length).toLocaleString() : '—'}</span></h2><p>Newest first · Times in your local timezone{error && result ? ' · Showing last synced data' : ''}</p></div><span className="logs-admin-label">{filtered ? 'Filtered view' : 'All workspace activity'}</span></div>
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
         {error && <div className="logs-error-banner" role="alert"><ExclamationCircleIcon /><span>{error}{result ? ' Displaying the last successful sync.' : ''}</span><button onClick={() => setRevision(value => value + 1)} disabled={loading}>Retry</button></div>}
         <div aria-busy={loading}>
            {!result ? <div className="logs-state" role="status">{loading ? <ArrowPathIcon className="logs-spinning" /> : <ExclamationCircleIcon />}<h3>{loading ? 'Connecting to your activity trail…' : 'Events unavailable'}</h3><p>{loading ? 'Fetching the latest workspace events.' : 'Use Retry to reconnect.'}</p></div>
               : !logs.length ? <div className="logs-state"><CommandLineIcon /><h3>{filtered ? 'No matching events' : 'Your event stream is quiet'}</h3><p>{filtered ? 'Try another severity, event type, or date range.' : 'Account and survey events will appear here as they happen.'}</p>{filtered && <button className="ace-button ace-button-secondary" onClick={reset}>Clear filters</button>}</div>
                  : <div className="logs-table-wrap" role="region" aria-label="Event stream table" tabIndex={0}><table className="logs-table">
                     <caption className="sr-only">Application activity logs, newest first</caption>
                     <thead><tr><th scope="col">Timestamp</th><th scope="col">Severity</th><th scope="col">Event / details</th><th scope="col">Actor</th></tr></thead>
                     <tbody>{logs.map(log => {
                        const [date, time] = formatDate(log.created_at);
                        const severity = ['info', 'warning', 'error'].includes(log.level) ? log.level : 'other';
                        return <tr key={log.id} className={'logs-row-' + severity}>
                           <td className="logs-date"><time dateTime={log.created_at}>{time}<span>{date}</span></time></td>
                           <td><span className={'logs-badge ' + severity}><span className={'logs-dot ' + severity} />{log.level || 'Unknown'}</span></td>
                           <td className="logs-event"><strong>{log.action || 'application_event'}</strong><p>{log.message}</p>
                              <details><summary>Inspect event <span>#{log.id}</span></summary><div className="logs-event-details"><dl><dt>Action</dt><dd>{log.action || '—'}</dd><dt>IP address</dt><dd>{log.ip_address || 'Not recorded'}</dd><dt>User agent</dt><dd>{log.user_agent || 'Not recorded'}</dd></dl>{log.context && Object.keys(log.context).length > 0 && <pre aria-label="Event context">{JSON.stringify(log.context, null, 2)}</pre>}</div></details>
                           </td>
                           <td><div className="logs-user"><span className="logs-avatar" aria-hidden="true">{log.user?.name?.slice(0, 1).toUpperCase() || 'S'}</span><div><strong>{log.user?.name || 'Guest / System'}</strong><span>{log.user?.email || 'Automated or unauthenticated'}</span></div></div></td>
                        </tr>;
                     })}</tbody>
                  </table></div>}
         </div>
         {result && <nav aria-label="Log pagination" className="logs-pagination">
            <p>{logs.length ? `Showing ${result.from ?? 1}–${result.to ?? logs.length} of ${result.total ?? logs.length} events` : '0 events'}</p>
            <div><button aria-label="Previous page" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeftIcon /></button><span>Page {result.current_page || 1} of {result.last_page || 1}</span><button aria-label="Next page" disabled={loading || page >= (result.last_page || 1)} onClick={() => setPage(value => value + 1)}><ChevronRightIcon /></button></div>
         </nav>}
      </div>
      <p className="logs-footnote"><SignalIcon />Event monitoring only · Severity totals describe this page, not overall application health.</p>
   </section>;
}

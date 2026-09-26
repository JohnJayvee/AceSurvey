import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosClient from '@api/axios';
import { useStateContext } from '@context/ContextProvider';

export default function Logs() {
   const { currentUser } = useStateContext();
   const [page, setPage] = useState(1);
   const [level, setLevel] = useState('');
   const [revision, setRevision] = useState(0);
   const [result, setResult] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   useEffect(() => {
      if (!currentUser.is_admin) return;
      const controller = new AbortController();
      setLoading(true);
      setError('');
      axiosClient.get('/logs', { params: { page, level: level || undefined }, signal: controller.signal, cache: false })
         .then(({ data }) => { if (!controller.signal.aborted) setResult(data); })
         .catch(error => { if (!controller.signal.aborted) setError(error.response?.status === 403 ? 'Admin access is required.' : 'Could not load logs. Please try again.'); })
         .finally(() => { if (!controller.signal.aborted) setLoading(false); });
      return () => controller.abort();
   }, [currentUser.is_admin, page, level, revision]);

   if (!currentUser.id) return <p role="status">Loading your account…</p>;
   if (!currentUser.is_admin) return <Navigate to="/dashboard" replace />;

   return <section>
      <div className="ace-page-heading"><div><span className="ace-eyebrow">ADMINISTRATION</span><h1>Activity logs</h1><p>Review account activity, survey changes, and application errors.</p></div><button className="ace-button ace-button-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh</button></div>
      <div className="flex items-center gap-3 mb-5"><label htmlFor="log-level">Severity</label><select id="log-level" className="p-2 bg-white border rounded-lg" value={level} onChange={event => { setLevel(event.target.value); setPage(1); }}><option value="">All levels</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option></select></div>
      {error ? <p role="alert" className="p-4 text-red-700 bg-red-50 rounded-lg">{error} <button className="underline" onClick={() => setRevision(value => value + 1)}>Retry</button></p> : loading ? <p role="status">Loading logs…</p> : <>
         <div className="overflow-x-auto bg-white border rounded-xl"><table className="w-full text-sm text-left"><caption className="sr-only">Application activity logs</caption><thead className="bg-gray-50"><tr>{['Time', 'Level', 'User', 'Activity'].map(label => <th key={label} scope="col" className="p-4">{label}</th>)}</tr></thead><tbody>{result?.data?.length ? result.data.map(log => <tr key={log.id} className="border-t"><td className="p-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td><td className="p-4">{log.level}</td><td className="p-4">{log.user?.name || 'Guest / System'}<span className="block text-xs text-gray-500">{log.user?.email}</span></td><td className="p-4 min-w-64"><strong>{log.action}</strong><p className="mt-1 break-words">{log.message}</p></td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-gray-500">No logs match this filter.</td></tr>}</tbody></table></div>
         <nav aria-label="Log pagination" className="flex items-center justify-between gap-3 mt-5"><button className="ace-button ace-button-secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {result?.current_page || 1} of {result?.last_page || 1}</span><button className="ace-button ace-button-secondary" disabled={page >= (result?.last_page || 1)} onClick={() => setPage(value => value + 1)}>Next</button></nav>
      </>}
   </section>;
}

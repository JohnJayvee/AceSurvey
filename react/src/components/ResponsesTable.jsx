import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

export default function ResponsesTable({ rows, searchQuery, onSearchChange, onViewDetail }) {
   const [page, setPage] = useState(1);
   const perPage = 10;
   const pages = Math.max(1, Math.ceil(rows.length / perPage));
   const current = Math.min(page, pages);
   useEffect(() => { setPage(1); }, [searchQuery]);
   const start = (current - 1) * perPage;
   return <section className="response-panel response-inbox">
      <div className="response-panel-heading"><div><h2>Response inbox <span className="response-count">{rows.length}</span></h2><p>Explore individual answers from your community.</p></div><label className="response-search"><MagnifyingGlassIcon /><span className="sr-only">Search responses</span><input type="search" placeholder="Search responses..." value={searchQuery} onChange={event => onSearchChange(event.target.value)} /></label></div>
      {rows.length ? <div className="response-table-wrap"><table><caption className="sr-only">Survey responses</caption><thead><tr><th scope="col">Response</th><th scope="col">Submitted</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.slice(start, start + perPage).map(row => <tr key={row.id}><td><div className="response-identity"><span className="response-avatar">#</span><div><strong title={String(row.answer || '')}>{row.answer || 'Anonymous response'}</strong><small>Response #{row.id}</small></div></div></td><td><span>{row.date}</span><small className="response-time">{row.time}</small></td><td><button className="response-view" onClick={() => onViewDetail(row.id)} aria-label={'View response ' + row.id}>View answers<ArrowUpRightIcon /></button></td></tr>)}</tbody></table></div> : <div className="response-empty"><h3>{searchQuery ? 'No matching responses' : 'Your first response starts here'}</h3><p>{searchQuery ? 'Try a different name or keyword.' : 'Share your survey to start collecting feedback.'}</p>{searchQuery && <button className="ace-text-link" onClick={() => onSearchChange('')}>Clear search</button>}</div>}
      {rows.length > 0 && <nav className="response-pagination" aria-label="Response pagination"><span>Showing {start + 1}–{Math.min(start + perPage, rows.length)} of {rows.length}</span><div><button disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button><span>{current} / {pages}</span><button disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button></div></nav>}
   </section>;
}
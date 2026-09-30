import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ClipboardDocumentListIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import SurveyListItem from '@components/SurveyListItem';

export default function SurveyGrid({ surveys, meta, filtered, onClearFilters, onDeleteClick, onPageClick, refreshing }) {
   const links = meta.links || [];
   const previous = links[0];
   const next = links[links.length - 1];
   return <div aria-busy={refreshing}>
      {surveys.length ? <div className="library-grid">{surveys.map(survey => <SurveyListItem key={survey.id} survey={survey} onDeleteClick={onDeleteClick} />)}</div> : <div className="library-empty"><div><ClipboardDocumentListIcon /></div><h3>{filtered ? 'No surveys in this view' : 'Your first question is waiting.'}</h3><p>{filtered ? 'Try another search or status. You can also browse another page below.' : 'Create your first survey and give your audience a place to be heard.'}</p>{filtered ? <button type="button" className="ace-button ace-button-secondary" onClick={onClearFilters}>Clear search and filters</button> : <Link className="ace-button" to="/surveys/create"><PlusIcon />Create your first survey</Link>}</div>}
      <nav className="library-pagination" aria-label="Survey pagination"><p>{meta.total ? `Page ${meta.current_page || 1} of ${meta.last_page || 1} · ${Number(meta.total).toLocaleString()} matching surveys` : `${surveys.length} surveys`}</p><div><button type="button" disabled={refreshing || !previous?.url || links.length < 3} onClick={() => onPageClick(previous)}><ChevronLeftIcon />Previous</button>{links.slice(1, -1).map((link, index) => <button type="button" key={index} className="library-page-number" aria-label={`Page ${link.label}`} aria-current={link.active ? 'page' : undefined} disabled={refreshing || !link.url || link.active} onClick={() => onPageClick(link)}>{/^\d+$/.test(link.label) ? link.label : '…'}</button>)}<button type="button" disabled={refreshing || !next?.url || links.length < 3} onClick={() => onPageClick(next)}>Next<ChevronRightIcon /></button></div></nav>
   </div>;
}
SurveyGrid.propTypes = { surveys: PropTypes.arrayOf(PropTypes.object).isRequired, meta: PropTypes.object.isRequired, filtered: PropTypes.bool, onClearFilters: PropTypes.func, onDeleteClick: PropTypes.func, onPageClick: PropTypes.func, refreshing: PropTypes.bool };

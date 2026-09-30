import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, ArrowPathIcon, MagnifyingGlassIcon, XMarkIcon, ClipboardDocumentListIcon, ArrowUpRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import SurveyGrid from '@components/SurveyGrid';
import DeleteModal from '@components/DeleteModal';
import { useSurveys } from '@hooks/useSurveys';
import { useDeleteModal } from '@hooks/useDeleteModal';
import { useStateContext } from '@context/ContextProvider';
import { isSurveyExpired } from '@utils/dashboardUtils';
import '@css/surveys.css';

const statusOf = survey => isSurveyExpired(survey.expire_date) ? 'expired' : survey.status ? 'active' : 'closed';

export default function Surveys() {
   const { currentUser } = useStateContext();
   const { surveys, meta, loading, error, searchTerm, refreshing, getSurveys, handleSearch, deleteSurvey, refresh } = useSurveys();
   const { isOpen, surveyToDelete, openModal, closeModal } = useDeleteModal();
   const [status, setStatus] = useState('all');
   const counts = surveys.reduce((result, survey) => { result[statusOf(survey)]++; return result; }, { active: 0, closed: 0, expired: 0 });
   const visibleSurveys = status === 'all' ? surveys : surveys.filter(survey => statusOf(survey) === status);
   const clearFilters = () => { handleSearch(''); setStatus('all'); };
   const confirmDelete = async () => {
      if (!surveyToDelete) return;
      closeModal();
      try { await deleteSurvey(surveyToDelete); } catch { /* The hook shows the failure toast. */ }
   };

   return <section className="survey-library">
      <header className="ace-page-heading library-heading">
         <div><span className="ace-eyebrow">YOUR FEEDBACK WORKSPACE</span><h1>{currentUser.is_admin ? 'All surveys' : 'Your surveys'}</h1><p>{currentUser.is_admin ? 'Every survey, every team, every perspective. Together in one place.' : 'Good questions start here. Create, share, and see what people think.'}</p></div>
         <Link to="/surveys/create" className="ace-button library-create"><PlusIcon />Create survey</Link>
      </header>

      <div className="library-intro">
         <div className="library-intro-copy"><span className="library-kicker">MAKE ROOM FOR A LITTLE CURIOSITY</span><h2>Your next insight{' '}<br />starts with a question.</h2><p>Build a survey, invite your audience, and turn their answers into a clearer picture.</p><Link to="/surveys/create">Start something new<ArrowUpRightIcon /></Link></div>
         <div className="library-intro-art" aria-hidden="true"><div className="library-orbit" /><div className="library-paper"><span>LET’S HEAR YOUR PERSPECTIVE</span><strong>How was your<br />experience?</strong><div className="library-rating"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i></div><div className="library-paper-line" /><div className="library-paper-line short" /><small>Every response makes a difference.</small></div><div className="library-art-tag"><span />A space for every voice</div></div>
         <div className="library-at-a-glance"><span>IN THIS COLLECTION</span><strong>{loading ? '—' : Number(meta.total ?? surveys.length).toLocaleString()}</strong><p>{searchTerm ? 'matching surveys' : 'surveys to explore'}</p><Link to="/survey-selection">Visit the public survey hub<ArrowUpRightIcon /></Link></div>
      </div>

      <div className="library-collection-heading"><div><h2>Survey collection</h2><span>Manage your questions. Follow the answers.</span></div><button type="button" className="library-refresh" disabled={loading || refreshing} onClick={refresh}><ArrowPathIcon className={refreshing ? 'library-spinning' : ''} />{refreshing ? 'Refreshing…' : 'Refresh surveys'}</button></div>
      <div className="library-toolbar">
         <div className="library-search"><MagnifyingGlassIcon aria-hidden="true" /><input type="search" aria-label="Search surveys" maxLength={255} placeholder="Search by survey title or description…" value={searchTerm} onChange={event => handleSearch(event.target.value)} />{searchTerm && <button type="button" aria-label="Clear search" onClick={() => handleSearch('')}><XMarkIcon /></button>}</div>
         <div className="library-status-filter"><span>Status on this page</span><div role="group" aria-label="Filter surveys on this page">{[['all', 'All'], ['active', 'Active'], ['closed', 'Closed'], ['expired', 'Expired']].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>{label}<span>{loading ? '—' : value === 'all' ? surveys.length : counts[value]}</span></button>)}</div></div>
      </div>
      <div className="library-results-note" role="status"><span>{loading ? 'Finding your surveys…' : `${visibleSurveys.length} ${visibleSurveys.length === 1 ? 'survey' : 'surveys'} on this page${searchTerm ? ` matching “${searchTerm}”` : ''}`}</span><span><ClipboardDocumentListIcon />{currentUser.is_admin ? 'Across all accounts' : 'Your collection'}</span></div>
      {error && <div className="library-error" role="alert"><ExclamationTriangleIcon /><span>{error}</span><button type="button" onClick={refresh} disabled={loading || refreshing}>Try again</button></div>}
      {loading ? <div className="library-grid" aria-label="Loading surveys" aria-busy="true">{[1,2,3,4,5,6].map(value => <div key={value} className="library-skeleton" aria-hidden="true"><div /><span /><span /><div /></div>)}</div> : error && !surveys.length ? null : <SurveyGrid surveys={visibleSurveys} meta={meta} filtered={Boolean(searchTerm || status !== 'all')} onClearFilters={clearFilters} onDeleteClick={openModal} onPageClick={link => getSurveys(link.url)} refreshing={refreshing} />}
      <DeleteModal isOpen={isOpen} onConfirm={confirmDelete} onCancel={closeModal} title="Delete survey?" message="This permanently deletes the survey and its responses. You cannot undo this action." />
   </section>;
}

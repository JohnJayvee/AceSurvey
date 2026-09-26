import { Link } from "react-router-dom";
import { MagnifyingGlassIcon, ArrowUpRightIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useSurveySelector } from "@/hooks/useSurveySelector";
import logo from "@images/AceLogo.png";

export default function SurveySelectionPage() {
   const { filteredSurveys, searchTerm, setSearchTerm, loading, error, refetch } = useSurveySelector();
   return <div className="ace-hub">
      <header className="ace-public-topbar"><Link className="ace-brand" to="/survey-selection"><img src={logo} alt="" /><span>AceSurvey</span></Link><Link className="ace-text-link" to="/login">Workspace login<ArrowUpRightIcon /></Link></header>
      <section className="ace-hub-header"><span className="ace-eyebrow">A SPACE FOR YOUR PERSPECTIVE</span><h1>Your voice makes a difference.</h1><p>Choose a survey below. Share what’s working, what could be better, and what matters to you.</p><div className="ace-hub-search"><MagnifyingGlassIcon /><input aria-label="Search surveys" type="search" placeholder="Find a survey…" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} /></div></section>
      {error ? <div className="ace-empty" role="alert"><h2>We couldn’t load the surveys</h2><p>{error}</p><button className="ace-button ace-button-secondary" onClick={refetch}>Try again</button></div> : loading ? <div className="ace-hub-grid" aria-busy="true">{[1,2,3].map(id => <div className="ace-skeleton" key={id} />)}</div> : filteredSurveys.length ? <div className="ace-hub-grid">{filteredSurveys.map(survey => <article className="ace-hub-card" key={survey.id ?? survey.link}><ClipboardDocumentListIcon /><h2>{survey.title}</h2><Link className="ace-text-link" to={new URL(survey.link, window.location.origin).pathname}>Start survey<ArrowUpRightIcon /></Link></article>)}</div> : <div className="ace-empty"><h3>{searchTerm ? 'No surveys match your search' : 'No surveys available just yet'}</h3><p>{searchTerm ? 'Try a different name or a shorter search.' : 'Check back soon for new ways to share your feedback.'}</p></div>}
      <footer className="ace-simple-footer">A few minutes of your time. A meaningful difference.</footer>
   </div>;
}

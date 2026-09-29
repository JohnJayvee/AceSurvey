import { Link } from 'react-router-dom';
import { ArrowRightIcon, ArrowUpRightIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useStateContext } from '@context/ContextProvider';
import logo from '@images/AceLogo.png';
import '../assets/css/not-found.css';

export default function NotFound() {
   const { userToken } = useStateContext();
   const workspaceLink = userToken ? '/dashboard' : '/login';

   return <div className="not-found-page">
      <header className="not-found-header">
         <Link className="ace-brand" to="/survey-selection" aria-label="AceSurvey home"><img src={logo} alt="" /><span>AceSurvey</span></Link>
         <Link className="not-found-workspace" to={workspaceLink}>{userToken ? 'Your workspace' : 'Workspace login'}<ArrowUpRightIcon aria-hidden="true" /></Link>
      </header>

      <main className="not-found-main">
         <div className="not-found-copy">
            <span className="not-found-label"><span />ERROR 404 · PAGE NOT FOUND</span>
            <h1>A little lost.<br /><span>Still in good company.</span></h1>
            <p>This page may have moved, or the link might be incomplete. Let’s get you back to a place where your voice belongs.</p>
            <div className="not-found-actions">
               <Link className="ace-button" to="/survey-selection">Explore surveys<ArrowRightIcon aria-hidden="true" /></Link>
               <Link className="ace-button ace-button-secondary" to={workspaceLink}>{userToken ? 'Go to dashboard' : 'Sign in'}</Link>
            </div>
            <div className="not-found-tip"><span>Following a survey link?</span><p>Check that you copied the full address, or ask the sender for a fresh link.</p></div>
         </div>

         <div className="not-found-art" aria-hidden="true">
            <div className="not-found-orbit" />
            <span className="not-found-number">404</span>
            <div className="not-found-paper not-found-paper-back" />
            <div className="not-found-paper">
               <div className="not-found-paper-brand"><img src={logo} alt="" /><span>A little perspective</span><span className="not-found-paper-dot" /></div>
               <div className="not-found-paper-title">Every answer starts<br />with a question.</div>
               <div className="not-found-paper-line" />
               <div className="not-found-paper-line short" />
               <div className="not-found-choice"><span><CheckIcon /></span><i /></div>
               <div className="not-found-choice"><span /><i /></div>
               <div className="not-found-choice"><span /><i /></div>
               <div className="not-found-paper-foot"><span>AceSurvey</span><span>01 / 03</span></div>
            </div>
            <div className="not-found-search"><MagnifyingGlassIcon /></div>
            <div className="not-found-note"><span />A new direction awaits</div>
            <span className="not-found-spark">+</span>
         </div>
      </main>

      <footer className="not-found-footer"><span>© {new Date().getFullYear()} AceSurvey</span><span>Thoughtful questions. Meaningful answers.</span></footer>
   </div>;
}

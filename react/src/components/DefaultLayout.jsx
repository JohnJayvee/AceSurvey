
import { useEffect, useState, useRef } from "react";
import { Navigate, NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useStateContext } from "@context/ContextProvider";
import axiosClient from "@api/axios";
import WelcomeTour from "./WelcomeTour";
import Toast from "@components/Toast";
import UserProfilePopup from "@components/UserProfilePopup";
import { HomeIcon, ClipboardDocumentListIcon, Bars3Icon, XMarkIcon, PlusIcon, ArrowUpRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import logo from "@images/AceLogo.png";

export default function DefaultLayout() {
   const { currentUser, userToken, setCurrentUser, setUserToken, showToast } = useStateContext();
   const [menuOpen, setMenuOpen] = useState(false);
   const [profileOpen, setProfileOpen] = useState(false);
   const profile = useRef(null);
   const location = useLocation();

   useEffect(() => {
      if (!userToken) return;
      const controller = new AbortController();
      axiosClient.get('/me', { signal: controller.signal }).then(({ data }) => {
         if (!controller.signal.aborted) setCurrentUser(data);
      }).catch(() => {});
      return () => controller.abort();
   }, [userToken, setCurrentUser]);

   useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [location.pathname]);
   useEffect(() => {
      const close = event => {
         if (event.type === 'keydown') {
            if (event.key === 'Escape') { setMenuOpen(false); setProfileOpen(false); }
         } else if (profile.current && !profile.current.contains(event.target)) setProfileOpen(false);
      };
      document.addEventListener('pointerdown', close);
      document.addEventListener('keydown', close);
      return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
   }, []);

   const onLogout = async event => {
      event.preventDefault();
      try {
         await axiosClient.post('/logout');
         setUserToken(null);
      } catch {
         showToast('Could not sign out. Please try again.', 'error');
      }
   };

   if (!userToken) return <Navigate to="/login" replace />;
   const page = location.pathname === '/profile' ? 'Profile' : location.pathname === '/settings' ? 'Settings' : location.pathname === '/users' ? 'Users' : location.pathname === '/logs' ? 'Activity logs' : location.pathname.includes('/responses') ? 'Responses' : location.pathname.includes('/surveys') ? 'Surveys' : 'Overview';
   return (
      <div className="ace-workspace">
         <a className="ace-skip" href="#main-content">Skip to content</a>
         {menuOpen && <button className="ace-nav-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
         <aside className={'ace-sidebar ' + (menuOpen ? 'is-open' : '')} aria-label="Main navigation">
            <Link className="ace-brand" to="/dashboard"><img src={logo} alt="" /><span>AceSurvey<span className="ace-brand-caption">FEEDBACK WORKSPACE</span></span></Link>
            <button className="ace-mobile-close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><XMarkIcon /></button>
            <div className="ace-nav-label">WORKSPACE</div>
            <nav className="ace-nav">
               <NavLink data-tour="overview" to="/dashboard"><HomeIcon />Overview</NavLink>
               <NavLink data-tour="surveys" to="/surveys"><ClipboardDocumentListIcon />Surveys</NavLink>

               {currentUser.is_admin && <NavLink to="/logs"><ClipboardDocumentListIcon />Activity logs</NavLink>}
               {currentUser.is_admin && <NavLink to="/users"><ClipboardDocumentListIcon />Users</NavLink>}
            </nav>
            <Link data-tour="create" className="ace-sidebar-create" to="/surveys/create"><PlusIcon />Create a survey</Link>
            <div className="ace-sidebar-bottom">
               <div className="ace-sidebar-note"><span className="ace-small-orbit" />Every response<br /><strong>starts a conversation.</strong><p>Listen closely. Make better decisions.</p></div>
               <Link to="/survey-selection" className="ace-public-link">Open survey hub<ArrowUpRightIcon /></Link>
               <div className="ace-sidebar-foot">AceSurvey · Your feedback, in focus</div>
            </div>
         </aside>
         <div className="ace-main">
            <header className="ace-topbar">
               <div className="ace-topbar-left"><button className="ace-mobile-toggle" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Bars3Icon /></button><span className="ace-breadcrumb">Workspace <span>/</span> <strong>{page}</strong></span></div>
               <div className="ace-profile-wrap" ref={profile}>
                  <button data-tour="account" className="ace-profile-button" aria-expanded={profileOpen} aria-label="Account settings" onClick={() => setProfileOpen(!profileOpen)}>
                     <span className="ace-avatar">{(currentUser.name || 'A').slice(0, 1).toUpperCase()}</span>
                     <span className="ace-profile-name">{currentUser.name || 'Your account'}<small>Personal workspace</small></span><ChevronDownIcon />
                  </button>
                  {profileOpen && <div className="ace-profile-panel"><UserProfilePopup onLogout={onLogout} /></div>}
               </div>
            </header>
            <main id="main-content" className="ace-page-content"><Outlet /></main>
            <footer className="ace-workspace-footer"><span>© {new Date().getFullYear()} AceSurvey</span><span>Thoughtful questions. Meaningful answers.</span></footer>
         </div>
         <WelcomeTour />
         <Toast />
      </div>
   );
}

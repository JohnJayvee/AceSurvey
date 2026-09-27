import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useStateContext } from "@context/ContextProvider";
import logo from "@images/AceLogo.png";

export default function GuestLayout() {
   const { userToken } = useStateContext();
   const { pathname } = useLocation();
   const isPublic = ['/survey-selection', '/qr'].includes(pathname);
   if (isPublic) return <Outlet />;
   if (userToken) return <Navigate to="/dashboard" replace />;
   if (pathname === "/forgot-password") return <Outlet />;
   return (
      <div className="ace-auth">
         <section className="ace-auth-story">
            <Link to="/survey-selection" className="ace-brand"><img src={logo} alt="" /><span>AceSurvey</span></Link>
            <div className="ace-auth-story-content"><span className="ace-eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</span><h1>Better questions.<br /><span>Brighter ideas.</span></h1><p>Give people a voice. Turn their feedback into a clearer picture of what comes next.</p>
               <div className="ace-feedback-illustration" aria-hidden="true"><div className="ace-illustration-label"><span className="ace-small-orbit" />A moment to be heard</div><h3>How was your experience?</h3><div className="ace-illustration-ratings"><span>1</span><span>2</span><span>3</span><span>4</span><span className="selected">5 ✓</span></div><div className="ace-illustration-line" /><div className="ace-illustration-line short" /></div>
            </div>
            <p className="ace-auth-copyright">Built for listening. Designed for people.</p>
         </section>
         <section className="ace-auth-form"><Outlet /></section>
      </div>
   );
}

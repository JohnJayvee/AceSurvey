import { useLayoutEffect, useState } from 'react';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import { useStateContext } from '@context/ContextProvider';

const steps = [
   { target: 'overview', title: 'Welcome to AceSurvey', text: 'Overview shows your survey activity, responses, and ratings. On a small screen, open the navigation menu to find your workspace pages.' },
   { target: 'create', title: 'Create your first survey', text: 'Choose Create a survey in the navigation menu to add questions and publish your survey.' },
   { target: 'surveys', title: 'Manage surveys and responses', text: 'Open Surveys to edit your surveys, share their links, and review responses.' },
   { target: 'account', title: 'Make it yours', text: 'Open your account menu to update your profile, change your appearance settings, or sign out.' },
];

export default function WelcomeTour() {
   const { welcomeTourOpen, setWelcomeTourOpen } = useStateContext();
   const [step, setStep] = useState(0);
   const [anchor, setAnchor] = useState(null);
   const current = steps[step];

   useLayoutEffect(() => {
      if (!welcomeTourOpen) { setStep(0); setAnchor(null); return; }
      const position = () => {
         const target = document.querySelector(`[data-tour="${current.target}"]`);
         const rect = target?.getBoundingClientRect();
         // Collapsed mobile navigation is offscreen; anchor its tips to the menu button.
         setAnchor(rect && rect.right > 0 && rect.left >= 0 && rect.width > 0
            ? target : document.querySelector('.ace-mobile-toggle'));
      };
      position();
      window.addEventListener('resize', position);
      return () => window.removeEventListener('resize', position);
   }, [welcomeTourOpen, current.target]);

   const close = () => setWelcomeTourOpen(false);
   return <Popover
      open={welcomeTourOpen && Boolean(anchor)}
      anchorEl={anchor}
      onClose={close}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{ paper: { role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'welcome-tour-title', 'aria-describedby': 'welcome-tour-description', sx: { p: 3, mt: 1, width: 340, maxWidth: 'calc(100vw - 32px)' } } }}
   >
      <p className="text-xs text-gray-500">Getting started · {step + 1} of {steps.length}</p>
      <h2 id="welcome-tour-title" className="mt-2 text-lg font-semibold">{current.title}</h2>
      <p id="welcome-tour-description" aria-live="polite" className="mt-2 text-sm text-gray-600">{current.text}</p>
      <div className="flex items-center justify-between gap-2 mt-5">
         <Button onClick={close} color="inherit">Skip tour</Button>
         <div className="flex gap-2">
            {step > 0 && <Button onClick={() => setStep(step - 1)} color="inherit">Back</Button>}
            <Button autoFocus variant="contained" onClick={() => step === steps.length - 1 ? close() : setStep(step + 1)}>{step === steps.length - 1 ? 'Done' : 'Next'}</Button>
         </div>
      </div>
   </Popover>;
}

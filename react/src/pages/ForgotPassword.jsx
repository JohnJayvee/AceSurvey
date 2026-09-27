import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, EnvelopeIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axiosClient from '@api/axios';
import logo from '@images/AceLogo.png';

export default function ForgotPassword() {
   const [email, setEmail] = useState('');
   const [step, setStep] = useState('email');
   const [account, setAccount] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const pending = useRef(false);
   const submit = async event => {
      event.preventDefault();
      if (pending.current) return;
      pending.current = true;
      setLoading(true);
      setError('');
      try {
         if (step === 'email') {
            const address = email.trim();
            const { data } = await axiosClient.post('/verify-email-exists', { email: address });
            if (!data.accountInfo) throw new Error('Could not load account information. Please try again.');
            setEmail(address);
            setAccount(data.accountInfo);
            setStep('confirm');
         } else {
            await axiosClient.post('/forgot-password', { email });
            setStep('sent');
         }
      } catch (error) {
         setError(Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.response?.data?.error || (error.response?.status === 429 ? 'Too many attempts. Please wait before trying again.' : 'We could not complete your request. Please try again.'));
      } finally {
         pending.current = false;
         setLoading(false);
      }
   };
   const changeEmail = () => { setStep('email'); setAccount(null); setError(''); };
   const Icon = step === 'sent' ? CheckCircleIcon : step === 'confirm' ? EnvelopeIcon : KeyIcon;
   return <main className="recovery-shell">
      <header className="recovery-shell-header"><Link className="recovery-brand" to="/login"><img src={logo} alt="" /><span>AceSurvey<span>YOUR FEEDBACK WORKSPACE</span></span></Link><Link className="recovery-back" to="/login"><ArrowLeftIcon />Back to login</Link></header>
      <div className="recovery-layout">
         <aside className="recovery-story"><span className="ace-eyebrow">A FRESH START</span><h2>Good to have<br />you back.</h2><p>Your surveys, responses, and ideas are waiting right where you left them.</p><div className="recovery-art" aria-hidden="true"><div><KeyIcon /></div><span /><span /><span /></div><div className="recovery-story-note"><CheckCircleIcon /><span>A new password.<br /><strong>The same meaningful conversations.</strong></span></div></aside>
         <section className="recovery-page" aria-labelledby="recovery-title">
      <div className="recovery-symbol"><Icon /></div>
      <span className="ace-eyebrow">{step === 'sent' ? 'YOU ARE ONE STEP CLOSER' : 'LET’S GET YOU BACK IN'}</span>
      <h1 id="recovery-title">{step === 'sent' ? 'Check your inbox.' : step === 'confirm' ? 'Is this your account?' : 'Forgot your password?'}</h1>
      <p className="recovery-description">{step === 'sent' ? 'Your reset link is on its way. Follow the instructions in the email to choose a new password.' : step === 'confirm' ? 'Confirm the details below and we will send a password reset link to your email.' : 'It happens. Enter your email address and we’ll help you get back to your surveys.'}</p>
      <ol className="recovery-steps" aria-label="Password recovery steps">{[['email', 'Find account'], ['confirm', 'Confirm'], ['sent', 'Check email']].map(([value, label], index) => <li key={value} aria-current={step === value ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
      {error && <p className="recovery-error" role="alert">{error}</p>}
      {step === 'sent' ? <div role="status">
         <div className="recovery-email-card"><EnvelopeIcon /><div><span>Reset link sent to</span><strong>{email}</strong></div></div>
         <p className="recovery-help">Can’t find the message? Check your spam or junk folder. If it takes a few minutes to arrive, keep this page open.</p>
         <Link to="/login" className="ace-button recovery-primary">Return to login<ArrowRightIcon /></Link>
         <button type="button" className="recovery-secondary" onClick={changeEmail}>Use a different email</button>
      </div> : <form onSubmit={submit} aria-busy={loading}>
         {step === 'email' ? <div className="recovery-field"><label htmlFor="recovery-email">Email address</label><div><EnvelopeIcon /><input id="recovery-email" type="email" required autoComplete="email" maxLength={191} placeholder="you@example.com" value={email} disabled={loading} onChange={event => setEmail(event.target.value)} /></div></div> : <div className="recovery-email-card"><span className="recovery-avatar">{(account?.name || 'A').slice(0,1).toUpperCase()}</span><div><strong>{account?.name || 'Your account'}</strong><span>{email}</span></div></div>}
         <button className="ace-button recovery-primary" type="submit" disabled={loading}>{loading ? step === 'email' ? 'Finding your account...' : 'Sending reset link...' : step === 'email' ? 'Find my account' : 'Send reset link'}{!loading && <ArrowRightIcon />}</button>
         {step === 'confirm' && <button type="button" className="recovery-secondary" disabled={loading} onClick={changeEmail}>Use a different email</button>}
      </form>}
      <p className="recovery-footer">A fresh start. Your feedback workspace is waiting.</p>
         </section>
      </div>
      <footer className="recovery-shell-footer">AceSurvey · Thoughtful questions. Meaningful answers.</footer>
   </main>;
}
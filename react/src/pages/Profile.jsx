import { useEffect, useState } from 'react';
import axiosClient from '@api/axios';
import { useStateContext } from '@context/ContextProvider';

const blankPassword = { current_password: '', new_password: '', new_password_confirmation: '' };
export default function Profile() {
   const { setCurrentUser, showToast } = useStateContext();
   const [form, setForm] = useState({ name: '', username: '', email: '', current_password: '' });
   const [password, setPassword] = useState(blankPassword);
   const [loading, setLoading] = useState(true);
   const [loadError, setLoadError] = useState('');
   const [revision, setRevision] = useState(0);
   const [saving, setSaving] = useState(false);
   const [changing, setChanging] = useState(false);
   const [error, setError] = useState('');
   const [passwordError, setPasswordError] = useState('');
   useEffect(() => {
      const controller = new AbortController();
      setLoading(true); setLoadError('');
      axiosClient.get('/profile', { signal: controller.signal, cache: false }).then(({ data }) => {
         if (!controller.signal.aborted) setForm({ name: data.name, username: data.username, email: data.email, current_password: '' });
      }).catch(() => { if (!controller.signal.aborted) setLoadError('Could not load your profile. Please try again.'); })
         .finally(() => { if (!controller.signal.aborted) setLoading(false); });
      return () => controller.abort();
   }, [revision]);
   const errorText = error => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.error || error.response?.data?.message || 'Could not save changes. Please try again.';
   const save = async event => {
      event.preventDefault();
      if (saving) return;
      setSaving(true); setError('');
      try {
         const { data } = await axiosClient.put('/profile', form);
         setCurrentUser(previous => ({ ...previous, ...data }));
         setForm(previous => ({ ...previous, current_password: '' }));
         showToast('Profile saved successfully.', 'success');
      } catch (error) { setError(errorText(error)); }
      finally { setSaving(false); }
   };
   const changePassword = async event => {
      event.preventDefault();
      if (changing) return;
      setChanging(true); setPasswordError('');
      try {
         await axiosClient.post('/change-password', password);
         setPassword({ ...blankPassword });
         showToast('Password changed successfully.', 'success');
      } catch (error) { setPasswordError(errorText(error)); }
      finally { setChanging(false); }
   };
   return <section className="max-w-4xl">
      <div className="ace-page-heading"><div><span className="ace-eyebrow">YOUR ACCOUNT</span><h1>Profile</h1><p>Manage your personal information and account security.</p></div></div>
      {loading ? <p role="status">Loading your profile...</p> : loadError ? <div role="alert">{loadError} <button className="ace-button ace-button-secondary" onClick={() => setRevision(value => value + 1)}>Retry</button></div> : <div className="space-y-6">
         <form className="response-panel profile-edit-form" onSubmit={save}><h2>Personal information</h2><p>Keep your name and contact details up to date.</p><fieldset disabled={saving}><div className="profile-fields">
            {[['name', 'Full name', 'text'], ['username', 'Username', 'text'], ['email', 'Email address', 'email'], ['current_password', 'Current password', 'password']].map(([name, label, type]) => <div key={name}><label htmlFor={'profile-' + name}>{label}</label><input id={'profile-' + name} type={type} required={name !== 'current_password'} autoComplete={name === 'current_password' ? 'current-password' : name} maxLength={name === 'name' || name === 'current_password' ? 255 : 191} value={form[name]} onChange={event => setForm(previous => ({ ...previous, [name]: event.target.value }))} /></div>)}
         </div><p className="profile-hint">Your current password is required only when changing your username or email.</p>{error && <p role="alert" className="text-red-700">{error}</p>}<button className="ace-button" type="submit">{saving ? 'Saving...' : 'Save profile'}</button></fieldset></form>
         <form className="response-panel profile-edit-form" onSubmit={changePassword}><h2>Change password</h2><p>Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.</p><fieldset disabled={changing}><div className="profile-fields">
            {[['current_password', 'Current password'], ['new_password', 'New password'], ['new_password_confirmation', 'Confirm new password']].map(([name, label]) => <div key={name}><label htmlFor={'security-' + name}>{label}</label><input id={'security-' + name} type="password" required minLength={name === 'current_password' ? undefined : 8} maxLength={255} autoComplete={name === 'current_password' ? 'current-password' : 'new-password'} value={password[name]} onChange={event => setPassword(previous => ({ ...previous, [name]: event.target.value }))} /></div>)}
         </div>{passwordError && <p role="alert" className="text-red-700">{passwordError}</p>}<button className="ace-button" type="submit">{changing ? 'Updating...' : 'Update password'}</button></fieldset></form>
      </div>}
   </section>;
}
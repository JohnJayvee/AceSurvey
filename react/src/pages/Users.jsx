import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosClient from '@api/axios';
import { useStateContext } from '@context/ContextProvider';

const emptyForm = { name: '', username: '', email: '', password: '', password_confirmation: '', role: 'user', is_active: true };
const fields = [
   ['name', 'Full name', 'text', 'name'],
   ['username', 'Username', 'text', 'off'],
   ['email', 'Email', 'email', 'off'],
   ['password', 'Password', 'password', 'new-password'],
   ['password_confirmation', 'Confirm password', 'password', 'new-password'],
];

export default function Users() {
   const { currentUser, setCurrentUser, setUserToken } = useStateContext();
   const [editingId, setEditingId] = useState(null);
   const formRef = useRef(null);
   const [form, setForm] = useState(emptyForm);
   const [errors, setErrors] = useState({});
   const [message, setMessage] = useState('');
   const [saving, setSaving] = useState(false);
   const submitting = useRef(false);
   const [page, setPage] = useState(1);
   const [revision, setRevision] = useState(0);
   const [result, setResult] = useState(null);
   const [loading, setLoading] = useState(true);
   const [listError, setListError] = useState('');

   const editAccount = user => {
      setEditingId(user.id);
      setForm({ ...emptyForm, name: user.name, username: user.username, email: user.email, role: user.is_admin ? 'admin' : 'user', is_active: user.is_active });
      setErrors({});
      setMessage('');
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('account-name')?.focus({ preventScroll: true });
   };
   const cancelEdit = () => {
      setEditingId(null);
      setForm({ ...emptyForm });
      setErrors({});
      setMessage('');
   };

   useEffect(() => {
      if (!currentUser.is_admin) return;
      const controller = new AbortController();
      setLoading(true);
      setListError('');
      axiosClient.get('/admin/users', { params: { page }, signal: controller.signal, cache: false })
         .then(({ data }) => { if (!controller.signal.aborted) setResult(data); })
         .catch(() => { if (!controller.signal.aborted) setListError('Could not load accounts. Please retry.'); })
         .finally(() => { if (!controller.signal.aborted) setLoading(false); });
      return () => controller.abort();
   }, [currentUser.is_admin, page, revision]);

   const createAccount = async event => {
      event.preventDefault();
      if (submitting.current) return;
      submitting.current = true;
      setSaving(true);
      setErrors({});
      setMessage('');
      try {
         const { data } = editingId
            ? await axiosClient.put(`/admin/users/${editingId}`, form)
            : await axiosClient.post('/admin/users', form);
         if (editingId === currentUser.id) {
            setCurrentUser({ ...currentUser, ...data.data });
            if (form.password || form.email !== currentUser.email) setUserToken(null);
         }
         setMessage(`Account ${editingId ? 'updated' : 'created'} for ${data.data.name}.`);
         setEditingId(null);
         setForm({ ...emptyForm });
         setPage(1);
         setRevision(value => value + 1);
      } catch (error) {
         setErrors(error.response?.data?.errors || { form: [error.response?.data?.message || 'Could not create the account. Please try again.'] });
      } finally {
         submitting.current = false;
         setSaving(false);
      }
   };

   if (!currentUser.id) return <p role="status">Loading your account...</p>;
   if (!currentUser.is_admin) return <Navigate to="/dashboard" replace />;

   return <section>
      <div className="ace-page-heading"><div><span className="ace-eyebrow">ADMINISTRATION</span><h1>Users</h1><p>Manage accounts, roles, passwords, and sign-in access.</p></div></div>
      <form ref={formRef} onSubmit={createAccount} className="p-5 mb-8 space-y-5 bg-white border rounded-xl">
         <h2 className="text-lg font-semibold">{editingId ? 'Edit account' : 'Create an account'}</h2>
         {message && <p role="status" className="p-3 text-teal-800 bg-teal-50 rounded-lg">{message}</p>}
         {errors.form && <p role="alert" className="text-red-700">{errors.form.join(' ')}</p>}
         <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            {fields.map(([name, label, type, autoComplete]) => <div key={name}>
               <label htmlFor={`account-${name}`} className="block mb-1 text-sm font-medium">{label}</label>
               <input id={`account-${name}`} name={name} type={type} autoComplete={autoComplete} required={type !== 'password' || !editingId || Boolean(form.password)} maxLength={name === 'username' || name === 'email' ? 191 : 255} minLength={type === 'password' ? 8 : undefined} value={form[name]} onChange={event => setForm(value => ({ ...value, [name]: event.target.value }))} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : type === 'password' ? 'account-password-help' : undefined} className="w-full p-3 border rounded-lg" />
               {errors[name] && <p id={`error-${name}`} role="alert" className="mt-1 text-sm text-red-700">{errors[name].join(' ')}</p>}
            </div>)}
            <div><label htmlFor="account-role" className="block mb-1 text-sm font-medium">Role</label><select id="account-role" value={form.role} onChange={event => setForm(value => ({ ...value, role: event.target.value }))} className="w-full p-3 border rounded-lg"><option value="user">User</option><option value="admin">Admin</option></select><p className="mt-2 text-sm text-gray-500">{form.role === 'admin' ? 'Admins can view all surveys, activity logs, and create accounts.' : 'Users manage their own surveys.'}</p>{errors.role && <p role="alert" className="text-sm text-red-700">{errors.role.join(' ')}</p>}</div>
            {editingId && <div><label htmlFor="account-status" className="block mb-1 text-sm font-medium">Account status</label><select id="account-status" className="w-full p-3 border rounded-lg" value={form.is_active ? 'active' : 'disabled'} onChange={event => setForm(value => ({ ...value, is_active: event.target.value === 'active' }))}><option value="active">Active</option><option value="disabled">Disabled</option></select><p className="mt-2 text-sm text-gray-500">Disabled accounts cannot sign in. Existing sessions will be ended.</p>{errors.is_active && <p role="alert" className="text-red-700">{errors.is_active.join(' ')}</p>}</div>}
         </fieldset>
         {editingId && <p className="text-sm text-gray-500">Leave both password fields blank to keep the current password. Changing a password or email signs that account out.</p>}
         <p id="account-password-help" className="text-sm text-gray-500">Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.</p>
         <div className="flex gap-3"><button type="submit" disabled={saving} className="ace-button ace-button-primary">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create account'}</button>{editingId && <button type="button" disabled={saving} className="ace-button ace-button-secondary" onClick={cancelEdit}>Cancel</button>}</div>
      </form>
      <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Accounts</h2><button className="ace-button ace-button-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh</button></div>
      {listError ? <p role="alert">{listError} <button className="underline" onClick={() => setRevision(value => value + 1)}>Retry</button></p> : loading ? <p role="status">Loading accounts...</p> : <>
         <div className="overflow-x-auto bg-white border rounded-xl"><table className="w-full text-sm text-left"><caption className="sr-only">User accounts</caption><thead className="bg-gray-50"><tr>{['Name', 'Username', 'Email', 'Role', 'Status', 'Actions'].map(label => <th key={label} scope="col" className="p-4">{label}</th>)}</tr></thead><tbody>{result?.data?.map(user => <tr key={user.id} className="border-t"><td className="p-4">{user.name}</td><td className="p-4">{user.username}</td><td className="p-4">{user.email}</td><td className="p-4">{user.is_admin ? 'Admin' : 'User'}</td><td className="p-4">{user.is_active ? 'Active' : 'Disabled'}</td><td className="p-4"><button disabled={saving} className="ace-button ace-button-secondary" onClick={() => editAccount(user)}>Edit</button></td></tr>)}{!result?.data?.length && <tr><td colSpan={6} className="p-6 text-center">No accounts found.</td></tr>}</tbody></table></div>
         <nav aria-label="Accounts pagination" className="flex items-center justify-between gap-3 mt-5"><button className="ace-button ace-button-secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {result?.current_page || 1} of {result?.last_page || 1}</span><button className="ace-button ace-button-secondary" disabled={page >= (result?.last_page || 1)} onClick={() => setPage(value => value + 1)}>Next</button></nav>
      </>}
   </section>;
}

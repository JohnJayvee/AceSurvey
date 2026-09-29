import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useStateContext } from '@context/ContextProvider';

export default function UserProfilePopup({ onLogout }) {
   const { currentUser } = useStateContext();
   return <section className="account-dropdown" aria-label="Account">
      <div className="account-dropdown-header"><span className="account-dropdown-avatar">{(currentUser.name || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{currentUser.name || 'Your account'}</strong><span>{currentUser.email}</span><small>{currentUser.is_admin ? 'Administrator' : 'Personal account'}</small></div></div>
      <div className="account-dropdown-options account-menu-links">
         <Link to="/profile"><span className="account-action-icon"><UserCircleIcon /></span><span><strong>Profile</strong><small>Your information and password</small></span><ChevronRightIcon className="account-menu-chevron" /></Link>
         <Link to="/settings"><span className="account-action-icon"><Cog6ToothIcon /></span><span><strong>Settings</strong><small>Colors and appearance</small></span><ChevronRightIcon className="account-menu-chevron" /></Link>
      </div>
      <div className="account-dropdown-footer"><button type="button" onClick={onLogout}><ArrowRightOnRectangleIcon /><span>Logout</span><small>End this session</small></button></div>
   </section>;
}
UserProfilePopup.propTypes = {
   onLogout: PropTypes.func,
};

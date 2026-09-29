import PropTypes from 'prop-types';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '@api/axios';

const StateContext = createContext(null);
const ACTIVITY_TIMEOUT = 300000;
const readUser = () => {
    try {
        const storage = localStorage.getItem('TOKEN') ? localStorage : sessionStorage;
        return storage.getItem('TOKEN') ? JSON.parse(storage.getItem('CURRENT_USER') || '{}') : {};
    } catch { return {}; }
};

export const ContextProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(readUser);
    const [userToken, updateToken] = useState(() => localStorage.getItem('TOKEN') || sessionStorage.getItem('TOKEN') || '');
    const [toast, setToast] = useState({ message: '', show: false });
    const toastTimer = useRef(null);
    const [welcomeTourOpen, setWelcomeTourOpen] = useState(false);

    const clearSession = useCallback(() => {
        sessionStorage.removeItem('TOKEN');
        sessionStorage.removeItem('CURRENT_USER');
        sessionStorage.removeItem('AUTH_LAST_ACCESS');
        axiosClient.cancelAllRequests();
        axiosClient.clearCache();
        setWelcomeTourOpen(false);
        updateToken('');
        setCurrentUser({});
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('TOKEN');
        localStorage.removeItem('CURRENT_USER');
        // Share only a logout notification, never a session-only credential.
        localStorage.setItem('AUTH_LOGOUT', crypto.randomUUID());
        clearSession();
    }, [clearSession]);

    const setUserToken = useCallback((token, keepSignedIn = false, userData = {}, showWelcomeTour = false) => {
        if (!token) { logout(); return; }
        axiosClient.cancelAllRequests();
        axiosClient.clearCache();
        localStorage.removeItem('TOKEN');
        localStorage.removeItem('CURRENT_USER');
        sessionStorage.removeItem('TOKEN');
        sessionStorage.removeItem('CURRENT_USER');
        const storage = keepSignedIn ? localStorage : sessionStorage;
        storage.setItem('CURRENT_USER', JSON.stringify(userData));
        storage.setItem('TOKEN', token);
        sessionStorage.setItem('AUTH_LAST_ACCESS', String(Date.now()));
        updateToken(token);
        setCurrentUser(userData);
        setWelcomeTourOpen(showWelcomeTour === true);
    }, [logout]);

    useEffect(() => {
        // Remove credentials and browser-restart heuristics left by older versions.
        ['SHARED_TOKEN', 'SHARED_CURRENT_USER', 'LAST_BROWSER_SESSION', 'LAST_AUTH_TIMESTAMP', 'AUTH_LAST_ACCESS', 'AUTH_TIMESTAMP'].forEach(key => localStorage.removeItem(key));
        const sync = event => {
            if (event.key === 'AUTH_LOGOUT' || (event.key === 'TOKEN' && !event.newValue) || event.key === null) clearSession();
            else if (event.key === 'TOKEN' && event.newValue) {
                sessionStorage.removeItem('TOKEN');
                sessionStorage.removeItem('CURRENT_USER');
                axiosClient.cancelAllRequests();
                axiosClient.clearCache();
                updateToken(event.newValue);
                setCurrentUser(readUser());
            } else if (event.key === 'CURRENT_USER' && localStorage.getItem('TOKEN')) setCurrentUser(readUser());
        };
        window.addEventListener('storage', sync);
        window.addEventListener('auth:expired', logout);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener('auth:expired', logout);
        };
    }, [clearSession, logout]);

    useEffect(() => {
        if (!userToken) return;
        const storage = localStorage.getItem('TOKEN') ? localStorage : sessionStorage;
        const serialized = JSON.stringify(currentUser);
        if (storage.getItem('CURRENT_USER') !== serialized) storage.setItem('CURRENT_USER', serialized);
    }, [currentUser, userToken]);

    useEffect(() => {
        if (!userToken || localStorage.getItem('TOKEN')) return;
        const check = () => {
            const lastAccess = Number(sessionStorage.getItem('AUTH_LAST_ACCESS'));
            if (lastAccess && Date.now() - lastAccess > ACTIVITY_TIMEOUT) { logout(); return false; }
            return true;
        };
        const activity = () => { if (check()) sessionStorage.setItem('AUTH_LAST_ACCESS', String(Date.now())); };
        if (!check()) return;
        if (!sessionStorage.getItem('AUTH_LAST_ACCESS')) activity();
        const events = ['pointerdown', 'keydown', 'scroll'];
        events.forEach(event => window.addEventListener(event, activity, { passive: true }));
        const timer = setInterval(check, 30000);
        return () => {
            clearInterval(timer);
            events.forEach(event => window.removeEventListener(event, activity));
        };
    }, [userToken, logout]);

    useEffect(() => () => clearTimeout(toastTimer.current), []);
    const showToast = useCallback((message, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ message, type, show: true });
        toastTimer.current = setTimeout(() => setToast({ message: '', show: false }), 4700);
    }, []);

    return <StateContext.Provider value={{ welcomeTourOpen, setWelcomeTourOpen, currentUser, setCurrentUser, userToken, setUserToken, logout, surveys: [], questionTypes: ['short answer', 'dropdown', 'multiple choice', 'checkboxes', 'paragraph'], toast, showToast }}>{children}</StateContext.Provider>;
};
ContextProvider.propTypes = {
   children: PropTypes.node,
};


// This context intentionally exports its consumer hook alongside the provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useStateContext = () => useContext(StateContext);

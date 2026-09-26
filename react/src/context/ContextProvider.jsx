import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import debounce from "lodash/debounce"; // Add this dependency for performance optimization

const StateContext = createContext({
    currentUser: {},
    userToken: null,
    surveys: [],
    questionTypes: [],
    toast: { message: null, show: false },
    setCurrentUser: () => { },
    setUserToken: () => { },
    logout: () => { },
    showToast: () => { },
});

const ACTIVITY_TIMEOUT = 300000; // 5 minutes in milliseconds
const AUTH_KEYS = {
    TOKEN: "TOKEN",
    SHARED_TOKEN: "SHARED_TOKEN",
    CURRENT_USER: "CURRENT_USER",
    SHARED_CURRENT_USER: "SHARED_CURRENT_USER",
    BROWSER_SESSION_ID: "BROWSER_SESSION_ID",
    LAST_BROWSER_SESSION: "LAST_BROWSER_SESSION",
    AUTH_LAST_ACCESS: "AUTH_LAST_ACCESS",
    AUTH_TIMESTAMP: "AUTH_TIMESTAMP",
    LAST_AUTH_TIMESTAMP: "LAST_AUTH_TIMESTAMP",
};

export const ContextProvider = ({ children }) => {
    // Initialize user state with proper error handling
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const persistentUser = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
            const sessionUser = sessionStorage.getItem(AUTH_KEYS.CURRENT_USER);
            const sharedUser = localStorage.getItem(AUTH_KEYS.SHARED_CURRENT_USER);

            const userData = persistentUser || sessionUser || sharedUser;
            return userData ? JSON.parse(userData) : {};
        } catch (e) {
            console.error("Failed to parse user data during initialization", e);
            return {};
        }
    });

    // Initialize token with correct priority
    const [userToken, _setUserToken] = useState(() => {
        return localStorage.getItem(AUTH_KEYS.TOKEN) ||
            sessionStorage.getItem(AUTH_KEYS.TOKEN) ||
            "";
    });

    const [surveys] = useState([]);
    const [questionTypes] = useState([
        "short answer", "dropdown", "multiple choice", "checkboxes", "paragraph",
    ]);
    const [toast, setToast] = useState({ message: "", show: false });

    // Optimized logout function using useCallback to prevent recreation
    const logout = useCallback(() => {
        console.log("Logging out...");

        // Clear localStorage
        [
            AUTH_KEYS.TOKEN, AUTH_KEYS.SHARED_TOKEN, AUTH_KEYS.SHARED_CURRENT_USER,
            AUTH_KEYS.CURRENT_USER, AUTH_KEYS.LAST_BROWSER_SESSION,
            AUTH_KEYS.LAST_AUTH_TIMESTAMP, AUTH_KEYS.AUTH_LAST_ACCESS
        ].forEach(key => localStorage.removeItem(key));

        // Clear sessionStorage
        [
            AUTH_KEYS.TOKEN, AUTH_KEYS.CURRENT_USER, AUTH_KEYS.BROWSER_SESSION_ID
        ].forEach(key => sessionStorage.removeItem(key));

        // Update state
        _setUserToken("");
        setCurrentUser({});
    }, []);

    useEffect(() => {
        window.addEventListener('auth:expired', logout);
        return () => window.removeEventListener('auth:expired', logout);
    }, [logout]);

    // Generate a unique session ID
    const generateSessionId = () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    };

    // Improved setUserToken function
    const setUserToken = useCallback((token, keepSignedIn, userData = null) => {
        if (!token) {
            logout();
            return;
        }

        console.log(`Setting token with keepSignedIn=${keepSignedIn}`);

        // Create a unique browser session ID
        const sessionId = generateSessionId();
        sessionStorage.setItem(AUTH_KEYS.BROWSER_SESSION_ID, sessionId);
        localStorage.setItem(AUTH_KEYS.LAST_BROWSER_SESSION, sessionId);

        // Set a timestamp to verify active sessions
        const timestamp = Date.now().toString();
        localStorage.setItem(AUTH_KEYS.LAST_AUTH_TIMESTAMP, timestamp);
        localStorage.setItem(AUTH_KEYS.AUTH_LAST_ACCESS, timestamp);

        // Handle storage based on persistence preference
        if (keepSignedIn) {
            localStorage.setItem(AUTH_KEYS.TOKEN, token);
            if (userData) {
                localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(userData));
            }
        } else {
            localStorage.removeItem(AUTH_KEYS.TOKEN);
            localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
        }

        // Always store in sessionStorage for current tab
        sessionStorage.setItem(AUTH_KEYS.TOKEN, token);

        // Always set shared token for cross-tab communication
        localStorage.setItem(AUTH_KEYS.SHARED_TOKEN, token);

        // Store user data
        if (userData) {
            const userJson = JSON.stringify(userData);
            sessionStorage.setItem(AUTH_KEYS.CURRENT_USER, userJson);
            localStorage.setItem(AUTH_KEYS.SHARED_CURRENT_USER, userJson);
        }

        // Update state
        _setUserToken(token);
        setCurrentUser(userData || {});
    }, [logout]);

    const toastTimer = useRef(null);
    useEffect(() => () => clearTimeout(toastTimer.current), []);
    const showToast = useCallback((message, type = "success") => {
        clearTimeout(toastTimer.current);
        setToast({ message, type, show: true });
        toastTimer.current = setTimeout(() => {
            setToast({ message: "", show: false });
        }, 4700);
    }, []);

    // Function to safely parse user data
    const parseUserData = (dataString, fallback = {}) => {
        try {
            return dataString ? JSON.parse(dataString) : fallback;
        } catch (e) {
            console.error("Failed to parse user data", e);
            return fallback;
        }
    };

    // Authentication initialization system
    useEffect(() => {
        console.log("Authentication system initializing...");

        // Helper function to restore session in a new tab
        const restoreSession = (token, userDataString) => {
            sessionStorage.setItem(AUTH_KEYS.TOKEN, token);
            _setUserToken(token);

            try {
                const userData = parseUserData(userDataString);
                sessionStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(userData));
                setCurrentUser(userData);
            } catch (e) {
                console.error("Failed to parse user data", e);
            }

            const sessionId = generateSessionId();
            sessionStorage.setItem(AUTH_KEYS.BROWSER_SESSION_ID, sessionId);
            localStorage.setItem(AUTH_KEYS.LAST_BROWSER_SESSION, sessionId);
            localStorage.setItem(AUTH_KEYS.AUTH_LAST_ACCESS, Date.now().toString());
        };

        // Primary authentication initialization
        const initializeAuth = () => {
            // Check for persistent login
            const persistentToken = localStorage.getItem(AUTH_KEYS.TOKEN);
            if (persistentToken) {
                console.log("Persistent login detected");
                _setUserToken(persistentToken);
                const userData = parseUserData(localStorage.getItem(AUTH_KEYS.CURRENT_USER));
                setCurrentUser(userData);

                const sessionId = generateSessionId();
                sessionStorage.setItem(AUTH_KEYS.BROWSER_SESSION_ID, sessionId);
                localStorage.setItem(AUTH_KEYS.LAST_BROWSER_SESSION, sessionId);
                return;
            }

            // Check for shared token
            const sharedToken = localStorage.getItem(AUTH_KEYS.SHARED_TOKEN);

            // Handle browser restart vs new tab
            if (sharedToken && !sessionStorage.getItem(AUTH_KEYS.BROWSER_SESSION_ID)) {
                // For persistent logins, always restore
                if (localStorage.getItem(AUTH_KEYS.TOKEN)) {
                    console.log("Persistent login in new tab");
                    restoreSession(sharedToken, localStorage.getItem(AUTH_KEYS.SHARED_CURRENT_USER));
                    return;
                }

                // For session-only logins, check if this is a new tab or a browser restart
                const lastAccess = localStorage.getItem(AUTH_KEYS.AUTH_LAST_ACCESS);
                const lastAuthTimestamp = localStorage.getItem(AUTH_KEYS.LAST_AUTH_TIMESTAMP);
                const now = Date.now();

                // Check if this is a new tab (recent activity or login)
                const recentActivity =
                    (lastAccess && (now - parseInt(lastAccess) < ACTIVITY_TIMEOUT)) ||
                    (lastAuthTimestamp && (now - parseInt(lastAuthTimestamp) < 86400000)); // 24 hours

                if (recentActivity) {
                    console.log("New tab detected - restoring session");
                    restoreSession(sharedToken, localStorage.getItem(AUTH_KEYS.SHARED_CURRENT_USER));
                    return;
                }

                // This is a browser restart for a session-only login
                console.log("Browser restart detected - clearing session-only login");
                localStorage.removeItem(AUTH_KEYS.SHARED_TOKEN);
                localStorage.removeItem(AUTH_KEYS.SHARED_CURRENT_USER);
                localStorage.removeItem(AUTH_KEYS.LAST_AUTH_TIMESTAMP);
                localStorage.removeItem(AUTH_KEYS.AUTH_LAST_ACCESS);
                _setUserToken("");
                setCurrentUser({});
                return;
            }

            // Regular tab with shared token
            if (sharedToken) {
                console.log("Session continuation detected");
                restoreSession(sharedToken, localStorage.getItem(AUTH_KEYS.SHARED_CURRENT_USER));
                return;
            }

            // No authentication found
            console.log("No authentication found");
            _setUserToken("");
            setCurrentUser({});
        };

        // Run initialization
        initializeAuth();

        // Handle cross-tab authentication events
        const handleStorageChange = (e) => {
            if (e.key === AUTH_KEYS.SHARED_TOKEN) {
                if (e.newValue) {
                    console.log("Authentication updated in another tab");
                    sessionStorage.setItem(AUTH_KEYS.TOKEN, e.newValue);
                    _setUserToken(e.newValue);
                } else {
                    console.log("Logout detected in another tab");
                    sessionStorage.removeItem(AUTH_KEYS.TOKEN);
                    _setUserToken("");
                    setCurrentUser({});
                }
            } else if (e.key === AUTH_KEYS.SHARED_CURRENT_USER && e.newValue) {
                console.log("User data updated in another tab");
                const userData = parseUserData(e.newValue);
                sessionStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(userData));
                setCurrentUser(userData);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Optimized inactivity monitor with debouncing
    useEffect(() => {
        // Only run for non-persistent logins
        if (!userToken || localStorage.getItem(AUTH_KEYS.TOKEN)) return;

        console.log("Setting up inactivity monitor for session-only login");

        // Debounced update function for better performance
        const updateLastAccess = debounce(() => {
            if (userToken && !localStorage.getItem(AUTH_KEYS.TOKEN)) {
                localStorage.setItem(AUTH_KEYS.AUTH_LAST_ACCESS, Date.now().toString());
            }
        }, 1000, { leading: true, trailing: true, maxWait: 1000 });

        // Only use necessary event listeners
        const events = ["mousemove", "keydown", "click", "scroll"];
        events.forEach(event => window.addEventListener(event, updateLastAccess));

        // Track visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                updateLastAccess();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Set initial timestamp
        updateLastAccess();

        // Check for inactivity
        const inactivityCheck = setInterval(() => {
            const lastAccess = localStorage.getItem(AUTH_KEYS.AUTH_LAST_ACCESS);
            if (lastAccess && !localStorage.getItem(AUTH_KEYS.TOKEN)) {
                const inactiveTime = Date.now() - parseInt(lastAccess);

                if (inactiveTime > ACTIVITY_TIMEOUT) {
                    console.log("Session timeout: Logging out due to inactivity");
                    logout();
                }
            }
        }, 30000);

        return () => {
            events.forEach(event => window.removeEventListener(event, updateLastAccess));
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            clearInterval(inactivityCheck);
            updateLastAccess.cancel(); // Cancel any pending debounced updates
        };
    }, [userToken, logout]);

    return (
        <StateContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                userToken,
                setUserToken,
                logout,
                surveys,
                questionTypes,
                toast,
                showToast,
            }}
        >
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);

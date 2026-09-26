import { createContext, useContext, useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce"; // Add this dependency for performance optimization

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

// Your existing survey data preserved
const tmpSurveys = [
    {
        id: 1,
        image_url:
            "https://ik.imagekit.io/ably/ghost/prod/2023/11/best-react-component-libraries.png?tr=w-1728,q-50",
        title: "TheCodeholic YouTube channel",
        slug: "thecodeholic-youtube-channel",
        status: true,
        description:
            "My name is Zura.<br>I am Web Developer with 9+ years of experience, free educational content creator, CTO, Lecturer and father of two wonderful daughters.<br><br>The purpose of the channel is to share my several years of experience with beginner developers.<br>Teach them what I know and make my experience as a lesson for others.",
        created_at: "2022-01-07 13:23:41",
        updated_at: "2022-01-18 16:34:19",
        expire_date: "2022-01-23",
        questions: [
            {
                id: 15,
                type: "short answer",
                question: "From which country are you?",
                description: null,
            },
            {
                id: 16,
                type: "checkboxes",
                question:
                    "Which language videos do you want to see on my channel?",
                description:
                    "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda cumque earum eos esse est ex facilis, iure laboriosam maiores neque nesciunt nulla placeat praesentium quae quos ratione, recusandae totam velit!",
                data: {
                    options: [
                        {
                            uuid: "8ee03188-9e7e-44e5-9176-7574c0beec6f",
                            text: "JavaScript",
                        },
                        {
                            uuid: "fe9497f2-8f05-4c82-9586-26e36736fa9e",
                            text: "PHP",
                        },
                        {
                            uuid: "db0f194c-d32d-4e19-929e-08f7b4e2bcc0",
                            text: "HTML + CSS",
                        },
                        {
                            uuid: "93273c4c-ac8f-432e-b847-e467df64ab9c",
                            text: "All of the above",
                        },
                        {
                            uuid: "d54818a7-ad7e-4b69-9287-16a8dc50a6cb",
                            text: "Everything Zura thinks will be good",
                        },
                    ],
                },
            },
            {
                id: 17,
                type: "dropdown",
                question:
                    "Which PHP framework videos do you want to see on my channel?",
                description:
                    "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda cumque earum eos esse est ex facilis, iure laboriosam maiores neque nesciunt nulla placeat praesentium quae quos ratione, recusandae totam velit!",
                data: {
                    options: [
                        {
                            uuid: "fb907cfe-b7a1-4b24-86fb-03f9c44aa710",
                            text: "Laravel",
                        },
                        {
                            uuid: "e2629262-93ca-4a7a-8129-19c765664a04",
                            text: "Yii2",
                        },
                        {
                            uuid: "9a11a425-d9fe-4fe9-86af-bb814e3d9271",
                            text: "Codeigniter",
                        },
                        {
                            uuid: "484268b1-d3aa-47f8-a185-356ed48e50fe",
                            text: "Symfony",
                        },
                    ],
                },
            },
            {
                id: 18,
                type: "multiple choice",
                question: "Which Laravel Framework do you love most?",
                description:
                    "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda cumque earum eos esse est ex facilis, iure laboriosam maiores neque nesciunt nulla placeat praesentium quae quos ratione, recusandae totam velit!",
                data: {
                    options: [
                        {
                            uuid: "c02e50e6-5ebf-4344-9822-baa16502dbdb",
                            text: "Laravel 5",
                        },
                        {
                            uuid: "90a15aae-ef4c-4d04-aa05-8e840d4a2ded",
                            text: "Laravel 6",
                        },
                        {
                            uuid: "93c64532-c1eb-4bfd-bd00-ab51cafdee78",
                            text: "Laravel 7",
                        },
                        {
                            uuid: "51f6a704-7a86-47a4-9b2d-72bb026a3371",
                            text: "Laravel 8",
                        },
                    ],
                },
            },
            {
                id: 19,
                type: "checkboxes",
                question:
                    "What type of projects do you want to see on my channel built with Laravel?",
                description:
                    "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda cumque earum eos esse est ex facilis, iure laboriosam maiores neque nesciunt nulla placeat praesentium quae quos ratione, recusandae totam velit!",
                data: {
                    options: [
                        {
                            uuid: "c5519ab0-3282-4758-a34b-506052bf1342",
                            text: "REST API",
                        },
                        {
                            uuid: "dfbbc0af-8fff-44ae-be36-e85270041729",
                            text: "E-commerce",
                        },
                        {
                            uuid: "6940c122-505f-4d9d-a103-472f923fad94",
                            text: "Real Estate",
                        },
                        {
                            uuid: "2b3c12a4-8f3c-4276-ae59-4e9d55e849be",
                            text: "All of the above",
                        },
                    ],
                },
            },
            {
                id: 22,
                type: "paragraph",
                question: "What do you think about TheCodeholic channel?",
                description:
                    "Write your honest opinion. Everything is anonymous.",
                data: [],
            },
            {
                id: 23,
                type: "short answer",
                question: "Which channel is your favorite one?",
                description: null,
                data: [],
            },
        ],
    },
    {
        id: 2,
        image_url:
            "https://www.codingdojo.com/blog/wp-content/uploads/react.jpg",
        title: "React",
        slug: "react",
        status: true,
        description:
            "React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.",
        created_at: "2022-01-07 08:50:40",
        updated_at: "2022-01-07 13:37:37",
        expire_date: "2022-02-01",
        questions: [],
    },
    {
        id: 3,
        image_url:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWbBKB9PQ37MtbmGDCA1YYWPz8X6zJkUcFkg&s",
        title: "Laravel 9",
        slug: "laravel-9",
        status: true,
        description:
            "Laravel is a web application framework with expressive, elegant syntax. We\u2019ve already laid the foundation \u2014 freeing you to create without sweating the small things.",
        created_at: "2022-01-07 13:28:56",
        updated_at: "2022-01-07 13:28:56",
        expire_date: "2022-01-20",
        questions: [],
    },
];

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

    const [surveys, setSurveys] = useState(tmpSurveys);
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

    const showToast = useCallback((message) => {
        setToast({ message, show: true });
        setTimeout(() => {
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
        }, 1000); // Update at most once per second

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

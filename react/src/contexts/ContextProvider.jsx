import { createContext, useContext, useState, useEffect } from "react";

const StateContext = createContext({
    currentUser: {},
    userToken: null,
    surveys: [],
    questionTypes: [],
    toast: {
        message: null,
        show: false,
    },
    setCurrentUser: () => { },
    setUserToken: () => { },
    logout: () => { }, // Add this line
    showToast: () => { },
});

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
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('CURRENT_USER');
        return savedUser ? JSON.parse(savedUser) : {};
    });

    const [userToken, _setUserToken] = useState(
        localStorage.getItem("TOKEN") || sessionStorage.getItem("TOKEN") || ""
    );
    const [surveys, setSurveys] = useState(tmpSurveys);
    const [questionTypes] = useState([
        "short answer",
        "dropdown",
        "multiple choice",
        "checkboxes",
        "paragraph",
    ]);

    const [toast, setToast] = useState({ message: "", show: false });

    const logout = () => {
        // Clear all authentication data
        localStorage.removeItem("TOKEN");
        localStorage.removeItem("SHARED_TOKEN");
        localStorage.removeItem("SHARED_CURRENT_USER");
        localStorage.removeItem('CURRENT_USER');
        sessionStorage.removeItem("TOKEN");
        sessionStorage.removeItem('CURRENT_USER');

        // Update state
        _setUserToken("");
        setCurrentUser({});
    };

    const setUserToken = (token, keepSignedIn, userData = null) => {
        if (token) {
            if (keepSignedIn) {
                // Persistent login - store in localStorage
                localStorage.setItem("TOKEN", token);
            } else {
                // Session login - clear from localStorage to ensure it expires
                localStorage.removeItem("TOKEN");
            }

            // Always set shared values for cross-tab communication
            localStorage.setItem("SHARED_TOKEN", token);

            if (userData) {
                localStorage.setItem('SHARED_CURRENT_USER', JSON.stringify(userData));
                sessionStorage.setItem('CURRENT_USER', JSON.stringify(userData));
            }

            // Always set in sessionStorage for current tab
            sessionStorage.setItem("TOKEN", token);

            _setUserToken(token);
            setCurrentUser(userData || {});
        } else {
            // Logout case
            logout();
        }
    };

    const showToast = (message) => {
        setToast({ message, show: true });
        setTimeout(() => {
            setToast({ message: "", show: false });
        }, 4700);
    };

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'SHARED_TOKEN') {
                const newToken = e.newValue;
                if (newToken) {
                    sessionStorage.setItem("TOKEN", newToken);
                    _setUserToken(newToken);
                } else {
                    sessionStorage.removeItem("TOKEN");
                    _setUserToken('');
                    setCurrentUser({});
                }
            } else if (e.key === 'SHARED_CURRENT_USER') {
                const userData = e.newValue ? JSON.parse(e.newValue) : {};
                sessionStorage.setItem('CURRENT_USER', JSON.stringify(userData));
                setCurrentUser(userData);
            }
        };

        const checkAuthStatus = () => {
            const token = localStorage.getItem("TOKEN") ||
                (document.visibilityState === 'visible' ? localStorage.getItem("SHARED_TOKEN") : null) ||
                sessionStorage.getItem("TOKEN");

            if (token) {
                _setUserToken(token);
                // If using SHARED_TOKEN, ensure it's in sessionStorage
                if (localStorage.getItem("SHARED_TOKEN") === token) {
                    sessionStorage.setItem("TOKEN", token);
                    const sharedUser = localStorage.getItem('SHARED_CURRENT_USER');
                    if (sharedUser) {
                        try {
                            sessionStorage.setItem('CURRENT_USER', sharedUser);
                            setCurrentUser(JSON.parse(sharedUser));
                        } catch (e) {
                            console.error('Error parsing user data:', e);
                        }
                    }
                } else {
                    const savedUser = token === localStorage.getItem("TOKEN")
                        ? localStorage.getItem('CURRENT_USER')
                        : sessionStorage.getItem('CURRENT_USER');

                    if (savedUser) {
                        try {
                            const userData = JSON.parse(savedUser);
                            setCurrentUser(userData);
                        } catch (e) {
                            console.error('Error parsing user data:', e);
                        }
                    }
                }
            } else {
                _setUserToken('');
                setCurrentUser({});
                localStorage.removeItem("SHARED_TOKEN");
                localStorage.removeItem("SHARED_CURRENT_USER");
                localStorage.removeItem("CURRENT_USER");
                sessionStorage.removeItem("CURRENT_USER");
            }
        };

        window.addEventListener('storage', handleStorageChange);
        document.addEventListener('visibilitychange', checkAuthStatus);

        // Initial check
        checkAuthStatus();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('visibilitychange', checkAuthStatus);
        };
    }, []); // Remove currentUser from dependencies

    // Add this function to detect browser close
    useEffect(() => {
        const handleBeforeUnload = () => {
            // If this is a session-only login (not kept signed in)
            if (!localStorage.getItem("TOKEN") && sessionStorage.getItem("TOKEN")) {
                // Add timestamp to detect if browser was actually closed
                localStorage.setItem("AUTH_CLOSING_TIMESTAMP", Date.now().toString());
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Add initialization check for browser restarts
    useEffect(() => {
        const checkBrowserRestart = () => {
            const closingTimestamp = localStorage.getItem("AUTH_CLOSING_TIMESTAMP");
            if (closingTimestamp) {
                // Clear temporary auth data on browser restart
                localStorage.removeItem("SHARED_TOKEN");
                localStorage.removeItem("SHARED_CURRENT_USER");
                localStorage.removeItem("AUTH_CLOSING_TIMESTAMP");

                // If there's no persistent token, clear everything
                if (!localStorage.getItem("TOKEN")) {
                    sessionStorage.removeItem("TOKEN");
                    sessionStorage.removeItem("CURRENT_USER");
                    _setUserToken("");
                    setCurrentUser({});
                }
            }
        };

        // Run on component mount
        checkBrowserRestart();
    }, []);

    // Update the provider value to include the logout function
    return (
        <StateContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                userToken,
                setUserToken,
                logout, // Add logout function to context
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

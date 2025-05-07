import axios from "axios";

const baseURLs = [
    import.meta.env.VITE_API_LOCAL,
    import.meta.env.VITE_API_HOME,
    import.meta.env.VITE_API_OFFICE,
];

let clientReady = null;

const clientPromise = new Promise(async (resolve) => {
    for (const url of baseURLs) {
        try {
            await axios.head(url, { timeout: 1000 });

            const client = axios.create({
                baseURL: `${url}/api`,
                withCredentials: true,
            });

            client.interceptors.request.use((config) => {
                const token = localStorage.getItem("TOKEN") || sessionStorage.getItem("TOKEN");
                if (token) config.headers.Authorization = `Bearer ${token}`;
                return config;
            });

            client.interceptors.response.use(
                (res) => res,
                (error) => {
                    if (error.response?.status === 401) {
                        localStorage.removeItem("TOKEN");
                        sessionStorage.removeItem("TOKEN");
                        // window.location.reload();
                    }
                    throw error;
                }
            );

            console.log("✅ Axios connected to:", url);
            resolve(client);
            return;
        } catch (e) {
            console.warn("❌ Could not connect to:", url);
        }
    }

    console.error("❌ All base URLs failed.");
    resolve(null);
});

const axiosClient = new Proxy({}, {
    get(_, prop) {
        return async (...args) => {
            if (!clientReady) {
                clientReady = await clientPromise;
            }
            if (!clientReady) throw new Error("Axios client initialization failed.");
            return clientReady[prop](...args);
        };
    },
});

export default axiosClient;

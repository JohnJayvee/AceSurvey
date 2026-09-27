import React from "react";
import ReactDOM from "react-dom/client";
import "@css/tailwind.css";
import router from "./router";
import { RouterProvider } from "react-router-dom";
import { ContextProvider } from "@context/ContextProvider";
import { pwaManager } from '@services/pwa'
import AppearanceProvider from '@context/AppearanceProvider';

// Initialize PWA with page control
pwaManager.init({
    // 🎯 JUST ADD THE PAGES WHERE YOU WANT INSTALL POPUP
    installPages: [
        '/dashboard'
    ],
    onNeedRefresh: () => {
        console.log('Update available')
    },
    onOfflineReady: () => {
        console.log('App ready offline')
    }
})




ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AppearanceProvider>
        <ContextProvider>
            <RouterProvider router={router} />
        </ContextProvider>
        </AppearanceProvider>
    </React.StrictMode>
);

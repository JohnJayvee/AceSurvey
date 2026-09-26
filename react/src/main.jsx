import React from "react";
import ReactDOM from "react-dom/client";
import "@css/tailwind.css";
import router from "./router";
import { RouterProvider } from "react-router-dom";
import { ContextProvider } from "@context/ContextProvider";
import { pwaManager } from '@services/pwa'
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: { primary: { main: '#107e72' }, background: { default: '#f5f7f8' }, text: { primary: '#20313d', secondary: '#778590' } },
    typography: { fontFamily: '"Segoe UI", ui-sans-serif, system-ui, sans-serif', fontSize: 13 },
    shape: { borderRadius: 10 },
    components: {
        MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, boxShadow: 'none' } } },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
});

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
        <ThemeProvider theme={theme}>
        <ContextProvider>
            <RouterProvider router={router} />
        </ContextProvider>
        </ThemeProvider>
    </React.StrictMode>
);

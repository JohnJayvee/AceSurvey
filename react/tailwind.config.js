/** @type {import('tailwindcss').Config} */
export default {
   content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
   darkMode: "class",
   theme: {
      fontFamily: {
         display: ["DS-Digital", "sans-serif"],
         body: ["Segoe UI", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      extend: {
         fontSize: {
            14: "14px",
         },
         backgroundColor: {
            "main-bg": "#FAFBFB",
            "main-dark-bg": "#20232A",
            "secondary-dark-bg": "#33373E",
            "on-secondary-dark-bg": "#394648",
            "light-gray": "#F7F7F7",
            "half-transparent": "rgba(0, 0, 0, 0.5)",
         },
         borderWidth: {
            1: "1px",
         },
         borderColor: {
            color: "rgba(0, 0, 0, 0.1)",
         },
         width: {
            400: "400px",
            760: "760px",
            780: "780px",
            800: "800px",
            1000: "1000px",
            1200: "1200px",
            1400: "1400px",
            "48p": "48%",
         },
         colors: {
            primary: "#107e72",
            blue: { 50: '#f0f8f5', 100: '#e1f1eb', 200: '#c3e2d5', 300: '#99ccba', 400: '#68b098', 500: '#35977f', 600: '#107e72', 700: '#146357', 800: '#194f46', 900: '#193e37' },
            indigo: { 50: '#f1f6f5', 100: '#e5efed', 200: '#c7ded8', 300: '#9ac3b8', 400: '#6ba595', 500: '#448a78', 600: '#2d7162', 700: '#265c50', 800: '#234c42', 900: '#203e37' },
            secondary: {
               100: "#E2E2D5",
               200: "#888883",
               // Add more shades if needed
            },
         },
         keyframes: {
            "fade-in-down": {
               from: {
                  transform: "translateY(-0.75rem)",
                  opacity: "0",
               },
               to: {
                  transform: "translateY(0rem)",
                  opacity: "1",
               },
            },
         },
         animation: {
            "fade-in-down": "fade-in-down 0.2s ease-in-out both",
         },
      },
   },
};

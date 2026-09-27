/** @type {import('tailwindcss').Config} */
const appearanceColors = {"50":"hsl(var(--palette-50) / <alpha-value>)","100":"hsl(var(--palette-100) / <alpha-value>)","200":"hsl(var(--palette-200) / <alpha-value>)","300":"hsl(var(--palette-300) / <alpha-value>)","400":"hsl(var(--palette-400) / <alpha-value>)","500":"hsl(var(--palette-500) / <alpha-value>)","600":"hsl(var(--palette-600) / <alpha-value>)","700":"hsl(var(--palette-700) / <alpha-value>)","800":"hsl(var(--palette-800) / <alpha-value>)","900":"hsl(var(--palette-900) / <alpha-value>)"};
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
            primary: 'var(--ace-accent)',
            blue: appearanceColors,
            indigo: appearanceColors,
            teal: appearanceColors, emerald: appearanceColors,
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

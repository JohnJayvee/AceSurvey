import { defineConfig } from "vite";
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            jsxImportSource: "@emotion/react",
            babel: {
                plugins: ["@emotion/babel-plugin"],
            },
        }),
        // Compresses assets using Gzip (.js, .css, etc.)
        viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            deleteOriginFile: false,
        }),

        // Visual report of bundle size
        visualizer({
            filename: './dist/bundle-report.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        }),
    ],
    css: {
        devSourcemap: false, // Disable source maps
    },
    build: {
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs
                drop_debugger: true,
            },
        },
    },
});

import { defineConfig } from "vite";
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import svgr from 'vite-plugin-svgr'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            jsxRuntime: 'automatic',
            jsxImportSource: "@emotion/react",
            babel: {
                plugins: [
                    "@emotion/babel-plugin",
                    'babel-plugin-styled-components', { displayName: true }
                ],
            },
            fastRefresh: true
        }),
        svgr(), // SVG as React components
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
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src') // Simplify imports
        }
    },
    build: {
        // minify: 'terser',
        // terserOptions: {
        //     compress: {
        //         drop_console: true, // Remove console.logs
        //         drop_debugger: true,
        //     },
        // },
        target: 'esnext', // Modern target for better tree-shaking
        minify: 'esbuild', // Faster minification than terser
        cssCodeSplit: true, // Enable CSS code splitting
        sourcemap: false, // Disable sourcemaps in production for smaller builds
        outDir: 'dist',
        chunkSizeWarningLimit: 500,
    },
    server: {
        port: 3000,
        open: true,
        strictPort: true,
        hmr: {
            overlay: true,
        }
    },
    optimizeDeps: {
        include: ['react', 'react-dom'],
        esbuildOptions: {
            target: 'esnext'
        }
    }
});

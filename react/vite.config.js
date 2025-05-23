import { defineConfig } from "vite";
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import svgr from 'vite-plugin-svgr'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',

    plugins: [
        react({
            jsxRuntime: 'automatic',
            jsxImportSource: "@emotion/react",
            babel: {
                plugins: [
                    "@emotion/babel-plugin",
                    ...(isProduction ? [] : ['babel-plugin-styled-components', { displayName: true }])
                ],
            },
            fastRefresh: !isProduction
        }),
        svgr({
            svgrOptions: {
                icon: true,
            },
        }),

        // Production only compression
        ...(isProduction ? [
            viteCompression({
                algorithm: 'gzip',
                ext: '.gz',
                deleteOriginFile: false,
                threshold: 1024,
                compressionOptions: { level: 9 }
            })
        ] : []),

        // Dev only bundle analyzer
        ...(!isProduction ? [
            visualizer({
                filename: './dist/bundle-report.html',
                open: true,
                gzipSize: true,
                brotliSize: true,
                template: 'treemap'
            })
        ] : []),
    ],

    css: {
        devSourcemap: !isProduction,
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },

    build: {
        target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
        minify: 'esbuild',
        cssCodeSplit: true,
        sourcemap: false,
        outDir: 'dist',
        chunkSizeWarningLimit: 500,
        reportCompressedSize: false,
        assetsInlineLimit: 4096,

        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    emotion: ['@emotion/react', '@emotion/styled']
                },
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
            }
        }
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
        include: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
        esbuildOptions: {
            target: 'es2020'
        }
    },

    esbuild: {
        drop: isProduction ? ['console', 'debugger'] : [],
        legalComments: 'none',
        target: 'es2020'
    }
});

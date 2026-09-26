import { defineConfig } from "vite";
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig({
   base: '/',

   plugins: [
      react({ jsxImportSource: '@emotion/react' }),
      svgr({
         svgrOptions: {
            icon: true,
         },
      }),

      // ULTIMATE PWA Configuration
      VitePWA({
         registerType: 'autoUpdate',
         injectRegister: 'auto',
         includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],

         // Keep development requests outside the service worker cache.
         devOptions: {
            enabled: false,
            type: 'module'
         },

         workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,

            runtimeCaching: [
               {
                  urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
                  handler: 'NetworkOnly'
               },
               {
                  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
                  handler: 'CacheFirst',
                  options: {
                     cacheName: 'images-cache',
                     expiration: {
                        maxEntries: 60,
                        maxAgeSeconds: 60 * 60 * 24 * 30
                     }
                  }
               }
            ]
         },

         manifest: {
            name: 'AceSurvey - Professional Survey Platform',
            short_name: 'AceSurvey',
            description: 'Create, manage, and analyze surveys with professional-grade tools',
            theme_color: '#2563eb',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/',
            id: 'com.acesurvey.app',
            categories: ['productivity', 'business'],
            lang: 'en',

            icons: [
               {
                  src: 'AceLogo-64x64.png',
                  sizes: '64x64',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: 'AceLogo-144x144.png',
                  sizes: '144x144',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: 'AceLogo-180x180.png',
                  sizes: '180x180',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: 'AceLogo-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: 'AceLogo-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: 'AceLogo-512x512-maskable.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable'
               },
            ]
         }
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
         // Root - automatically handles ALL src imports
         '@': path.resolve(__dirname, 'src'),

         // Component structure - covers ANY component organization
         '@components': path.resolve(__dirname, 'src/components'),
         '@ui': path.resolve(__dirname, 'src/components/ui'),
         '@layout': path.resolve(__dirname, 'src/components/layout'),
         '@forms': path.resolve(__dirname, 'src/components/forms'),
         '@common': path.resolve(__dirname, 'src/components/common'),
         '@shared': path.resolve(__dirname, 'src/components/shared'),

         // Page structure - handles ANY page organization
         '@pages': path.resolve(__dirname, 'src/pages'),
         '@views': path.resolve(__dirname, 'src/views'),
         '@screens': path.resolve(__dirname, 'src/screens'),
         '@routes': path.resolve(__dirname, 'src/routes'),

         // Logic & utilities - covers ALL utility patterns
         '@utils': path.resolve(__dirname, 'src/utils'),
         '@helpers': path.resolve(__dirname, 'src/helpers'),
         '@lib': path.resolve(__dirname, 'src/lib'),
         '@constants': path.resolve(__dirname, 'src/constants'),
         '@config': path.resolve(__dirname, 'src/config'),
         '@enums': path.resolve(__dirname, 'src/enums'),

         // Hooks & composables - handles ALL hook patterns
         '@hooks': path.resolve(__dirname, 'src/hooks'),
         '@composables': path.resolve(__dirname, 'src/composables'),
         '@custom': path.resolve(__dirname, 'src/custom'),

         // State management - covers ALL state solutions
         '@store': path.resolve(__dirname, 'src/store'),
         '@context': path.resolve(__dirname, 'src/context'),
         '@providers': path.resolve(__dirname, 'src/providers'),
         '@redux': path.resolve(__dirname, 'src/redux'),
         '@zustand': path.resolve(__dirname, 'src/zustand'),
         '@state': path.resolve(__dirname, 'src/state'),

         // Assets - handles ALL asset types
         '@assets': path.resolve(__dirname, 'src/assets'),
         '@images': path.resolve(__dirname, 'src/assets/images'),
         '@icons': path.resolve(__dirname, 'src/assets/icons'),
         '@styles': path.resolve(__dirname, 'src/assets/styles'),
         '@css': path.resolve(__dirname, 'src/assets/css'),
         '@fonts': path.resolve(__dirname, 'src/assets/fonts'),
         '@media': path.resolve(__dirname, 'src/assets/media'),

         // API & services - covers ALL backend patterns
         '@api': path.resolve(__dirname, 'src/api'),
         '@services': path.resolve(__dirname, 'src/services'),
         '@graphql': path.resolve(__dirname, 'src/graphql'),
         '@queries': path.resolve(__dirname, 'src/queries'),
         '@mutations': path.resolve(__dirname, 'src/mutations'),
         '@endpoints': path.resolve(__dirname, 'src/endpoints'),

         // Types & schemas - handles ALL typing patterns
         '@types': path.resolve(__dirname, 'src/types'),
         '@interfaces': path.resolve(__dirname, 'src/interfaces'),
         '@models': path.resolve(__dirname, 'src/models'),
         '@schemas': path.resolve(__dirname, 'src/schemas'),
         '@dto': path.resolve(__dirname, 'src/dto'),

         // Feature organization - covers ANY architecture
         '@features': path.resolve(__dirname, 'src/features'),
         '@modules': path.resolve(__dirname, 'src/modules'),
         '@domains': path.resolve(__dirname, 'src/domains'),
         '@sections': path.resolve(__dirname, 'src/sections'),

         // Testing & development
         '@tests': path.resolve(__dirname, 'src/tests'),
         '@mocks': path.resolve(__dirname, 'src/mocks'),
         '@fixtures': path.resolve(__dirname, 'src/fixtures'),
         '@storybook': path.resolve(__dirname, 'src/storybook'),

         // Internationalization
         '@locales': path.resolve(__dirname, 'src/locales'),
         '@translations': path.resolve(__dirname, 'src/translations'),
         '@i18n': path.resolve(__dirname, 'src/i18n'),

         // External resources
         '@public': path.resolve(__dirname, 'public'),
         '@static': path.resolve(__dirname, 'static'),
         '@docs': path.resolve(__dirname, 'docs'),
      }
   },

   build: {
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      minify: 'esbuild',
      cssCodeSplit: true,
      sourcemap: false,
      outDir: 'dist',
      chunkSizeWarningLimit: 2000, // Increased for large projects
      reportCompressedSize: false,
      assetsInlineLimit: 4096,

      rollupOptions: {
         output: {
            // Preserve Vite's route-level dynamic import splitting.
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

   // Reuse Vite's dependency cache between development starts.
   optimizeDeps: {
      // Only rebuild dependencies when they change.
      force: false,

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

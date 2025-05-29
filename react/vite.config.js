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
      react({
         jsxRuntime: 'automatic',
         jsxImportSource: "@emotion/react",
         babel: {
            plugins: [
               // ULTIMATE AUTO-BABEL PLUGINS - covers ALL React patterns

               // Emotion & CSS-in-JS (always included)
               "@emotion/babel-plugin",

               // Styled Components (environment aware)
               ...(isProduction ? [] : [
                  ['babel-plugin-styled-components', {
                     displayName: true,
                     fileName: true,
                     meaninglessFileNames: ['index', 'styles']
                  }]
               ]),

               // React optimization plugins
               ['babel-plugin-react-remove-properties', {
                  properties: isProduction ? ['data-testid', 'data-test'] : []
               }],

               // Development plugins (dev only)
               ...(!isProduction ? [
                  'babel-plugin-react-display-name',
                  ['babel-plugin-react-refresh', { skipEnvCheck: true }]
               ] : []),

               // Import optimization (always)
               ['babel-plugin-import', {
                  libraryName: 'antd',
                  libraryDirectory: 'es',
                  style: true
               }, 'antd'],
               ['babel-plugin-import', {
                  libraryName: '@mui/material',
                  libraryDirectory: '',
                  camel2DashComponentName: false
               }, 'mui-material'],
               ['babel-plugin-import', {
                  libraryName: '@mui/icons-material',
                  libraryDirectory: '',
                  camel2DashComponentName: false
               }, 'mui-icons'],
               ['babel-plugin-import', {
                  libraryName: 'lodash',
                  libraryDirectory: '',
                  camel2DashComponentName: false
               }, 'lodash'],

               // Production optimizations (prod only)
               ...(isProduction ? [
                  'babel-plugin-transform-react-remove-prop-types',
                  'babel-plugin-transform-react-constant-elements',
                  'babel-plugin-transform-react-inline-elements'
               ] : []),

               // Modern JS features (always)
               '@babel/plugin-proposal-optional-chaining',
               '@babel/plugin-proposal-nullish-coalescing-operator',
               '@babel/plugin-proposal-logical-assignment-operators',
               '@babel/plugin-proposal-class-properties',
               '@babel/plugin-proposal-private-methods',

               // Dynamic imports (always)
               '@babel/plugin-syntax-dynamic-import',

               // Async/await optimization (always)
               ['@babel/plugin-transform-runtime', {
                  corejs: false,
                  helpers: true,
                  regenerator: true,
                  useESModules: false
               }]
            ],

            // Additional presets for comprehensive coverage
            presets: [
               ['@babel/preset-env', {
                  targets: {
                     browsers: ['> 1%', 'last 2 versions', 'not dead']
                  },
                  useBuiltIns: 'usage',
                  corejs: 3,
                  modules: false
               }],
               ['@babel/preset-react', {
                  runtime: 'automatic',
                  importSource: '@emotion/react'
               }],
               '@babel/preset-typescript'
            ]
         },
         fastRefresh: !isProduction
      }),
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

         // Force generate in development too
         devOptions: {
            enabled: true,
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
                  urlPattern: /^https:\/\/api\./,
                  handler: 'NetworkFirst',
                  options: {
                     cacheName: 'api-cache',
                     networkTimeoutSeconds: 3,
                     expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60 * 24
                     },
                     cacheableResponse: {
                        statuses: [0, 200]
                     }
                  }
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
            // ULTIMATE AUTO-CHUNKING - handles ANY library automatically
            manualChunks: (id) => {
               // Core React ecosystem
               if (id.includes('react') || id.includes('react-dom')) {
                  return 'react';
               }

               // Router libraries
               if (id.includes('router')) {
                  return 'router';
               }

               // UI Component libraries
               if (id.includes('@mui') || id.includes('antd') || id.includes('@chakra') ||
                  id.includes('@mantine') || id.includes('react-bootstrap') || id.includes('semantic-ui')) {
                  return 'ui-lib';
               }

               // Styling libraries
               if (id.includes('@emotion') || id.includes('styled-components') ||
                  id.includes('classnames') || id.includes('clsx')) {
                  return 'styles';
               }

               // Form libraries
               if (id.includes('formik') || id.includes('react-hook-form') ||
                  id.includes('yup') || id.includes('zod') || id.includes('joi')) {
                  return 'forms';
               }

               // Charts & Data Visualization
               if (id.includes('chart') || id.includes('d3') || id.includes('recharts') ||
                  id.includes('@visx') || id.includes('plotly') || id.includes('highcharts')) {
                  return 'charts';
               }

               // Utility libraries
               if (id.includes('lodash') || id.includes('ramda') || id.includes('date-fns') ||
                  id.includes('moment') || id.includes('dayjs') || id.includes('uuid')) {
                  return 'utils';
               }

               // State Management
               if (id.includes('redux') || id.includes('zustand') || id.includes('recoil') ||
                  id.includes('jotai') || id.includes('valtio') || id.includes('mobx')) {
                  return 'state';
               }

               // Animation libraries
               if (id.includes('framer-motion') || id.includes('react-spring') ||
                  id.includes('react-transition') || id.includes('lottie')) {
                  return 'animation';
               }

               // HTTP & API libraries
               if (id.includes('axios') || id.includes('fetch') || id.includes('ky') ||
                  id.includes('apollo') || id.includes('graphql') || id.includes('relay')) {
                  return 'api';
               }

               // Table & Data libraries
               if (id.includes('react-table') || id.includes('@tanstack/react-table') ||
                  id.includes('ag-grid') || id.includes('react-virtualized')) {
                  return 'tables';
               }

               // Icon libraries
               if (id.includes('react-icons') || id.includes('lucide') || id.includes('@heroicons') ||
                  id.includes('feather') || id.includes('phosphor')) {
                  return 'icons';
               }

               // Testing libraries (if included in build)
               if (id.includes('@testing-library') || id.includes('jest') || id.includes('vitest')) {
                  return 'testing';
               }

               // I18n libraries
               if (id.includes('i18n') || id.includes('react-intl') || id.includes('format')) {
                  return 'i18n';
               }

               // All other node_modules (catch-all)
               if (id.includes('node_modules')) {
                  return 'vendor';
               }

               // App code chunking by feature
               if (id.includes('/src/pages/') || id.includes('/src/views/') || id.includes('/src/screens/')) {
                  return 'pages';
               }
               if (id.includes('/src/components/')) {
                  return 'components';
               }
               if (id.includes('/src/features/') || id.includes('/src/modules/')) {
                  return 'features';
               }
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

   // ULTIMATE AUTO-OPTIMIZATION - Never touch this again!
   optimizeDeps: {
      // Automatically discovers and optimizes ALL dependencies
      auto: true,

      // Forces optimization for better performance
      force: true,

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

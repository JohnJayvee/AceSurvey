import { registerSW } from 'virtual:pwa-register'

class PWAManager {
   constructor() {
      this.updateSW = null
      this.registration = null
      this.allowedPages = []
      this.isMobile = this.checkIfMobile()
      this.isIOS = this.checkIfIOS()
      this.isAndroid = this.checkIfAndroid()
      this.deferredPrompt = null
      this.isInstalled = this.checkIfInstalled() // Add this
   }

   checkIfMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
   }

   checkIfIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent)
   }

   checkIfAndroid() {
      return /Android/.test(navigator.userAgent)
   }

   // Check if app is already installed/running as PWA
   checkIfInstalled() {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
         return true
      }

      // Check if running in fullscreen mode
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
         return true
      }

      // Check for iOS standalone mode
      if (window.navigator.standalone === true) {
         return true
      }

      // Check URL parameters that might indicate installed app
      if (window.location.search.includes('utm_source=pwa')) {
         return true
      }

      return false
   }

   init(options = {}) {
      this.allowedPages = options.installPages || []

      // Don't show install prompts if app is already installed
      if (this.isInstalled) {
         console.log('App is already installed - no install prompts will be shown')
         return
      }

      this.updateSW = registerSW({
         onNeedRefresh: () => {
            this.showUpdatePrompt()
            options.onNeedRefresh?.()
         },
         onOfflineReady: () => {
            this.showOfflineMessage()
            options.onOfflineReady?.()
         },
         onRegistered: (registration) => {
            this.registration = registration
            console.log('SW Registered: ', registration)
            options.onRegistered?.(registration)
         },
         onRegisterError: (error) => {
            console.log('SW registration error', error)
            options.onRegisterError?.(error)
         }
      })

      this.setupInstallPrompt()
      this.setupNetworkDetection()
   }

   shouldShowInstall() {
      // Don't show if already installed
      if (this.isInstalled) return false

      if (this.allowedPages.length === 0) return true
      return this.allowedPages.includes(window.location.pathname)
   }

   setupInstallPrompt() {
      // Don't setup install prompts if already installed
      if (this.isInstalled) return

      window.addEventListener('beforeinstallprompt', (e) => {
         console.log('beforeinstallprompt fired!')
         e.preventDefault()
         this.deferredPrompt = e

         if (this.shouldShowInstall()) {
            this.showInstallButton(this.deferredPrompt)
         }
      })

      // Watch for route changes
      this.watchRoutes()

      window.addEventListener('appinstalled', () => {
         console.log('PWA was installed')
         this.deferredPrompt = null
         this.isInstalled = true // Update installed status
         this.hideInstallButton()

         // Store installation status
         localStorage.setItem('pwa-installed', 'true')
      })

      // Monitor display mode changes
      window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
         if (e.matches) {
            console.log('App opened in standalone mode')
            this.isInstalled = true
            this.hideInstallButton()
         }
      })

      // ONLY show fallback after trying to get real install prompt
      setTimeout(() => {
         if (this.shouldShowInstall() && !this.deferredPrompt && !document.querySelector('.pwa-install-btn')) {
            if (this.isIOS) {
               this.showIOSInstallInstructions()
            } else if (this.isAndroid) {
               this.showAndroidFallbackButton()
            }
         }
      }, 5000)
   }

   watchRoutes() {
      let currentPath = window.location.pathname

      setInterval(() => {
         if (window.location.pathname !== currentPath) {
            currentPath = window.location.pathname

            // Recheck if installed on route change
            this.isInstalled = this.checkIfInstalled()

            const existingButton = document.querySelector('.pwa-install-btn')
            const existingBanner = document.querySelector('.ios-install-banner')

            // Remove existing elements
            if (existingButton) existingButton.remove()
            if (existingBanner) existingBanner.remove()

            // Show appropriate install option only if not installed
            if (this.shouldShowInstall()) {
               if (this.deferredPrompt) {
                  this.showInstallButton(this.deferredPrompt)
               } else {
                  setTimeout(() => {
                     if (this.isIOS && !this.isInstalled) {
                        this.showIOSInstallInstructions()
                     } else if (this.isAndroid && !this.isInstalled) {
                        this.showAndroidFallbackButton()
                     }
                  }, 1000)
               }
            }
         }
      }, 500)
   }

   showInstallButton(deferredPrompt) {
      // Don't show if installed
      if (this.isInstalled) return

      this.hideInstallButton()

      const installButton = document.createElement('button')
      installButton.textContent = '📱 Install App'
      installButton.className = 'pwa-install-btn'
      installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            z-index: 1000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            animation: slideIn 0.3s ease-out;
        `

      installButton.addEventListener('click', async () => {
         if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            console.log(`User response to install prompt: ${outcome}`)

            if (outcome === 'accepted') {
               this.isInstalled = true
               localStorage.setItem('pwa-installed', 'true')
            }

            this.deferredPrompt = null
            installButton.remove()
         }
      })

      document.body.appendChild(installButton)

      // Add CSS animation
      if (!document.querySelector('#pwa-animations')) {
         const style = document.createElement('style')
         style.id = 'pwa-animations'
         style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `
         document.head.appendChild(style)
      }

      setTimeout(() => {
         if (installButton.parentNode) {
            installButton.remove()
         }
      }, 15000)
   }

   showAndroidFallbackButton() {
      // Don't show if installed
      if (this.isInstalled) return

      this.hideInstallButton()

      const fallbackButton = document.createElement('button')
      fallbackButton.textContent = '📱 Install App'
      fallbackButton.className = 'pwa-install-btn'
      fallbackButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #f59e0b;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            z-index: 1000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        `

      fallbackButton.addEventListener('click', () => {
         this.showToast('Tap Chrome menu (⋮) → "Install app" or "Add to Home screen"', '#f59e0b', 8000)
      })

      document.body.appendChild(fallbackButton)

      setTimeout(() => {
         if (fallbackButton.parentNode) {
            fallbackButton.remove()
         }
      }, 15000)
   }

   showIOSInstallInstructions() {
      // Don't show if installed or if real button exists
      if (this.isInstalled || document.querySelector('.ios-install-banner') || document.querySelector('.pwa-install-btn')) return

      const banner = document.createElement('div')
      banner.className = 'ios-install-banner'
      banner.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #2563eb;
                color: white;
                padding: 12px 20px;
                text-align: center;
                z-index: 1001;
                font-size: 14px;
                line-height: 1.4;
            ">
                📱 Install AceSurvey: Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    position: absolute;
                    right: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                ">×</button>
            </div>
        `

      document.body.appendChild(banner)

      setTimeout(() => {
         if (banner.parentNode) {
            banner.remove()
         }
      }, 10000)
   }

   hideInstallButton() {
      const existing = document.querySelector('.pwa-install-btn')
      if (existing) existing.remove()

      const existingBanner = document.querySelector('.ios-install-banner')
      if (existingBanner) existingBanner.remove()
   }

   showToast(message, color, duration = 3000) {
      const toast = document.createElement('div')
      toast.textContent = message
      toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            text-align: center;
            font-weight: 500;
        `
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), duration)
   }

   showUpdatePrompt() {
      if ('Notification' in window && Notification.permission === 'granted') {
         new Notification('AceSurvey Update Available', {
            body: 'Click to update to the latest version',
            icon: '/pwa-192x192.png',
            badge: '/pwa-64x64.png'
         })
      } else {
         const update = confirm('New version available! Update now?')
         if (update) this.update()
      }
   }

   showOfflineMessage() {
      console.log('App is ready to work offline')
      if ('Notification' in window && Notification.permission === 'granted') {
         new Notification('AceSurvey Ready Offline', {
            body: 'You can now use the app without internet',
            icon: '/pwa-192x192.png'
         })
      }
   }

   setupNetworkDetection() {
      window.addEventListener('online', () => {
         console.log('Back online')
         this.showNetworkStatus('online')
      })

      window.addEventListener('offline', () => {
         console.log('Gone offline')
         this.showNetworkStatus('offline')
      })
   }

   showNetworkStatus(status) {
      const toast = document.createElement('div')
      toast.textContent = status === 'online' ? '🟢 Back online!' : '🔴 Working offline'
      toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${status === 'online' ? '#10b981' : '#f59e0b'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
        `

      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
   }

   async update() {
      if (this.updateSW) {
         await this.updateSW(true)
      }
   }

   async requestNotificationPermission() {
      if ('Notification' in window) {
         const permission = await Notification.requestPermission()
         return permission === 'granted'
      }
      return false
   }

   async checkForUpdates() {
      if (this.registration) {
         await this.registration.update()
      }
   }
}

export const pwaManager = new PWAManager()

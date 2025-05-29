import { useState, useEffect } from 'react'
import { pwaManager } from '@services/pwa'

export const usePWA = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isInstalled, setIsInstalled] = useState(false)
    const [updateAvailable, setUpdateAvailable] = useState(false)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Check if app is installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const updateApp = async () => {
        await pwaManager.update()
    }

    const checkForUpdates = async () => {
        await pwaManager.checkForUpdates()
    }

    return {
        isOnline,
        isInstalled,
        updateAvailable,
        updateApp,
        checkForUpdates
    }
}

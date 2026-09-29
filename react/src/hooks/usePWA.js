import { useState, useEffect } from 'react'
import { pwaManager } from '@services/pwa'

export const usePWA = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isInstalled, setIsInstalled] = useState(false)
    const [updateAvailable, setUpdateAvailable] = useState(Boolean(pwaManager.updateAvailable))

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)
        const handleUpdate = () => setUpdateAvailable(true)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        window.addEventListener('pwa:update-available', handleUpdate)

        // Check if app is installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener('pwa:update-available', handleUpdate)
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

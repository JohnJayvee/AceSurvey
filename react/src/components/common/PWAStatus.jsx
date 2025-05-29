import React from 'react'
import { usePWA } from '@hooks/usePWA'

const PWAStatus = () => {
    const { isOnline, isInstalled, updateApp, checkForUpdates } = usePWA()

    return (
        <div className="pwa-status">
            <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? '🟢 Online' : '🔴 Offline'}
            </div>

            {isInstalled && (
                <div className="pwa-controls">
                    <button onClick={checkForUpdates}>
                        Check Updates
                    </button>
                    <button onClick={updateApp}>
                        Update App
                    </button>
                </div>
            )}
        </div>
    )
}

export default PWAStatus

import React from 'react';

export default function DashboardCard({ children, className, animationDelay }) {
    return (
        <div
            className={`bg-white shadow-md rounded-lg ${className}`}
            style={animationDelay ? { animationDelay: `${animationDelay}s` } : {}}
        >
            {children}
        </div>
    );
}


import React from 'react';
import './Loading.css'; // Import the CSS with animation styles

const Loading = () => {
    return (
        <div className="loading-container">
            <div className="loading-logo-container">
                <img src="/AceLogo.png" alt="Loading" className="loading-logo" />
            </div>
        </div>
    );
};

export default Loading;

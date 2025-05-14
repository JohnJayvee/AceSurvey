import React from 'react';
import './css/AnimatedBackground.css';

const AnimatedBackground = () => {
    const getRandomColor = () => {
        // Use more vibrant colors with lower opacity
        return Math.random() < 0.5
            ? 'rgba(255, 0, 0, 0.2)' // Pure red with 20% opacity
            : 'rgba(0, 255, 0, 0.2)'; // Pure green with 20% opacity
    };

    return (
        <div className="animated-lines">
            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="line"
                    style={{
                        backgroundColor: getRandomColor()
                    }}
                />
            ))}
        </div>
    );
};

export default AnimatedBackground;

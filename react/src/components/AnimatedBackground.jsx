import React, { memo } from 'react';
import './css/AnimatedBackground.css';

const AnimatedBackground = memo(() => {
    const getRandomColor = () => {
        // Pure red and green with consistent 20% opacity
        return Math.random() < 0.5
            ? 'rgba(255, 0, 0, 0.2)' // Pure red with 20% opacity
            : 'rgba(0, 255, 0, 0.2)'; // Pure green with 20% opacity
    };

    return (
        <div className="fixed inset-0 animated-lines">
            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="line"
                    style={{
                        backgroundColor: getRandomColor(),
                        willChange: 'transform' // Performance hint for browsers
                    }}
                />
            ))}
        </div>
    );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;

import React, { memo, useMemo } from 'react';
import '@css/AnimatedBackground.css';

const AnimatedBackground = memo(() => {

    const lineColors = useMemo(() => {
        const colors = [];
        for (let i = 0; i < 12; i++) {
            colors.push(Math.random() < 0.5
                ? 'rgba(255, 0, 0, 0.2)' // Pure red with 20% opacity
                : 'rgba(0, 255, 0, 0.2)' // Pure green with 20% opacity
            );
        }
        return colors;
    }, []);

    return (
        <div className="fixed inset-0 animated-lines">
            {Array.from({ length: 12 }).map((_, index) => (
                <div
                    key={index}
                    className="line"
                    style={{
                        backgroundColor: lineColors[index],
                        willChange: 'transform', // Performance hint for browsers
                        transform: 'translateZ(0)' // Force hardware acceleration
                    }}
                />
            ))}
        </div>
    );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;

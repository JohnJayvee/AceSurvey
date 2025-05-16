import React from 'react';
import { motion } from 'framer-motion';
import './css/Loading.css';

const Loading = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50"
        >
            <div className="relative flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.5,
                        ease: "easeOut"
                    }}
                    className="loading-logo-container"
                >
                    <img
                        src="/AceLogo.png"
                        loading="lazy"
                        alt="Loading"
                        className="loading-logo"
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-center"
                >
                    <h2 className="text-xl font-semibold text-gray-900">Loading</h2>
                    <p className="mt-1 text-sm text-gray-500">Please wait...</p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Loading;

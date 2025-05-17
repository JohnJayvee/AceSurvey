import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ErrorMessage({ error, onClear }) {
    if (!error) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 overflow-hidden bg-white border border-red-200 rounded-lg shadow-lg"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-1.5 bg-gradient-to-r from-red-400 via-red-500 to-red-600"
                />

                <div className="p-4">
                    <div className="flex items-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 15,
                                delay: 0.1
                            }}
                            className="flex-shrink-0 p-2 bg-red-100 rounded-full"
                        >
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </motion.div>

                        <div className="flex-1 ml-3">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-sm font-medium text-gray-800"
                            >
                                <div dangerouslySetInnerHTML={{ __html: error }} />
                            </motion.div>
                        </div>

                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{
                                scale: 1.1,
                                backgroundColor: "#FEE2E2",
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ delay: 0.3 }}
                            onClick={onClear}
                            className="p-1 ml-auto text-red-500 rounded-md hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <span className="sr-only">Dismiss</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mt-3 h-0.5 bg-red-100 origin-left"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-2"
                    >
                        <button
                            onClick={onClear}
                            className="text-xs font-medium text-red-700 transition-colors duration-200 hover:text-red-900"
                        >
                            Dismiss this message
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// In your Login.jsx and other components:
// import ErrorMessage from "../components/ErrorMessage";

// Then replace the error JSX with:
// <ErrorMessage error={error} onClear={clearError} />

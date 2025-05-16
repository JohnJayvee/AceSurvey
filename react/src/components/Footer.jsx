import React from "react";
import { motion } from "framer-motion";

const Footer = ({ className = "" }) => (
    <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative w-full px-6 py-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm ${className}`}
    >
        <div className="container mx-auto">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-sm text-gray-600">
                    © {new Date().getFullYear()} All rights reserved by{" "}
                    <span className="font-medium text-gray-900">
                        Management Information System
                    </span>
                </p>

                <div className="flex items-center space-x-4">
                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="#"
                        className="text-sm text-gray-600 transition-colors hover:text-blue-600"
                    >
                        Privacy Policy
                    </motion.a>
                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="#"
                        className="text-sm text-gray-600 transition-colors hover:text-blue-600"
                    >
                        Terms of Service
                    </motion.a>
                </div>
            </div>
        </div>
    </motion.footer>
);

export default Footer;

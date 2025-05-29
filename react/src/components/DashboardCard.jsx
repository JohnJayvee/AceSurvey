import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardCard({ children, className = "", animationDelay = 0 }) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{
            duration: 0.5,
            delay: animationDelay,
            ease: "easeOut"
         }}
         whileHover={{
            y: -5,
            transition: { duration: 0.2 }
         }}
         className={`
                relative overflow-hidden
                bg-white rounded-xl
                border border-gray-100
                shadow-sm hover:shadow-md
                transition-all duration-200
                z-[var(--z-card)]
                hover:z-[var(--z-card-hover)]
                ${className}
            `}
      >
         {/* Gradient overlay */}
         <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/30" />

         {/* Card content */}
         <div className="relative z-[var(--z-card-content)]">
            {children}
         </div>
      </motion.div>
   );
}

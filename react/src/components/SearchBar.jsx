import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchBar({ searchTerm, onSearch, placeholder = "Search surveys..." }) {
   return (
      <motion.div
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="relative group"
      >
         <div className="relative flex items-center">
            <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 transition-colors duration-200 left-3 group-hover:text-blue-500" />
            <input
               type="text"
               placeholder={placeholder}
               className="w-full px-10 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg
                        placeholder:text-gray-400
                        transition-all duration-200
                        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                        hover:border-blue-200"
               value={searchTerm}
               onChange={(e) => onSearch(e.target.value)}
            />
            <AnimatePresence>
               {searchTerm && (
                  <motion.button
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={() => onSearch('')}
                     className="absolute p-1 transition-colors duration-200 rounded-full right-3 hover:bg-gray-100"
                  >
                     <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </motion.button>
               )}
            </AnimatePresence>
         </div>
      </motion.div>
   );
}

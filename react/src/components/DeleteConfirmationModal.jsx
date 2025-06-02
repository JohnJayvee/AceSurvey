import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel, title, message, confirmText, cancelText }) => {
   return (
      <AnimatePresence>
         {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-50 backdrop-blur-sm">
               <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-2xl"
               >
                  {/* Close Button */}
                  <button
                     onClick={onCancel}
                     className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100"
                  >
                     <XMarkIcon className="w-5 h-5" />
                  </button>

                  <div className="p-6">
                     {/* Icon */}
                     <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                     </div>

                     {/* Title */}
                     <h3 className="mb-2 text-lg font-semibold text-center text-gray-900">
                        {title || "Delete Survey"}
                     </h3>

                     {/* Message */}
                     <p className="mb-6 text-sm leading-relaxed text-center text-gray-600">
                        {message || "Are you sure you want to delete this survey? This action cannot be undone and all associated data will be permanently removed."}
                     </p>

                     {/* Action Buttons */}
                     <div className="flex flex-col justify-center gap-3 sm:flex-row-reverse">
                        <button
                           onClick={onConfirm}
                           className="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg sm:w-auto hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                        >
                           {confirmText || "Yes, delete"}
                        </button>
                        <button
                           onClick={onCancel}
                           className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg sm:w-auto hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                        >
                           {cancelText || "Cancel"}
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
   );
};

export default DeleteConfirmationModal;

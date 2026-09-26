import React from 'react';
import { motion } from 'framer-motion';
import { PhotoIcon } from "@heroicons/react/24/outline";

const SurveyFormFields = ({ survey, setSurvey, updateSurveyField, onImageChange, width, logo }) => {
   const isSurveyExpired = (expireDate) => {
      if (!expireDate) return false;
      const today = new Date().setHours(0, 0, 0, 0);
      const expiration = new Date(`${expireDate}T00:00:00`).getTime();
      return expiration < today;
   };

   const hasExpiration = survey.expire_date !== null && survey.expire_date !== undefined;
   const defaultExpiration = () => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
   };

   const handleFieldChange = (field, value) => {
      if (updateSurveyField) {
         updateSurveyField(field, value);
      } else {
         setSurvey(prev => ({ ...prev, [field]: value }));
      }
   };

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="overflow-hidden bg-white shadow-sm rounded-xl"
      >
         <div className="p-3 space-y-4 sm:p-4 md:p-6 lg:p-8 sm:space-y-6">
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
               {/* Image Section */}
               <div className="space-y-3 sm:space-y-4">
                  <div className="overflow-hidden rounded-lg aspect-video bg-gray-50">
                     {survey.image_url ? (
                        <img
                           src={survey.image_url}
                           alt="Survey cover"
                           className="object-cover w-full h-full transition-all duration-300 hover:scale-105"
                        />
                     ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-50">
                           <img
                              src={logo}
                              alt="Default Survey"
                              className="object-cover w-auto h-full transition-all duration-300 hover:scale-105"
                           />
                        </div>
                     )}
                  </div>
                  <div className="relative group">
                     <input
                        type="file"
                        accept="image/*"
                        onChange={onImageChange}
                        className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer"
                     />
                     <button
                        type="button"
                        className="relative flex items-center justify-center w-full gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                     >
                        <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        Choose Image
                     </button>
                  </div>
               </div>

               {/* Form Fields */}
               <div className="space-y-4 sm:space-y-6">
                  {/* Title Field */}
                  <div className="relative p-3 sm:p-4 group">
                     <label className="inline-flex items-center mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base font-semibold text-gray-900">
                        <span>Survey Title</span>
                        <span className="ml-1 text-red-500">*</span>
                     </label>
                     <div className="relative">
                        <input
                           type="text"
                           value={survey.title || ""}
                           onChange={(ev) => handleFieldChange('title', ev.target.value)}
                           className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                           placeholder="Enter survey title"
                        />
                     </div>
                  </div>

                  {/* Description Field */}
                  <div className="relative p-3 sm:p-4 group">
                     <label className="inline-flex items-center mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base font-semibold text-gray-900">
                        <span>Description</span>
                        <span className="ml-1 text-red-500">*</span>
                     </label>
                     <div className="relative">
                        <textarea
                           value={survey.description || ""}
                           onChange={(ev) => handleFieldChange('description', ev.target.value)}
                           rows={width < 640 ? 2 : width < 768 ? 3 : 4}
                           className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                           placeholder="Describe your survey"
                        />
                     </div>
                     <p className="mt-1 text-xs leading-tight text-gray-500 sm:mt-2">
                        Provide a clear description of your survey's purpose and objectives
                     </p>
                  </div>

                  {/* Expire Date Field */}
                  <div className="relative p-3 sm:p-4 group">
                     <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-900">
                        <input type="checkbox" checked={hasExpiration} onChange={event => handleFieldChange('expire_date', event.target.checked ? defaultExpiration() : null)} aria-controls="survey-expiration-date" />
                        Set an expiration date
                     </label>
                     {hasExpiration ? <>
                     <label htmlFor="survey-expiration-date" className="block mb-2 text-sm font-medium">Expiration date</label>
                     <div className="relative">
                        <input
                           id="survey-expiration-date"
                           type="date"
                           required
                           value={survey.expire_date || ""}
                           onChange={(ev) => handleFieldChange('expire_date', ev.target.value)}
                           className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                           style={{ colorScheme: 'light' }}
                        />
                     </div>
                     <p className="mt-2 text-xs text-gray-500">Accept responses through the end of this date.</p>
                     </> : <p className="text-sm text-gray-500">No expiration. This survey stays open until you turn off Survey Status.</p>}
                     {isSurveyExpired(survey.expire_date) && (
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-xs text-red-600">
                           <svg className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           <span className="leading-tight">This survey has expired and is closed to responses</span>
                        </div>
                     )}
                  </div>

                  {/* Status Toggle */}
                  <div className="relative p-3 transition-all duration-200 bg-white border border-gray-100 rounded-lg sm:p-4 hover:border-blue-200">
                     <label className="inline-flex items-center mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base font-semibold text-gray-900">
                        <span>Survey Status</span>
                     </label>
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 rounded-lg bg-gray-50 gap-2.5 sm:gap-0">
                        <div>
                           <p className="text-xs font-medium leading-tight text-gray-900 sm:text-sm">
                              {survey.status && !isSurveyExpired(survey.expire_date)
                                 ? "Currently accepting responses"
                                 : "Not accepting responses"}
                           </p>
                           <p className="text-xs text-gray-500 leading-tight mt-0.5">
                              Toggle to enable or disable survey responses
                           </p>
                        </div>
                        <div className="flex items-center justify-center sm:justify-end">
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                 type="checkbox"
                                 checked={survey.status && !isSurveyExpired(survey.expire_date)}
                                 onChange={(ev) => {
                                    const isChecked = ev.target.checked;
                                    const isExpired = isSurveyExpired(survey.expire_date);
                                    handleFieldChange('status', isChecked && !isExpired);
                                 }}
                                 className="sr-only peer"
                                 disabled={isSurveyExpired(survey.expire_date)}
                              />
                              <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-disabled:bg-gray-100 peer-disabled:after:bg-gray-300">
                              </div>
                              <span className="ml-2 text-xs font-medium text-gray-700 sm:ml-3 sm:text-sm peer-checked:text-blue-600 peer-disabled:text-gray-400">
                                 {survey.status && !isSurveyExpired(survey.expire_date) ? 'Active' : 'Inactive'}
                              </span>
                           </label>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </motion.div>
   );
};

export default SurveyFormFields;

import React from "react";
import { motion } from "framer-motion";

export default function PublicQuestionView({ question, index, answerChanged }) {
   let selectedOptions = [];

   function onCheckboxChanged(option, $event) {
      if ($event.target.checked) {
         selectedOptions.push(option.text);
      } else {
         selectedOptions = selectedOptions.filter(
            (op) => op !== option.text
         );
      }
      answerChanged(selectedOptions);
   }

   const inputBaseClass = "w-full transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: index * 0.1 }}
         className="p-6 my-4 transition-shadow duration-200 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md"
      >
         <fieldset>
            <div className="flex items-start gap-3 mb-4">
               <span className="flex items-center justify-center w-6 h-6 text-sm font-semibold text-white bg-blue-600 rounded-full shrink-0">
                  {index + 1}
               </span>
               <div>
                  <legend className="text-lg font-semibold text-gray-900">
                     {question.question}
                  </legend>
                  {question.description && (
                     <p className="mt-2 text-sm text-gray-500">
                        {question.description}
                     </p>
                  )}
               </div>
            </div>

            <div className="mt-4 ml-9">
               {question.type === "dropdown" && (
                  <select
                     onChange={(ev) => answerChanged(ev.target.value)}
                     className={`${inputBaseClass} px-4 py-2.5 bg-white cursor-pointer hover:border-blue-200`}
                  >
                     <option value="">Please Select</option>
                     {question.data.options.map((option) => (
                        <option key={option.uuid} value={option.text}>
                           {option.text}
                        </option>
                     ))}
                  </select>
               )}

               {question.type === "multiple choice" && (
                  <div className="space-y-2">
                     {question.data.options.map((option) => (
                        <label
                           key={option.uuid}
                           className="flex items-center p-3 transition-colors duration-200 border border-gray-100 rounded-lg hover:bg-gray-50"
                        >
                           <input
                              id={option.uuid}
                              name={"question" + question.id}
                              value={option.text}
                              onChange={(ev) => answerChanged(ev.target.value)}
                              type="radio"
                              className="w-5 h-5 text-blue-600 transition-colors duration-200 border-2 border-gray-300 rounded-full cursor-pointer focus:ring-blue-500 focus:ring-offset-0"
                           />
                           <span className="ml-3 font-medium text-gray-700">
                              {option.text}
                           </span>
                        </label>
                     ))}
                  </div>
               )}

               {question.type === "checkboxes" && (
                  <div className="space-y-2">
                     {question.data.options.map((option) => (
                        <label
                           key={option.uuid}
                           className="flex items-center p-3 transition-colors duration-200 border border-gray-100 rounded-lg hover:bg-gray-50"
                        >
                           <input
                              id={option.uuid}
                              onChange={(ev) => onCheckboxChanged(option, ev)}
                              type="checkbox"
                              className="w-5 h-5 text-blue-600 transition-colors duration-200 border-2 border-gray-300 rounded cursor-pointer focus:ring-blue-500 focus:ring-offset-0"
                           />
                           <span className="ml-3 font-medium text-gray-700">
                              {option.text}
                           </span>
                        </label>
                     ))}
                  </div>
               )}

               {question.type === "short answer" && (
                  <input
                     type="text"
                     onChange={(ev) => answerChanged(ev.target.value)}
                     placeholder="Your answer"
                     className={`${inputBaseClass} px-4 py-2.5`}
                  />
               )}

               {question.type === "paragraph" && (
                  <textarea
                     onChange={(ev) => answerChanged(ev.target.value)}
                     rows={4}
                     placeholder="Your answer"
                     className={`${inputBaseClass} px-4 py-2.5 resize-none`}
                  />
               )}
            </div>
         </fieldset>
      </motion.div>
   );
}

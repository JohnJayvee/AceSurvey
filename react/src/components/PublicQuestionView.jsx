import PropTypes from 'prop-types';

import { motion } from "framer-motion";
import { MAX_ANSWER_LENGTH } from '../utils/surveyValidation';

export default function PublicQuestionView({ question, index, answer, answerChanged, error }) {
   const validationProps = { 'aria-invalid': Boolean(error), 'aria-describedby': error ? 'question-error-' + question.id : undefined };
   const options = question.data?.options || [];
   function onCheckboxChanged(option, event) {
      const selected = Array.isArray(answer) ? answer : [];
      answerChanged(event.target.checked ? [...new Set([...selected, option.text])] : selected.filter(value => value !== option.text));
   }

   const inputBaseClass = "w-full transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.15 }}
         className="ace-question bg-white"
      >
         <fieldset id={'question-' + question.id} aria-labelledby={"question-label-" + question.id}>
            <div className="flex items-start gap-3 mb-4">
               <span className="flex items-center justify-center w-6 h-6 text-sm font-semibold text-white bg-blue-600 rounded-full shrink-0">
                  {index + 1}
               </span>
               <div>
                  <h2 id={"question-label-" + question.id} className="text-lg font-semibold text-gray-900">
                     {question.question}
                  </h2>
                  {question.description && (
                     <p className="mt-2 text-sm text-gray-500">
                        {question.description}
                     </p>
                  )}
               </div>
            </div>

            <div className="mt-4 ml-9">
               {question.type === "dropdown" && (
                  <select aria-labelledby={"question-label-" + question.id}
                     {...validationProps}
                     value={answer || ""}
                     onChange={(ev) => answerChanged(ev.target.value)}
                     className={`${inputBaseClass} px-4 py-2.5 bg-white cursor-pointer hover:border-blue-200`}
                  >
                     <option value="">Please Select</option>
                     {options.map((option) => (
                        <option key={option.uuid} value={option.text}>
                           {option.text}
                        </option>
                     ))}
                  </select>
               )}

               {question.type === "multiple choice" && (
                  <div className="space-y-2">
                     {options.map((option) => (
                        <label
                           key={option.uuid}
                           className="flex items-center p-3 transition-colors duration-200 border border-gray-100 rounded-lg hover:bg-gray-50"
                        >
                           <input
                              {...validationProps}
                              id={option.uuid}
                              name={"question" + question.id}
                              value={option.text}
                              onChange={(ev) => answerChanged(ev.target.value)}
                              checked={answer === option.text}
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
                     {options.map((option) => (
                        <label
                           key={option.uuid}
                           className="flex items-center p-3 transition-colors duration-200 border border-gray-100 rounded-lg hover:bg-gray-50"
                        >
                           <input
                              {...validationProps}
                              id={option.uuid}
                              onChange={(ev) => onCheckboxChanged(option, ev)}
                              checked={Array.isArray(answer) && answer.includes(option.text)}
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
                     {...validationProps}
                     maxLength={MAX_ANSWER_LENGTH}
                     value={answer || ""}
                     type="text"
                     aria-labelledby={"question-label-" + question.id}
                     onChange={(ev) => answerChanged(ev.target.value)}
                     placeholder="Your answer"
                     className={`${inputBaseClass} px-4 py-2.5`}
                  />
               )}

               {question.type === "paragraph" && (
                  <textarea aria-labelledby={"question-label-" + question.id}
                     {...validationProps}
                     maxLength={MAX_ANSWER_LENGTH}
                     value={answer || ""}
                     onChange={(ev) => answerChanged(ev.target.value)}
                     rows={4}
                     placeholder="Your answer"
                     className={`${inputBaseClass} px-4 py-2.5 resize-none`}
                  />
               )}
            </div>
            {error && <p id={'question-error-' + question.id} className="mt-3 ml-9 text-red-700">{error}</p>}
         </fieldset>
      </motion.div>
   );
}
PublicQuestionView.propTypes = {
   question: PropTypes.object,
   index: PropTypes.number,
   answer: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
   answerChanged: PropTypes.func,
   error: PropTypes.string,
};

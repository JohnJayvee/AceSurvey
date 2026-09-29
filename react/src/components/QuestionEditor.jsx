import PropTypes from 'prop-types';

import { useStateContext } from "@context/ContextProvider";
import { TrashIcon, PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";
import { Divider } from "@mui/material";


import Select from "react-select";
import {
   FaAlignJustify,
   FaGripLines,
   FaRegCheckSquare,
   FaRegCircle,
   FaSortDown,
} from "react-icons/fa";

import { motion } from "framer-motion";

export default function QuestionEditor({
   index = 0,
   question,
   addQuestion,
   deleteQuestion,
   questionChange,
}) {
   const model = question;
   const setModel = questionChange;
   const { questionTypes } = useStateContext();



   function upperCaseFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
   }

   function shouldHaveOptions(type = null) {
      type = type || model.type;
      return ["dropdown", "multiple choice", "checkboxes"].includes(type);
   }

   function onTypeChange(option) {
      const newModel = {
         ...model,
         type: option.value,
      };
      if (!shouldHaveOptions(model.type) && shouldHaveOptions(option.value)) {
         if (!model.data?.options) {
            newModel.data = {
               options: [{ uuid: uuidv4(), text: "" }],
            };
         }
      }
      setModel(newModel);
   }

   function addOption() {
      setModel({ ...model, data: { ...model.data, options: [...(model.data?.options || []), { uuid: uuidv4(), text: '' }] } });
   }

   function deleteOption(op) {
      setModel({ ...model, data: { ...model.data, options: (model.data?.options || []).filter(option => option.uuid !== op.uuid) } });
   }

   const questionTypeOptions = questionTypes.map((type) => ({
      value: type,
      label: (
         <div className="flex items-center cursor-pointer">
            {getIcon(type)}
            <span className="ml-2">{upperCaseFirst(type)}</span>
         </div>
      ),
   }));

   function getIcon(type) {
      switch (type) {
         case "short answer":
            return <FaGripLines className="w-4 h-4" />;
         case "paragraph":
            return <FaAlignJustify className="w-4 h-4" />;
         case "checkboxes":
            return <FaRegCheckSquare className="w-4 h-4" />;
         case "multiple choice":
            return <FaRegCircle className="w-4 h-4" />;
         case "dropdown":
            return <FaSortDown className="w-4 h-4" />;
         default:
            return null;
      }
   }

   const customStyles = {
      control: (provided, state) => ({
         ...provided,
         minHeight: "38px",
         cursor: "pointer",
         borderColor: state.isFocused ? 'var(--ace-accent)' : '#e5e7eb',
         boxShadow: state.isFocused ? '0 0 0 1px var(--ace-accent)' : 'none',
         '&:hover': {
            borderColor: 'var(--ace-accent)'
         }
      }),
      option: (provided, state) => ({
         ...provided,
         backgroundColor: state.isSelected ? 'var(--ace-accent)' : state.isFocused ? '#e5e7eb' : 'white',
         color: state.isSelected ? 'var(--ace-on-accent)' : '#374151',
         cursor: 'pointer',
         '&:active': {
            backgroundColor: 'var(--ace-accent)',
            color: 'var(--ace-on-accent)'
         }
      }),
      menu: (provided) => ({
         ...provided,
         boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
         borderRadius: '0.5rem'
      }),
      valueContainer: (provided) => ({
         ...provided,
         padding: '0 12px'
      }),
      input: (provided) => ({
         ...provided,
         margin: '0'
      }),
      indicatorSeparator: () => ({
         display: 'none'
      }),
      indicatorsContainer: (provided) => ({
         ...provided,
         height: '38px'
      })
   };

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3 }}
         className="p-6 my-4 transition-shadow duration-200 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md"
      >
         <div className="flex flex-col justify-between gap-4 lg:flex-row">
            {/* Question Text */}
            <div className="flex w-full">
               <span className="flex items-center self-center justify-center w-8 h-8 mr-3 text-sm font-semibold text-white bg-blue-600 rounded-full">
                  {index + 1}
               </span>
               <input
                  type="text"
                  name="question"
                  placeholder="Question"
                  value={model.question}
                  onChange={(ev) => setModel({ ...model, question: ev.target.value })}
                  className="w-full px-4 py-2 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-200"
               />
            </div>

            {/* Question Type */}
            <div className="relative min-w-[12rem] lg:w-1/3">
               <Select
                  value={questionTypeOptions.find(option => option.value === model.type)}
                  onChange={onTypeChange}
                  options={questionTypeOptions}
                  styles={customStyles}
                  className="text-sm"
                  isSearchable={false}
               />
            </div>
         </div>

         {shouldHaveOptions() && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="mt-6 space-y-3"
            >
               {(model.data?.options || []).length === 0 && (
                  <div className="p-4 text-sm text-center text-gray-500 rounded-lg bg-gray-50">
                     No options defined yet
                  </div>
               )}

               {(model.data?.options || []).map((op, ind) => (
                  <motion.div
                     key={op.uuid}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="flex items-center gap-2"
                  >
                     {model.type === "multiple choice" && (
                        <div className="flex items-center justify-center w-6 h-6">
                           <input
                              type="radio"
                              className="w-4 h-4 text-blue-600 border-gray-300 cursor-not-allowed focus:ring-blue-500"
                              disabled
                           />
                        </div>
                     )}
                     {model.type === "checkboxes" && (
                        <div className="flex items-center justify-center w-6 h-6">
                           <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-not-allowed focus:ring-blue-500"
                              disabled
                           />
                        </div>
                     )}
                     {model.type === "dropdown" && (
                        <span className="flex items-center justify-center w-6 h-6 text-sm text-gray-500">
                           {ind + 1}.
                        </span>
                     )}
                     <input
                        type="text"
                        placeholder="Option text"
                        value={op.text}
                        onChange={(ev) => {
                           setModel({ ...model, data: { ...model.data, options: model.data.options.map(option => option.uuid === op.uuid ? { ...option, text: ev.target.value } : option) } });
                        }}
                        className="flex-1 px-4 py-2 text-sm text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-200"
                     />
                     <motion.button
                        type="button"
                        aria-label="Delete option"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteOption(op)}
                        className="p-2 text-gray-400 transition-colors rounded-full hover:bg-red-50 hover:text-red-500"
                     >
                        <XMarkIcon className="w-5 h-5" />
                     </motion.button>
                  </motion.div>
               ))}

               <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addOption}
                  className="flex items-center px-4 py-2 mt-3 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
               >
                  <PlusCircleIcon className="w-5 h-5 mr-2" />
                  Add Option
               </motion.button>
            </motion.div>
         )}

         <Divider className="my-6" />

         <div className="flex justify-end gap-2">
            <motion.button
               type="button"
               aria-label="Add question below"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => addQuestion(index + 1)}
               className="p-2 text-gray-500 transition-colors rounded-full hover:bg-green-50 hover:text-green-600"
            >
               <PlusCircleIcon className="w-6 h-6" />
            </motion.button>
            <motion.button
               type="button"
               aria-label="Delete question"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => deleteQuestion(question)}
               className="p-2 text-gray-500 transition-colors rounded-full hover:bg-red-50 hover:text-red-600"
            >
               <TrashIcon className="w-6 h-6" />
            </motion.button>
         </div>
      </motion.div>
   );
}
QuestionEditor.propTypes = {
   index: PropTypes.number,
   question: PropTypes.object,
   addQuestion: PropTypes.func,
   deleteQuestion: PropTypes.func,
   questionChange: PropTypes.func,
};

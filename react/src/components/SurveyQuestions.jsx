import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import QuestionEditor from "@components/QuestionEditor";

export default function SurveyQuestions({ questions, onQuestionsUpdate }) {
   const [myQuestions, setMyQuestions] = useState([...questions]);

   const addQuestion = (index) => {
      index = index !== undefined ? index : myQuestions.length;
      myQuestions.splice(index, 0, {
         id: uuidv4(),
         type: "short answer",
         question: "",
         description: "",
         data: {},
      });
      setMyQuestions([...myQuestions]);
      onQuestionsUpdate(myQuestions);
   };

   const questionChange = (question) => {
      if (!question) return;
      const newQuestions = myQuestions.map((q) => {
         if (q.id == question.id) {
            return { ...question };
         }
         return q;
      });
      setMyQuestions(newQuestions);
      onQuestionsUpdate(newQuestions);
   };

   const deleteQuestion = (question) => {
      const newQuestions = myQuestions.filter((q) => q.id !== question.id);
      setMyQuestions(newQuestions);
      onQuestionsUpdate(newQuestions);
   };

   useEffect(() => {
      setMyQuestions(questions);
   }, [questions]);

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="space-y-6"
      >
         <div className="flex items-center justify-between mt-4">
            <motion.h3
               initial={{ x: -20 }}
               animate={{ x: 0 }}
               className="text-2xl font-bold text-gray-900"
            >
               Questions
            </motion.h3>
            <motion.button
               type="button"
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 transition-all duration-200 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
               onClick={() => addQuestion()}
            >
               <PlusIcon className="w-5 h-5 mr-2" />
               Add Question
            </motion.button>
         </div>

         <AnimatePresence mode="popLayout">
            {myQuestions.length ? (
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
               >
                  {myQuestions.map((q, ind) => (
                     <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: ind * 0.1 }}
                     >
                        <QuestionEditor
                           index={ind}
                           question={q}
                           questionChange={questionChange}
                           addQuestion={addQuestion}
                           deleteQuestion={deleteQuestion}
                        />
                     </motion.div>
                  ))}
               </motion.div>
            ) : (
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl"
               >
                  <div className="p-3 mb-4 bg-gray-100 rounded-full">
                     <PlusIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                     No questions created yet
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                     Click the "Add Question" button to get started
                  </p>
               </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
   );
}

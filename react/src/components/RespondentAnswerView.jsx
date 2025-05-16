import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function RespondentAnswerView({ question, index, answer }) {
    const [selectedOptions, setSelectedOptions] = useState([]);

    useEffect(() => {
        if (question.type === "checkboxes") {
            setSelectedOptions(answer ? JSON.parse(answer) : []);
        }
    }, [answer, question.type]);

    const inputClassName = "w-full px-4 py-3 text-gray-700 transition-colors duration-200 bg-white border border-gray-200 rounded-lg cursor-not-allowed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
    const radioCheckboxClassName = "peer w-5 h-5 text-blue-600 transition-colors duration-200 border-2 border-gray-300 cursor-not-allowed focus:ring-blue-500 focus:ring-offset-0";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl"
        >
            <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 text-sm font-semibold text-white bg-blue-600 rounded-full shrink-0">
                    {index + 1}
                </span>
                <div className="w-full space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {question.question}
                        </h3>
                        {question.description && (
                            <p className="mt-1 text-sm text-gray-500">
                                {question.description}
                            </p>
                        )}
                    </div>

                    <div className="w-full">
                        {question.type === "dropdown" && (
                            <select
                                value={answer || ""}
                                className={inputClassName}
                                disabled
                            >
                                <option value="">Select an option</option>
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
                                            type="radio"
                                            name={`question_${question.id}`}
                                            value={option.text}
                                            checked={answer === option.text}
                                            className={`${radioCheckboxClassName} rounded-full`}
                                            disabled
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
                                            type="checkbox"
                                            checked={selectedOptions.includes(option.text)}
                                            className={`${radioCheckboxClassName} rounded`}
                                            disabled
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
                                value={answer || ""}
                                placeholder="Short answer text"
                                className={inputClassName}
                                disabled
                            />
                        )}

                        {question.type === "paragraph" && (
                            <textarea
                                value={answer || ""}
                                rows={4}
                                placeholder="Long answer text"
                                className={`${inputClassName} resize-none`}
                                disabled
                            />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

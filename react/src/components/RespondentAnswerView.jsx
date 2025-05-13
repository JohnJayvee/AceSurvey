import React, { useEffect, useState } from "react";

export default function RespondentAnswerView({ question, index, answer }) {
    const [selectedOptions, setSelectedOptions] = useState([]);

    useEffect(() => {
        if (question.type === "checkboxes") {
            // Handle the case where answer is a comma-separated string
            setSelectedOptions(answer ? JSON.parse(answer) : []);
        }
    }, [answer, question.type]);

    function onCheckboxChanged(option, $event) {
        const updatedOptions = $event.target.checked
            ? [...selectedOptions, option.text]
            : selectedOptions.filter((op) => op !== option.text);

        setSelectedOptions(updatedOptions);
    }

    return (
        <div className="p-4 my-4 bg-white border border-gray-200 rounded-lg">
            <fieldset className="mb-4">
                <div>
                    <legend className="text-base font-semibold text-gray-900">
                        {index + 1}. {question.question}
                    </legend>
                    <p className="text-sm text-gray-500 ">
                        {question.description}
                    </p>
                </div>
                <div className="mt-3">
                    {question.type === "dropdown" && (
                        <div>
                            <select
                                value={answer || ""}
                                className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none form-control sm:text-sm"
                                disabled
                            >
                                <option value="">Please Select</option>
                                {question.data.options.map((option) => (
                                    <option
                                        key={option.uuid}
                                        value={option.text}
                                    >
                                        {option.text}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {question.type === "multiple choice" && (
                        <div>
                            {question.data.options.map((option) => (
                                <div
                                    key={option.uuid}
                                    className="flex items-center"
                                >
                                    <input
                                        id={option.uuid}
                                        name={"question" + question.id}
                                        value={option.text}
                                        checked={answer === option.text}
                                        type="radio"
                                        className="w-5 h-5 my-1 text-gray-600 border-gray-300 cursor-pointer"
                                        disabled
                                    />
                                    <label
                                        htmlFor={option.uuid}
                                        className="block ml-3 text-base text-gray-700"
                                    >
                                        {option.text}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                    {question.type === "checkboxes" && (
                        <div>
                            {question.data.options.map((option) => (
                                <div
                                    key={option.uuid}
                                    className="flex items-center"
                                >
                                    <input
                                        id={option.uuid}
                                        checked={selectedOptions.includes(
                                            option.text
                                        )}
                                        onChange={(ev) =>
                                            onCheckboxChanged(option, ev)
                                        }
                                        type="checkbox"
                                        className="w-5 h-4 my-1 text-gray-600 border-gray-300 rounded cursor-pointer"
                                        disabled
                                    />
                                    <label
                                        htmlFor={option.uuid}
                                        className="block ml-3 text-base text-gray-700"
                                    >
                                        {option.text}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                    {question.type === "short answer" && (
                        <div>
                            <input
                                type="text"
                                value={answer || ""}
                                className="w-full p-2 border-gray-300 rounded-md shadow-sm form-control sm:text-sm"
                                disabled
                            />
                        </div>
                    )}
                    {question.type === "paragraph" && (
                        <div>
                            <textarea
                                value={answer || ""}
                                className="w-full p-2 mt-1 bg-white border-gray-300 rounded-md shadow-sm form-control sm:text-sm"
                                disabled
                            ></textarea>
                        </div>
                    )}
                </div>
            </fieldset>
        </div>
    );
}

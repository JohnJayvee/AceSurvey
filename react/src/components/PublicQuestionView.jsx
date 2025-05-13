import React from "react";

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
                                onChange={(ev) =>
                                    answerChanged(ev.target.value)
                                }
                                className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none form-control sm:text-sm"
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
                            {question.data.options.map((option, ind) => (
                                <div
                                    key={option.uuid}
                                    className="flex items-center"
                                >
                                    <input
                                        id={option.uuid}
                                        name={"question" + question.id}
                                        value={option.text}
                                        onChange={(ev) =>
                                            answerChanged(ev.target.value)
                                        }
                                        type="radio"
                                        className="w-5 h-5 my-1 text-gray-600 border-gray-300 cursor-pointer"
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
                            {question.data.options.map((option, ind) => (
                                <div
                                    key={option.uuid}
                                    className="flex items-center"
                                >
                                    <input
                                        id={option.uuid}
                                        onChange={(ev) =>
                                            onCheckboxChanged(option, ev)
                                        }
                                        type="checkbox"
                                        className="w-5 h-4 my-1 text-gray-600 border-gray-300 rounded cursor-pointer"
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
                                onChange={(ev) =>
                                    answerChanged(ev.target.value)
                                }
                                className="w-full p-2 border-gray-300 rounded-md shadow-sm form-control sm:text-sm"
                            />
                        </div>
                    )}
                    {question.type === "paragraph" && (
                        <div>
                            <textarea
                                onChange={(ev) =>
                                    answerChanged(ev.target.value)
                                }
                                className="w-full p-2 mt-1 bg-white border-gray-300 rounded-md shadow-sm form-control sm:text-sm"
                            ></textarea>
                        </div>
                    )}
                </div>
            </fieldset>
        </div>
    );
}

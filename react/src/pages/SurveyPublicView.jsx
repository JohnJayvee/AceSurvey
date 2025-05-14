import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../axios";
import PublicQuestionView from "../components/PublicQuestionView";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import AnimatedBackground from "../components/AnimatedBackground";



export default function SurveyPublicView() {
    const answers = {};
    const [surveyFinished, setSurveyFinished] = useState(false);
    const [survey, setSurvey] = useState({
        questions: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { slug } = useParams();

    useEffect(() => {
        axiosClient
            .get(`survey/get-by-slug/${slug}`)
            .then(({ data }) => {
                setSurvey(data.data);
                setLoading(false);
            })
            .catch((error) => {
                if (error.response && error.response.status === 404) {
                    setError(error.response.data.message);
                }
                setLoading(false);
            });
    }, [slug]);

    function answerChanged(question, value) {
        answers[question.id] = value;
    }

    function onSubmit(ev) {
        ev.preventDefault();

        axiosClient
            .post(`/survey/${survey.id}/answer`, {
                answers,
            })
            .then((response) => {
                setSurveyFinished(true);
            });
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-gray-50">
                <div className="w-11/12 py-8 mx-auto md:w-3/4 xl:w-1/2">
                    <div className="flex flex-col p-4 mb-4 bg-white border border-gray-200 rounded-lg md:flex-row">
                        <div className="w-full mr-4 md:w-1/2">
                            <Skeleton height={320} />
                        </div>
                        <div className="w-full lg:w-1/2">
                            <Skeleton height={40} className="my-3" />
                            <Skeleton count={3} className="mb-1" />
                            <Skeleton height={100} className="mb-3" />
                        </div>
                    </div>
                    <div>
                        {[1, 2, 3].map((index) => (
                            <div key={index} className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
                                <Skeleton height={24} width={200} className="mb-4" />
                                <Skeleton count={4} className="mb-2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-gray-50 ">
                <div className="flex flex-col items-center p-10">
                    <InformationCircleIcon className="w-40 h-40 p-6 mt-16 text-gray-400" />
                    <div className="bg-blue-50 border border-blue-500 p-6 rounded-lg w-full md:w-3/4 max-w-[40rem]">
                        <h1 className="text-base font-semibold text-blue-500">
                            {error}
                        </h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen bg-gray-50">
            <div className="absolute inset-0">
                <AnimatedBackground />
            </div>
            <div className="relative z-10 w-11/12 py-8 mx-auto md:w-3/4 xl:w-1/2">
                <form onSubmit={(ev) => onSubmit(ev)}>
                    <div>
                        <div className="flex flex-col p-4 mb-4 bg-white border border-gray-200 rounded-lg md:flex-row">
                            <div className="w-full mr-4 md:w-1/2">
                                <img
                                    src={survey.image_url || '/AceLogo.png'}
                                    loading="lazy"
                                    className="object-cover w-auto rounded-md h-80"
                                    alt={survey.title}
                                />
                            </div>
                            <div className="w-full lg:w-1/2">
                                <h1 className="my-3 text-4xl font-semibold">
                                    {survey.title}
                                </h1>
                                <p className="mb-1 text-sm text-gray-500">
                                    Status:{" "}
                                    {survey.status ? "Active" : "Closed"}
                                </p>
                                <p className="mb-1 text-sm text-gray-500">
                                    Expire Date: {survey.expire_date}
                                </p>
                                <p className="mb-3 overflow-y-auto text-sm text-gray-500 max-h-48">
                                    {survey.description}
                                </p>
                            </div>
                        </div>

                        {surveyFinished && (
                            <div className="w-full px-6 py-8 mx-auto text-green-500 border border-green-300 rounded-lg bg-green-50 ">
                                Thank you for participating in the survey!
                            </div>
                        )}
                        {!surveyFinished && (
                            <>
                                <div>
                                    {(survey.questions || []).map(
                                        (question, index) => (
                                            <PublicQuestionView
                                                key={question.id}
                                                question={question}
                                                index={index}
                                                answerChanged={(val) =>
                                                    answerChanged(question, val)
                                                }
                                            />
                                        )
                                    )}
                                </div>
                                <button
                                    className="px-3 py-2 font-semibold text-white bg-blue-500 rounded-md hover:opacity-70"
                                    type="submit"
                                >
                                    Submit
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

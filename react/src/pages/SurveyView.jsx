import React, { useEffect, useState } from "react";
import {
    ArrowTopRightOnSquareIcon,
    EyeIcon,
    LinkIcon,
    PhotoIcon,
    TrashIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import TButton from "../components/core/TButton";
import axiosClient from "../axios.js";
import { useNavigate, useParams } from "react-router-dom";
import SurveyQuestions from "../components/SurveyQuestions.jsx";
import { useStateContext } from "../contexts/ContextProvider.jsx";
import Loader from "../components/Loader.jsx";
import ShareSurveyPopup from "../components/ShareSurveyPopup.jsx";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { FaArrowLeft } from "react-icons/fa6";

export default function SurveyView() {
    const { showToast } = useStateContext();
    const navigate = useNavigate();
    const { id } = useParams();
    const [openSharePopup, setOpenSharePopup] = useState(false);
    const [shareLink, setShareLink] = useState("");

    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        return tomorrow.toISOString().split("T")[0];
    };

    const [survey, setSurvey] = useState({
        title: "",
        slug: "",
        status: true,
        description: "",
        image: null,
        image_url: null,
        expire_date: getTomorrowDate(),
        questions: [],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onImageChoose = (ev) => {
        const file = ev.target.files[0];

        const reader = new FileReader();
        reader.onload = () => {
            setSurvey({
                ...survey,
                image: file,
                image_url: reader.result,
            });

            ev.target.value = "";
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = (ev) => {
        ev.preventDefault();

        const payload = { ...survey };
        if (payload.image) {
            payload.image = payload.image_url;
        }
        delete payload.image_url;
        let res = null;
        if (id) {
            res = axiosClient.put(`/survey/${id}`, payload);
        } else {
            res = axiosClient.post("/survey", payload);
        }
        res.then((res) => {
            console.log(res);
            navigate("/surveys");
            if (id) {
                showToast("The survey was updated");
            } else {
                showToast("The survey was created");
            }
        }).catch((err) => {
            if (err && err.response) {
                // If there are multiple errors, loop through and display them
                if (err.response.data.errors) {
                    const allErrors = Object.values(err.response.data.errors).flat();
                    setError(allErrors.join('\n')); // Join all error messages with a space
                } else {
                    // If there's only a general message, show it
                    setError(err.response.data.message);
                }
            }
            console.log(err, err.response);
        });

    };

    const onDeleteClick = (id) => {
        if (window.confirm("Are you sure you want to delete this survey?")) {
            axiosClient.delete(`/survey/${id}`).then(() => {
                setSurvey();
                navigate("/surveys");
                showToast("The survey was deleted");
            });
        }
    };

    function onQuestionsUpdate(questions) {
        setSurvey({ ...survey, questions });
    }

    useEffect(() => {
        if (id) {
            setLoading(true);
            axiosClient.get(`/survey/${id}`).then(({ data }) => {
                setSurvey(data.data);
                setLoading(false);
            });
        }
    }, [id]);

    const isSurveyExpired = (expireDate) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const expiration = new Date(expireDate).setHours(0, 0, 0, 0);
        return expiration <= today;
    };

    const handleOpenShare = () => {
        setShareLink(`${window.location.origin}/survey/public/${survey.slug}`);
        setOpenSharePopup(true);
    };

    function handleGoBack() {
        navigate(-1);
    }

    const handleViewResponses = (surveyId) => {
        navigate(`/surveys/${surveyId}/responses`);
    };

    return (
        <div className="w-full min-h-screen ">
            {loading && <Loader />}
            {!loading && (
                <div>
                    <div className="w-full mx-auto mb-4 text-2xl font-semibold lg:w-9/12 xl:w-8/12 ">
                        {!id ? "Create new Survey" : "Edit Survey"}
                    </div>
                    <div
                        className="flex justify-between w-full px-4 mx-auto mb-4 bg-white rounded-lg lg:9/12 xl:w-8/12 animate-fade-in-down "
                        style={{ animationDelay: "0.1s" }}
                    >
                        <div className="py-2">
                            <Tooltip
                                title="Go Back"
                                placement="bottom"
                                TransitionComponent={Fade}
                            >
                                <div
                                    className="p-4 rounded-full cursor-pointer hover:bg-gray-100"
                                    onClick={handleGoBack}
                                >
                                    <FaArrowLeft className="text-gray-700" />
                                </div>
                            </Tooltip>
                        </div>
                        {id && (
                            <div className="flex items-center gap-2">
                                <Tooltip
                                    title="Share"
                                    placement="bottom"
                                    TransitionComponent={Fade}
                                >
                                    <button
                                        onClick={handleOpenShare}
                                        className="flex items-center p-4 rounded-full cursor-pointer hover:bg-gray-100"
                                    >
                                        <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-800" />
                                    </button>
                                </Tooltip>
                                <Tooltip
                                    title="Responses"
                                    placement="bottom"
                                    TransitionComponent={Fade}
                                >
                                    <button
                                        onClick={() =>
                                            handleViewResponses(survey.id)
                                        }
                                        className="flex items-center p-4 rounded-full cursor-pointer hover:bg-gray-100"
                                    >
                                        <UsersIcon className="w-5 h-5 text-gray-800" />
                                    </button>
                                </Tooltip>
                                <Tooltip
                                    title="Preview"
                                    placement="bottom"
                                    TransitionComponent={Fade}
                                >
                                    <a
                                        href={`/survey/public/${survey.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <button className="flex items-center p-4 rounded-full cursor-pointer hover:bg-gray-100">
                                            <EyeIcon className="w-5 h-5 text-gray-800" />
                                        </button>
                                    </a>
                                </Tooltip>
                                <Tooltip
                                    title="Delete"
                                    placement="bottom"
                                    TransitionComponent={Fade}
                                >
                                    <button
                                        onClick={(ev) =>
                                            onDeleteClick(survey.id)
                                        }
                                        className="p-4 rounded-full cursor-pointer hover:bg-gray-100"
                                    >
                                        <TrashIcon className="w-5 h-5 text-gray-800 " />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                    <div className="w-full mx-auto lg:9/12 xl:w-8/12 ">
                        {error && (
                            <div className="p-3 my-4 text-red-500 bg-red-100 rounded-md" style={{ whiteSpace: 'pre-line' }}>
                                {error}
                            </div>
                        )}
                        <form action="#" method="POST" onSubmit={onSubmit}>
                            <div>
                                <div
                                    className="flex flex-col w-full p-4 space-y-6 bg-white border border-gray-200 rounded-lg lg:flex-row animate-fade-in-down "
                                    style={{ animationDelay: "0.2s" }}
                                >
                                    <div className="w-full lg:w-1/2">
                                        <div className="flex items-center mt-1">
                                            {survey.image_url && (
                                                <img
                                                    src={survey.image_url}
                                                    loading="lazy"
                                                    alt=""
                                                    className="object-cover w-full h-full"
                                                />
                                            )}
                                            {/* {!survey.image_url && (
                                                <span className="flex items-center justify-center w-full h-64 overflow-hidden text-gray-400 bg-gray-100">
                                                    <PhotoIcon className="w-8 h-8" />
                                                </span>
                                            )} */}
                                            {!survey.image_url && (
                                                <span className="flex items-center justify-center w-full h-64 overflow-hidden text-gray-400 bg-gray-50">
                                                    <img
                                                        src="/default-survey-image.jpg"
                                                        loading="lazy"
                                                        alt="Default Survey"
                                                        // className="object-cover w-full h-full"
                                                        className="object-cover w-auto h-full"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/AceLogo.png"; // Fallback if image fails to load
                                                        }}
                                                    />
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="relative w-full px-3 py-2 mt-4 text-sm font-medium leading-4 text-white bg-blue-500 border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute top-0 bottom-0 left-0 right-0 opacity-0 cursor-pointer"
                                                onChange={onImageChoose}
                                            />
                                            Choose an Image
                                        </button>
                                    </div>

                                    <div className="w-full px-2 lg:px-10">
                                        {/*Title*/}
                                        <div className="mb-4">
                                            <label
                                                htmlFor="title"
                                                className="text-base font-semibold "
                                            >
                                                Survey Title
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                id="title"
                                                value={survey.title}
                                                onChange={(ev) =>
                                                    setSurvey({
                                                        ...survey,
                                                        title: ev.target.value,
                                                    })
                                                }
                                                placeholder="Survey Title"
                                                className="w-full p-2 mt-2 text-sm border border-gray-200 rounded-md form-control"
                                            />
                                        </div>

                                        {/*Description*/}
                                        <div className="mb-4">
                                            <label
                                                htmlFor="description"
                                                className="text-base font-semibold "
                                            >
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                id="description"
                                                value={survey.description || ""}
                                                onChange={(ev) =>
                                                    setSurvey({
                                                        ...survey,
                                                        description:
                                                            ev.target.value,
                                                    })
                                                }
                                                placeholder="Describe your survey"
                                                className="w-full p-2 mt-2 text-sm border border-gray-200 rounded-md form-control h-28"
                                            ></textarea>
                                        </div>

                                        {/*Expire Date*/}
                                        <div className="mb-4">
                                            <label
                                                htmlFor="expire_date"
                                                className="text-base font-semibold "
                                            >
                                                Expire Date
                                            </label>
                                            <input
                                                type="date"
                                                name="expire_date"
                                                id="expire_date"
                                                value={survey.expire_date}
                                                onChange={(ev) =>
                                                    setSurvey({
                                                        ...survey,
                                                        expire_date:
                                                            ev.target.value,
                                                    })
                                                }
                                                className="w-full p-2 mt-2 text-sm border border-gray-200 rounded-md form-control"
                                            />
                                            {isSurveyExpired(
                                                survey.expire_date
                                            ) && (
                                                    <p className="mt-2 text-sm text-red-500">
                                                        This survey has already
                                                        expired and is now closed to
                                                        public access.
                                                    </p>
                                                )}
                                        </div>
                                        {/* Active */}
                                        <div className="w-full">
                                            <label
                                                htmlFor="status"
                                                className="text-base font-semibold"
                                            >
                                                Status
                                            </label>
                                            <div className="flex items-center self-center mt-2">
                                                <input
                                                    id="status"
                                                    name="status"
                                                    type="checkbox"
                                                    checked={
                                                        survey.status &&
                                                        !isSurveyExpired(
                                                            survey.expire_date
                                                        )
                                                    } // Ensure checkbox is checked only if status is true and survey is not expired
                                                    onChange={(ev) => {
                                                        const isChecked =
                                                            ev.target.checked;
                                                        const isExpired =
                                                            isSurveyExpired(
                                                                survey.expire_date
                                                            );

                                                        setSurvey({
                                                            ...survey,
                                                            status:
                                                                isChecked &&
                                                                !isExpired,
                                                        });

                                                        // Automatically set status to false if survey is expired
                                                        if (
                                                            isChecked &&
                                                            isExpired
                                                        ) {
                                                            setSurvey(
                                                                (
                                                                    prevSurvey
                                                                ) => ({
                                                                    ...prevSurvey,
                                                                    status: false,
                                                                })
                                                            );
                                                        }
                                                    }}
                                                    className="w-4 h-4 border-gray-300 rounded cursor-pointer"
                                                />
                                                <div className="w-full ml-2 text-sm">
                                                    <p
                                                        className={
                                                            survey.status &&
                                                                !isSurveyExpired(
                                                                    survey.expire_date
                                                                )
                                                                ? "text-gray-500 p-2"
                                                                : "bg-red-50 text-red-500 p-2 rounded"
                                                        }
                                                    >
                                                        {survey.status &&
                                                            !isSurveyExpired(
                                                                survey.expire_date
                                                            )
                                                            ? "Accepting responses"
                                                            : "Not accepting responses"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/*Questions */}
                                <div
                                    className="animate-fade-in-down "
                                    style={{ animationDelay: "0.3s" }}
                                >
                                    <SurveyQuestions
                                        questions={survey.questions}
                                        onQuestionsUpdate={onQuestionsUpdate}
                                    />
                                </div>
                                <div className="py-3 text-right">
                                    <TButton>Save</TButton>
                                </div>
                            </div>
                        </form>
                        <ShareSurveyPopup
                            openSharePopup={openSharePopup}
                            setOpenSharePopup={setOpenSharePopup}
                            shareLink={shareLink}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// filepath: d:\MAMP\htdocs\AceSurvey\react\src\components\dashboard\LatestSurveyCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, EyeIcon } from "@heroicons/react/24/outline";
import DashboardCard from '@components/DashboardCard';
import { Divider } from "@mui/material";
import { formatDate, isSurveyExpired } from '@utils/dashboardUtils';
import Skeleton from 'react-loading-skeleton';
import logo from '@images/AceLogo.png';

export default function LatestSurveyCard({ survey, onViewResponses, loading = false }) {
   return (
      <div className="mt-4">
         <DashboardCard className="order-3 row-span-2 p-6 transition-all duration-300 transform hover:shadow-xl bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-xl font-bold text-gray-800">Latest Survey</h3>
                  <p className="text-sm text-gray-600">Most recently created survey</p>
               </div>
               <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
               </div>
            </div>

            {loading ? (
               <div>
                  <Skeleton height={288} className="mb-4 rounded-lg" />
                  <Skeleton height={24} className="mb-3" />
                  <Skeleton count={5} className="mb-2" />
                  <Divider className="my-4" />
                  <div className="flex justify-between">
                     <Skeleton width={100} />
                     <Skeleton width={100} />
                  </div>
               </div>
            ) : (
               survey ? (
                  <div className="space-y-4">
                     <div className="relative overflow-hidden transition-all duration-300 transform rounded-lg group hover:scale-[1.02]">
                        <img
                           src={survey.image_url || logo}
                           loading="lazy"
                           className="object-contain w-full mx-auto rounded-lg h-72 bg-gray-50"
                           alt={survey.title}
                           onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = logo;
                           }}
                        />
                        <div className="absolute inset-0 transition-opacity duration-300 bg-black opacity-0 group-hover:opacity-10"></div>
                     </div>

                     <h3 className="mt-4 text-xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text">
                        {survey.title}
                     </h3>

                     <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="space-y-3">
                           <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500">Created Date</p>
                              <p className="text-sm font-semibold text-gray-700">
                                 {formatDate(survey.created_at)}
                              </p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500">Questions</p>
                              <p className="text-sm font-semibold text-gray-700">
                                 {survey.questions}
                              </p>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500">Expire Date</p>
                              <p className="text-sm font-semibold text-gray-700">
                                 {formatDate(survey.expire_date)}
                              </p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500">Responses</p>
                              <p className="text-sm font-semibold text-gray-700">
                                 {survey.answers}
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center justify-between p-2">
                        <div className={`
                           px-3 py-1 text-sm font-medium rounded-full
                           ${isSurveyExpired(survey.expire_date)
                              ? "bg-red-100 text-red-600"
                              : survey.status
                                 ? "bg-green-100 text-green-600"
                                 : "bg-gray-100 text-gray-600"}
                        `}>
                           {isSurveyExpired(survey.expire_date)
                              ? "Expired"
                              : survey.status
                                 ? "Active"
                                 : "Closed"}
                        </div>
                     </div>

                     <Divider />

                     <div className="flex justify-between mt-4 space-x-4">
                        <Link
                           to={`/surveys/${survey.id}`}
                           className="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium text-white transition-all duration-300 bg-indigo-600 rounded-lg hover:bg-indigo-700"
                        >
                           <PencilIcon className="w-4 h-4 mr-2" />
                           Edit Survey
                        </Link>

                        <button
                           className="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium text-indigo-600 transition-all duration-300 bg-indigo-100 rounded-lg hover:bg-indigo-200"
                           onClick={() => onViewResponses(survey.id)}
                        >
                           <EyeIcon className="w-4 h-4 mr-2" />
                           View Responses
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                     </svg>
                     <p className="text-gray-500">No surveys available</p>
                  </div>
               )
            )}
         </DashboardCard>
      </div>
   );
}

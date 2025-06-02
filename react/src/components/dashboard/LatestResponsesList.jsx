import React from 'react';
import DashboardCard from '@components/DashboardCard';
import { formatDate } from '@utils/dashboardUtils';
import Skeleton from 'react-loading-skeleton';

export default function LatestResponsesList({ responses, onViewDetail, loading = false }) {
   return (
      <DashboardCard className="order-3 row-span-2 p-6 mt-5 transition-all duration-300 transform lg:order-3 hover:shadow-xl bg-gradient-to-br from-white to-gray-50">
         <div className="flex items-center justify-between mb-6">
            <div>
               <h3 className="text-xl font-bold text-gray-800">Latest Responses</h3>
               <p className="text-sm text-gray-600">Most recent survey submissions</p>
            </div>
            <div className="p-2 bg-teal-100 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
            </div>
         </div>

         {loading ? (
            <div className="space-y-4">
               {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-gray-50 animate-pulse">
                     <div className="flex items-center justify-between">
                        <div className="space-y-2">
                           <Skeleton width={200} height={20} />
                           <Skeleton width={100} height={16} />
                        </div>
                        <Skeleton width={100} height={32} className="rounded-full" />
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            responses && responses.length > 0 ? (
               <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                  {responses.map((answer) => (
                     <div
                        key={answer.id}
                        onClick={() => onViewDetail(answer.survey_id, answer.id)}
                        className="p-4 transition-all duration-300 transform bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:scale-[1.01] group"
                     >
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <h4 className="text-sm font-semibold text-gray-800 transition-colors duration-300 md:text-base group-hover:text-indigo-600 line-clamp-1">
                                 {answer.survey.title}
                              </h4>
                              <p className="text-xs text-gray-500 md:text-sm">
                                 Response ID: #{answer.id}
                              </p>
                           </div>
                           <div className="flex items-center space-x-3">
                              <span className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full whitespace-nowrap md:text-sm">
                                 {formatDate(answer.end_date)}
                              </span>
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="w-5 h-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-1"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="p-4 rounded-full bg-gray-50">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                     </svg>
                  </div>
                  <h4 className="text-lg font-medium text-center text-gray-600">No Responses Yet</h4>
                  <p className="text-sm text-center text-gray-500">Responses will appear here once surveys are completed</p>
               </div>
            )
         )}
      </DashboardCard>
   );
}

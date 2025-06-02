import React from 'react';
import DashboardCard from '@components/DashboardCard';
import { DASHBOARD_ICONS } from '@constants/dashboardConstants';
import Skeleton from 'react-loading-skeleton';

const StatCard = ({ title, value, color, icon, loading }) => (
   <DashboardCard className="w-full p-6 transition-all duration-300 transform rounded-lg hover:scale-105 hover:shadow-xl">
      <div className="flex items-center justify-between">
         <div className="flex items-center space-x-3">
            <div className={`p-3 ${color.bg} rounded-lg`}>
               {icon}
            </div>
            <div>
               <h3 className={`pb-2 text-4xl font-bold tracking-tight md:text-5xl ${color.gradient} bg-clip-text`}>
                  {loading ? <Skeleton width={60} /> : value}
               </h3>
               <p className="text-sm font-medium text-gray-500">{title}</p>
            </div>
         </div>
         <div className="hidden md:block">
            <div className="inline-flex items-center px-3 py-1 text-sm text-green-600 bg-green-100 rounded-full">
               {DASHBOARD_ICONS.trending}
               <span>Active</span>
            </div>
         </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
         <div className="flex items-center justify-between pt-3 border-t">
            <span>Last 30 days</span>
            <span className={`font-medium ${color.text}`}>+{value || 0}</span>
         </div>
      </div>
   </DashboardCard>
);

export default function DashboardStats({ totalSurveys, totalAnswers, loading = false }) {
   return (
      <div className="flex gap-4">
         <StatCard
            title="Total Surveys"
            value={totalSurveys}
            loading={loading}
            color={{
               bg: 'bg-blue-100',
               gradient: 'text-transparent bg-gradient-to-r from-blue-600 to-blue-400',
               text: 'text-blue-600'
            }}
            icon={DASHBOARD_ICONS.survey}
         />
         <StatCard
            title="Total Responses"
            value={totalAnswers}
            loading={loading}
            color={{
               bg: 'bg-green-100',
               gradient: 'text-transparent bg-gradient-to-r from-green-600 to-green-400',
               text: 'text-green-600'
            }}
            icon={DASHBOARD_ICONS.responses}
         />
      </div>
   );
}

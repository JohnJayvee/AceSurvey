import React from 'react';
import DashboardCard from '../DashboardCard';
import BarChart from '../charts/BarChart';
import EmptyState from './EmptyState';

const PerformanceChart = ({ title, data, color, icon, emptyMessage }) => (
   <DashboardCard className="flex flex-col w-full h-full p-6 transition-all duration-300 bg-white rounded-lg shadow-sm hover:shadow-lg">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600">
               {title.includes('Top') ? 'Surveys with highest response rates' : 'Surveys with lowest response rates'}
            </p>
         </div>
         <div className={`p-2 ${color.bg} rounded-lg`}>
            {icon}
         </div>
      </div>

      {data.length === 0 ? (
         <EmptyState icon="chart" message={emptyMessage} height="h-[300px]" />
      ) : (
         <BarChart
            data={data}
            color={color.fill}
            dataKey="answers_count"
            name="Responses"
         />
      )}
   </DashboardCard>
);

export default function SurveyPerformanceCharts({ topSurveys, bottomSurveys }) {
   return (
      <>
         <PerformanceChart
            title="Top Performing Surveys"
            data={topSurveys}
            color={{
               bg: 'bg-green-100',
               fill: '#4CAF50'
            }}
            icon={
               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
               </svg>
            }
            emptyMessage="No data available"
         />

         <PerformanceChart
            title="Surveys Needing Attention"
            data={bottomSurveys}
            color={{
               bg: 'bg-orange-100',
               fill: '#FF5722'
            }}
            icon={
               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
               </svg>
            }
            emptyMessage="No data available"
         />
      </>
   );
}

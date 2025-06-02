import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardCard from '../DashboardCard';
import EmptyState from './EmptyState';
import Skeleton from 'react-loading-skeleton';

export default function SurveyAnalyticsChart({ data, loading = false }) {
   const hasData = data && data.length > 0;

   return (
      <DashboardCard className="order-2 row-span-2 p-6 mt-5 mb-4 transition-all duration-300 transform hover:shadow-xl bg-gradient-to-br from-white to-gray-50">
         <div className="flex items-center justify-between mb-6">
            <div>
               <h3 className="text-xl font-bold text-gray-800">Survey Analytics</h3>
               <p className="text-sm text-gray-600">Monthly survey and response trends</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
            </div>
         </div>

         {loading ? (
            <div className="h-96">
               <Skeleton height={300} className="mb-4 rounded-lg" />
            </div>
         ) : !hasData ? (
            <EmptyState icon="chart" message="No analytics data available" height="h-96" />
         ) : (
            <div className="relative">
               <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                     <defs>
                        <linearGradient id="surveysGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#8884d8" stopOpacity={0.2} />
                           <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="responsesGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.2} />
                           <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                     <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '12px', fill: '#4B5563' }}
                     />
                     <YAxis
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '12px', fill: '#4B5563' }}
                     />
                     <Tooltip
                        contentStyle={{
                           backgroundColor: 'rgba(255, 255, 255, 0.95)',
                           border: 'none',
                           borderRadius: '8px',
                           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                           padding: '8px 12px'
                        }}
                     />
                     <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingBottom: '20px' }}
                     />
                     <Line
                        type="monotone"
                        dataKey="surveys"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Surveys Created"
                        fill="url(#surveysGradient)"
                     />
                     <Line
                        type="monotone"
                        dataKey="responses"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Responses Received"
                        fill="url(#responsesGradient)"
                     />
                  </LineChart>
               </ResponsiveContainer>

               <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-purple-50">
                     <p className="text-sm font-medium text-purple-600">Total Surveys</p>
                     <p className="text-2xl font-bold text-purple-700">
                        {data.reduce((sum, item) => sum + item.surveys, 0)}
                     </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                     <p className="text-sm font-medium text-green-600">Total Responses</p>
                     <p className="text-2xl font-bold text-green-700">
                        {data.reduce((sum, item) => sum + item.responses, 0)}
                     </p>
                  </div>
               </div>
            </div>
         )}
      </DashboardCard>
   );
}

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import DashboardCard from '../DashboardCard';
import { COLORS } from '../../constants/chartConstants';
import { renderCustomizedLabel } from '@utils/chartUtils';
import EmptyState from './EmptyState';

export default function RatingDistributionChart({ data }) {
   const hasData = data && data.some(item => item.value > 0);

   return (
      <DashboardCard className="p-6 transition-all duration-300 transform hover:shadow-xl">
         <div className="flex items-center justify-between mb-6">
            <div>
               <h3 className="text-xl font-bold text-gray-800">Rating Distribution</h3>
               <p className="text-sm text-gray-600">Overall survey satisfaction levels</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
               </svg>
            </div>
         </div>

         {!hasData ? (
            <EmptyState
               icon="chart"
               message="No ratings available"
               height="h-72"
            />
         ) : (
            <ResponsiveContainer width="100%" height={300}>
               <PieChart>
                  <Pie
                     data={data}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={renderCustomizedLabel}
                     outerRadius={120}
                     paddingAngle={2}
                     dataKey="value"
                  >
                     {data.map((entry, index) => (
                        <Cell
                           key={`cell-${index}`}
                           fill={COLORS[index % COLORS.length]}
                           stroke="none"
                           className="transition-all duration-300 hover:opacity-80"
                        />
                     ))}
                  </Pie>
                  <Tooltip
                     content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                           const data = payload[0];
                           return (
                              <div className="p-3 bg-white border rounded-lg shadow-lg">
                                 <p className="font-bold" style={{ color: data.payload.fill }}>
                                    {data.name}: {data.value} responses
                                 </p>
                              </div>
                           );
                        }
                        return null;
                     }}
                  />
                  <Legend
                     verticalAlign="bottom"
                     height={36}
                     iconType="circle"
                     iconSize={10}
                  />
               </PieChart>
            </ResponsiveContainer>
         )}
      </DashboardCard>
   );
}

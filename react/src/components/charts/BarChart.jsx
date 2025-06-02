import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CHART_MARGINS } from '../../constants/chartConstants';

export default function BarChart({ data, color, dataKey, name }) {
   return (
      <ResponsiveContainer width="100%" height={300}>
         <RechartsBarChart
            layout="vertical"
            data={data}
            margin={window.innerWidth < 768 ? CHART_MARGINS.mobile : CHART_MARGINS.default}
         >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis
               type="number"
               domain={[0, 'auto']}
               allowDecimals={false}
               axisLine={false}
               tickLine={false}
               style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px' }}
            />
            <YAxis
               dataKey="title"
               type="category"
               width={window.innerWidth < 768 ? 80 : 200}
               tick={{
                  fontSize: window.innerWidth < 768 ? 10 : 12,
                  fill: '#4B5563',
                  fontWeight: 500
               }}
               axisLine={false}
               tickLine={false}
               tickFormatter={(value) =>
                  window.innerWidth < 768 && value.length > 15
                     ? `${value.substring(0, 15)}...`
                     : value
               }
            />
            <Tooltip
               formatter={(value) => [`${value} responses`, name]}
               cursor={{ fill: 'rgba(224, 224, 224, 0.4)' }}
               contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                  padding: '10px 14px'
               }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
            <Bar
               dataKey={dataKey}
               fill={color}
               name={name}
               barSize={window.innerWidth < 768 ? 15 : 20}
               radius={[4, 4, 4, 4]}
            >
               {data.map((entry, index) => (
                  <Cell
                     key={`cell-${index}`}
                     fill={`${color}${Math.floor(255 - (index * 40)).toString(16).padStart(2, '0')}`}
                  />
               ))}
            </Bar>
         </RechartsBarChart>
      </ResponsiveContainer>
   );
}

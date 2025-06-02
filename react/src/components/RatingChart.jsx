import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const RatingChart = ({ ratingsData, width }) => {
   const COLORS = {
      '5': '#10B981', // Green - Very Satisfied
      '4': '#6EE7B7', // Light Green - Satisfied
      '3': '#FCD34D', // Yellow - Undecided
      '2': '#F87171', // Light Red - Unsatisfied
      '1': '#EF4444'  // Red - Very Unsatisfied
   };

   const getChartConfig = (screenWidth) => {
      if (screenWidth < 640) {
         return {
            outerRadius: 60,
            innerRadius: 30,
            height: 200,
            fontSize: 9,
            minPercentageForLabel: 15 // Only show labels for segments >= 15%
         };
      }
      if (screenWidth < 768) {
         return {
            outerRadius: 80,
            innerRadius: 40,
            height: 250,
            fontSize: 11,
            minPercentageForLabel: 12 // Only show labels for segments >= 12%
         };
      }
      return {
         outerRadius: 100,
         innerRadius: 50,
         height: 300,
         fontSize: 13,
         minPercentageForLabel: 10 // Only show labels for segments >= 10%
      };
   };

   const config = getChartConfig(width);
   const hasData = ratingsData?.some(item => item.value > 0);

   // Calculate total and percentages
   const totalResponses = ratingsData?.reduce((sum, item) => sum + item.value, 0) || 0;

   const dataWithPercentages = ratingsData?.map(item => ({
      ...item,
      percentage: totalResponses > 0 ? ((item.value / totalResponses) * 100).toFixed(1) : 0
   })) || [];

   const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
         const data = payload[0].payload;
         return (
            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
               <p className="text-sm font-medium text-gray-900">{data.name}</p>
               <p className="text-sm text-gray-600">
                  Count: <span className="font-semibold text-blue-600">{data.value}</span>
               </p>
               <p className="text-sm text-gray-600">
                  Percentage: <span className="font-semibold text-green-600">{data.percentage}%</span>
               </p>
            </div>
         );
      }
      return null;
   };

   const CustomLegend = ({ payload }) => {
      return (
         <div className="flex flex-wrap justify-center gap-4 mt-4">
            {payload.map((entry, index) => {
               const dataItem = dataWithPercentages.find(item => item.name === entry.value);
               return (
                  <div key={index} className="flex items-center gap-2">
                     <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                     />
                     <span className="text-sm text-gray-700">
                        {entry.value} ({dataItem?.percentage || 0}%)
                     </span>
                  </div>
               );
            })}
         </div>
      );
   };

   // Smart label function that shows all labels (modified)
   const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage, value, index }) => {
      const percentageNum = parseFloat(percentage);

      // Show labels for any segment with data
      if (value === 0) {
         return null;
      }

      const RADIAN = Math.PI / 180;

      // Calculate position in the middle of the donut ring
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      // Use smaller font size for very small segments
      const fontSize = percentageNum < 5 ? config.fontSize - 2 : config.fontSize;

      return (
         <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight="bold"
            className="pointer-events-none select-none"
            style={{
               textShadow: '0 1px 2px rgba(0,0,0,0.7)'
            }}
         >
            {`${percentage}%`}
         </text>
      );
   };

   return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Rating Distribution</h2>
            {totalResponses > 0 && (
               <span className="text-sm text-gray-600">
                  Total Responses: {totalResponses}
               </span>
            )}
         </div>

         {!hasData ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
               <div className="text-center">
                  <div className="mb-2 text-4xl">📊</div>
                  <p className="text-sm">No rating data available</p>
               </div>
            </div>
         ) : (
            <div style={{ height: config.height }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={dataWithPercentages}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={config.outerRadius}
                        innerRadius={config.innerRadius}
                        dataKey="value"
                        nameKey="name"
                        stroke="#ffffff"
                        strokeWidth={2}
                     >
                        {dataWithPercentages.map((entry, index) => (
                           <Cell
                              key={`cell-${index}`}
                              fill={COLORS[entry.rating] || '#8B5CF6'}
                           />
                        ))}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                     <Legend content={<CustomLegend />} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         )}

         {/* {hasData && (
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs sm:grid-cols-5">
               {dataWithPercentages.map((item, index) => (
                  <div key={index} className="p-2 text-center transition-colors rounded bg-gray-50 hover:bg-gray-100">
                     <div
                        className="w-4 h-4 mx-auto mb-1 rounded-full"
                        style={{ backgroundColor: COLORS[item.rating] }}
                     />
                     <div className="font-medium text-gray-900">{item.value}</div>
                     <div className="text-gray-600 truncate">{item.name}</div>
                     <div className="font-semibold text-blue-600">{item.percentage}%</div>
                  </div>
               ))}
            </div>
         )} */}

         {/* Show note about labels - updated message */}
         {hasData && (
            <div className="mt-2 text-xs text-center text-gray-500">
               Hover over chart segments for detailed information.
            </div>
         )}
      </div>
   );
};

export default RatingChart;

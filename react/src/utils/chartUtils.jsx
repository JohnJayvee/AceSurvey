const RADIAN = Math.PI / 180;

export const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
   const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
   const x = cx + radius * Math.cos(-midAngle * RADIAN);
   const y = cy + radius * Math.sin(-midAngle * RADIAN);

   return (
      <text
         x={x}
         y={y}
         fill="white"
         textAnchor={x > cx ? 'start' : 'end'}
         dominantBaseline="central"
         style={{
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
         }}
      >
         {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
   );
};

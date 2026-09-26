import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
const colors = ['#107e72', '#6bafa1', '#d8b968', '#d79478', '#b96662'];
export default function RatingDistributionChart({ data = [] }) {
   const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
   return <section className="ace-card ace-chart-card"><div className="ace-card-heading"><div><h2>The feedback picture</h2><p>Rating distribution across your surveys</p></div><span className="ace-tag">{total.toLocaleString()} ratings</span></div>
      {total ? <><div className="ace-donut"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={data} innerRadius={61} outerRadius={82} paddingAngle={3} dataKey="value" stroke="none">{data.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="ace-donut-label"><strong>{total.toLocaleString()}</strong><span>total ratings</span></div></div><div className="ace-rating-legend">{data.map((item, index) => <div key={item.name}><span><i style={{ background: colors[index % colors.length] }} />{item.name}</span><strong>{Math.round(item.value / total * 100)}%</strong></div>)}</div></> : <div className="ace-empty"><span className="ace-empty-symbol">◎</span><h3>A little feedback goes a long way</h3><p>Your ratings will appear as responses arrive.</p></div>}
   </section>;
}

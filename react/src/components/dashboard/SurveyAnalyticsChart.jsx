import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export default function SurveyAnalyticsChart({ data = [], loading = false }) {
   const hasData = data.some(item => item.surveys > 0 || item.responses > 0);
   return <section className="ace-card ace-chart-card"><div className="ace-card-heading"><div><h2>Survey activity</h2><p>Responses grouped by last survey update</p></div><span className="ace-tag">{new Date().getFullYear()}</span></div>
      {loading ? <div className="ace-skeleton" /> : hasData ? <div className="ace-chart"><ResponsiveContainer width="100%" height={260}>
         <AreaChart data={data} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
            <defs><linearGradient id="ace-response-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f8b7e" stopOpacity={0.22} /><stop offset="100%" stopColor="#0f8b7e" stopOpacity={0.01} /></linearGradient></defs>
            <CartesianGrid stroke="#edf0f2" vertical={false} /><XAxis dataKey="name" tickFormatter={value => value.slice(0, 3)} tick={{ fontSize: 11, fill: '#7b8794' }} tickLine={false} axisLine={false} dy={8} /><YAxis tick={{ fontSize: 11, fill: '#7b8794' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e9ec', fontSize: 12 }} /><Area type="monotone" dataKey="responses" name="Responses" stroke="#0f8b7e" strokeWidth={2.5} fill="url(#ace-response-fill)" /><Area type="monotone" dataKey="surveys" name="Surveys" stroke="#9aa7bb" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
         </AreaChart>
      </ResponsiveContainer><div className="ace-chart-legend"><span><i />Responses</span><span><i className="muted" />Surveys</span></div></div> : <div className="ace-empty"><span className="ace-empty-symbol">↗</span><h3>Your next insight starts here</h3><p>Create a survey to start collecting feedback.</p><Link className="ace-text-link" to="/surveys/create">Create your first survey →</Link></div>}
   </section>;
}

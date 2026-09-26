import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardCard from '../DashboardCard';
import EmptyState from './EmptyState';
import Skeleton from 'react-loading-skeleton';

export default function SurveyAnalyticsChart({ data, loading = false }) {
   const hasData = data && data.length > 0;

   return (
      <DashboardCard className="order-2 row-span-2 backdrop-blur-xl bg-gradient-to-br from-slate-50/80 via-blue-50/50 to-indigo-50/80 border border-white/50 shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500">
         <div className="sticky top-0 z-10 pb-4 mb-6 border bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm rounded-2xl border-blue-200/50">
            <div className="flex items-center justify-between px-6 py-4">
               <div>
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg ring-1 ring-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-transparent bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text drop-shadow-lg">Survey Analytics</h3>
                        <p className="text-sm font-medium tracking-wide text-gray-600">Current year ({new Date().getFullYear()}) monthly trends • Live data</p>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2 p-3 border shadow-lg bg-white/60 rounded-2xl backdrop-blur-sm border-white/50">
                  <span className="px-3 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full ring-1 ring-green-200/50">Live</span>
                  <div className="p-2 transition-transform duration-200 hover:scale-110 rounded-xl hover:bg-blue-100">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                  </div>
               </div>
            </div>
         </div>

         {loading ? (
            <div className="space-y-4">
               <div className="border shadow-xl h-80 bg-gradient-to-r from-slate-100/50 to-blue-100/50 rounded-3xl backdrop-blur-sm border-slate-200/50 animate-pulse" />
            </div>
         ) : !hasData ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-gray-200 border-dashed h-96 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl backdrop-blur-sm">
               <div className="p-4 mb-6 shadow-lg bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl animate-bounce">
                  <svg className="w-16 h-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
               </div>
               <h3 className="mb-2 text-2xl font-bold text-gray-800">No Data Yet</h3>
               <p className="max-w-md text-sm leading-relaxed text-gray-600">No analytics data for current year. Create or update surveys to see live trends!</p>
               <button className="px-6 py-3 mt-6 text-sm font-bold text-white transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:shadow-xl hover:scale-105 ring-2 ring-blue-200/50">
                  Create Survey
               </button>
            </div>
         ) : (
            <div className="space-y-6">
               <div className="relative">
                  <ResponsiveContainer width="100%" height={360}>
                     <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                           <linearGradient id="surveysGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                              <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                           </linearGradient>
                           <linearGradient id="responsesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                              <stop offset="50%" stopColor="#10B981" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(248, 250, 252, 0.6)" strokeOpacity={0.5} />
                        <XAxis
                           dataKey="name"
                           axisLine={false}
                           tickLine={false}
                           tick={{
                              fontSize: 13,
                              fontWeight: 600,
                              fill: '#6B7280',
                              textAnchor: 'middle'
                           }}
                           tickMargin={16}
                        />
                        <YAxis
                           axisLine={false}
                           tickLine={false}
                           tick={{
                              fontSize: 12,
                              fill: '#6B7280',
                              fontWeight: 500
                           }}
                           tickMargin={12}
                           allowDecimals={false}
                        />
                        <Tooltip
                           contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.98)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '20px',
                              boxShadow: '0 25px 50px -12px rgba(0, 0,0, 0.25)',
                              color: 'white',
                              padding: '20px',
                              fontSize: '14px',
                              fontWeight: '500'
                           }}
                           labelStyle={{
                              fontWeight: 'bold',
                              fontSize: '16px',
                              color: '#F8FAFC',
                              padding: '8px 12px',
                              backgroundColor: 'rgba(59, 130, 246, 0.2)',
                              borderRadius: '8px',
                              marginBottom: '8px'
                           }}
                           formatter={(value, name) => [`${value.toLocaleString()}`, name === 'surveys' ? '📊 New Surveys' : '📈 Responses']}
                        />
                        <Legend
                           verticalAlign="top"
                           align="center"
                           iconType="circle"
                           iconSize={12}
                           wrapperStyle={{
                              paddingTop: '20px',
                              paddingBottom: '28px',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: '12px',
                              padding: '12px 24px',
                              margin: '0 auto',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                              fontSize: '14px',
                              fontWeight: '600',
                              maxWidth: '400px'
                           }}
                        />
                        <Line
                           type="monotone"
                           dataKey="surveys"
                           stroke="#3B82F6"
                           strokeWidth={4}
                           dot={{
                              fill: '#3B82F6',
                              strokeWidth: 3,
                              r: 6,
                              stroke: '#FFFFFF',
                              animationDuration: 800
                           }}
                           activeDot={{
                              r: 10,
                              strokeWidth: 4,
                              stroke: '#FFFFFF',
                              fill: '#3B82F6',
                              animationDuration: 1000
                           }}
                           name="📊 Surveys Created"
                           strokeDasharray="5 5"
                        />
                        <Line
                           type="monotone"
                           dataKey="responses"
                           stroke="#10B981"
                           strokeWidth={4}
                           dot={{
                              fill: '#10B981',
                              strokeWidth: 3,
                              r: 6,
                              stroke: '#FFFFFF',
                              animationDuration: 800
                           }}
                           activeDot={{
                              r: 10,
                              strokeWidth: 4,
                              stroke: '#FFFFFF',
                              fill: '#10B981',
                              animationDuration: 1000
                           }}
                           name="📈 Responses Received"
                        />
                     </LineChart>
                  </ResponsiveContainer>
               </div>

               <div className="grid grid-cols-1 gap-6 p-2 md:grid-cols-2">
                  <div className="relative p-6 overflow-hidden transition-all duration-500 border shadow-2xl cursor-pointer group rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 border-indigo-200/50 backdrop-blur-xl hover:shadow-3xl hover:-translate-y-2">
                     <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 animate-pulse" />
                     <div className="relative z-10 flex items-center gap-4 mb-4">
                        <div className="p-3 shadow-xl bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl ring-2 ring-white/40">
                           <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                           </svg>
                        </div>
                        <div>
                           <p className="text-sm font-bold tracking-wide text-indigo-800 uppercase">Total Surveys</p>
                        </div>
                     </div>
                     <p className="text-4xl font-black text-transparent transition-transform duration-300 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text drop-shadow-2xl group-hover:scale-110">
                        {data.reduce((sum, item) => sum + item.surveys, 0)}
                     </p>
                  </div>
                  <div className="relative p-6 overflow-hidden transition-all duration-500 border shadow-2xl cursor-pointer group rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 border-emerald-200/50 backdrop-blur-xl hover:shadow-3xl hover:-translate-y-2">
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 animate-pulse" />
                     <div className="relative z-10 flex items-center gap-4 mb-4">
                        <div className="p-3 shadow-xl bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl ring-2 ring-white/40">
                           <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                           </svg>
                        </div>
                        <div>
                           <p className="text-sm font-bold tracking-wide uppercase text-emerald-800">Total Responses</p>
                        </div>
                     </div>
                     <p className="text-4xl font-black text-transparent transition-transform duration-300 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text drop-shadow-2xl group-hover:scale-110">
                        {data.reduce((sum, item) => sum + item.responses, 0)}
                     </p>
                  </div>
               </div>
            </div>
         )}
      </DashboardCard>
   );
}


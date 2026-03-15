import React from "react";
import { MagnifyingGlassIcon, ArrowRightIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useSurveySelector } from "@/hooks/useSurveySelector";

export default function SurveySelectionPage() {
   const { filteredSurveys, searchTerm, setSearchTerm, loading, error } = useSurveySelector();

   const handleRedirect = (link) => {
      if (link) window.location.href = link;
   };

   return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50">
         {/* Header */}
         <header className="px-6 py-20 text-center">
            <div className="max-w-4xl mx-auto">
               <img src="/AceLogo.png" alt="AceSurvey Logo" className="w-32 h-32 mx-auto mb-8 shadow-2xl rounded-2xl drop-shadow-2xl animate-float" />
               <h1 className="mb-6 text-5xl font-black text-transparent md:text-7xl bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text drop-shadow-2xl">
                  AceSurvey Hub
               </h1>
               <p className="max-w-2xl mx-auto text-xl font-light leading-relaxed text-gray-600 md:text-2xl">
                  Choose your survey to share feedback and help us improve
               </p>
            </div>
         </header>

         {/* Search */}
         <div className="max-w-md px-6 pb-16 mx-auto">
            <div className="relative">
               <MagnifyingGlassIcon className="absolute w-6 h-6 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
               <input
                  type="text"
                  placeholder="Search feedback forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-4 pl-12 pr-6 text-lg transition-all duration-300 border-2 border-gray-200 shadow-xl rounded-3xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 bg-white/80 backdrop-blur-sm hover:shadow-2xl"
               />
            </div>
         </div>

         {/* Results Counter */}
         {error ? (
            <div className="py-16 text-center">
               <div className="inline-flex items-center gap-3 p-6 font-semibold text-red-800 border border-red-200 bg-red-50 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
               </div>
            </div>
         ) : (
            <div className="px-6 pb-12 text-center">
               <div className="inline-flex items-center gap-2 px-8 py-4 text-2xl font-bold text-blue-800 border-2 border-blue-200 bg-blue-500/10 rounded-3xl backdrop-blur-sm">
                  {loading ? '...' : filteredSurveys.length} Forms
               </div>
            </div>
         )}

         {/* Surveys Grid */}
         <div className="max-w-6xl px-6 pb-20 mx-auto">
            {loading ? (
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                     <div key={i} className="p-8 border shadow-lg animate-pulse bg-white/70 backdrop-blur-sm rounded-2xl border-gray-200/50">
                        <div className="w-3/4 h-4 mb-6 bg-gray-300 rounded"></div>
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl"></div>
                           <div className="w-32 h-5 bg-gray-300 rounded"></div>
                        </div>
                        <div className="w-32 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl"></div>
                     </div>
                  ))}
               </div>
            ) : filteredSurveys.length === 0 ? (
               <div className="py-32 text-center">
                  <img src="/AceLogo.png" alt="AceSurvey" className="w-32 h-32 mx-auto mb-8 opacity-30 animate-bounce" />
                  <h3 className="mb-4 text-3xl font-bold text-gray-900">No Feedback Forms Found</h3>
                  <p className="max-w-md mx-auto text-lg text-gray-600">Try adjusting your search or create a new survey.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredSurveys.map((survey) => (
                     <div
                        key={survey.id}
                        className="relative p-8 overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-lg cursor-pointer group backdrop-blur-sm rounded-2xl hover:shadow-2xl hover:-translate-y-2 hover:border-blue-300 hover:ring-4 hover:ring-blue-200/50"
                        onClick={() => handleRedirect(survey.link)}
                     >
                        {/* AceLogo */}
                        <img src="/AceLogo.png" alt="AceSurvey" className="object-cover w-16 h-16 mx-auto mb-6 transition-transform duration-300 shadow-lg rounded-xl group-hover:scale-110" />

                        {/* Content */}
                        <div className="space-y-4">
                           <h3 className="text-xl font-bold leading-tight text-center text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-700">
                              {survey.title}
                           </h3>

                           <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-600">
                              <CalendarIcon className="w-4 h-4" />
                              {survey.created_at ? new Date(survey.created_at).toLocaleDateString() : 'Recent'}
                           </div>

                           <div className="flex items-center justify-center pt-4 mt-auto border-t border-gray-200">
                              <button className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-xl hover:scale-105 hover:from-blue-700 hover:to-indigo-700 ring ring-blue-200/50">
                                 Start Survey
                                 <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>

         <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      </div>
   );
}


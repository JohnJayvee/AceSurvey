import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@hooks/useDashboardData";
import DashboardStats from "@components/dashboard/DashboardStats";
import SurveyPerformanceCharts from "@components/dashboard/SurveyPerformanceCharts";
import LatestSurveyCard from "@components/dashboard/LatestSurveyCard";
import RatingDistributionChart from "@components/dashboard/RatingDistributionChart";
import SurveyAnalyticsChart from "@components/dashboard/SurveyAnalyticsChart";
import LatestResponsesList from "@components/dashboard/LatestResponsesList";
import Footer from "@components/Footer.jsx";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Dashboard() {
   const navigate = useNavigate();
   const { data, loading, error } = useDashboardData();

   const handleViewResponses = (surveyId) => {
      navigate(`/surveys/${surveyId}/responses`);
   };

   const handleViewDetail = (surveyId, responseId) => {
      navigate(`/surveys/${surveyId}/responses/${responseId}`);
   };

   if (loading) {
      return (
         <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
            <div className="space-y-8">
               {/* Performance Charts Section Skeleton - Matches your layout */}
               <div className="flex flex-col w-full gap-5 mx-auto text-gray-700 lg:flex-row xl:w-3/4">
                  <div className="w-full">
                     <Skeleton height={400} className="rounded-lg" />
                  </div>
                  <div className="w-full">
                     <Skeleton height={400} className="rounded-lg" />
                  </div>
               </div>

               {/* Main Dashboard Content Skeleton - Matches your actual layout */}
               <div className="flex flex-col w-full gap-5 mx-auto text-gray-700 lg:flex-row xl:w-3/4">
                  {/* Left Column Skeleton - lg:w-3/4 */}
                  <div className="flex flex-col w-full space-y-4 lg:w-3/4">
                     {/* Stats Cards Skeleton */}
                     <div className="flex gap-4">
                        <div className="w-full">
                           <Skeleton height={120} className="rounded-lg" />
                        </div>
                        <div className="w-full">
                           <Skeleton height={120} className="rounded-lg" />
                        </div>
                     </div>
                     {/* Latest Survey Card Skeleton */}
                     <div>
                        <Skeleton height={600} className="rounded-lg" />
                     </div>
                  </div>

                  {/* Right Column Skeleton - lg:w-2/3 */}
                  <div className="w-full space-y-5 lg:w-2/3">
                     <Skeleton height={400} className="rounded-lg" />
                     <Skeleton height={400} className="rounded-lg" />
                     <Skeleton height={400} className="rounded-lg" />
                  </div>
               </div>

               {/* Footer Skeleton */}
               <Skeleton height={100} className="rounded-lg" />
            </div>
         </SkeletonTheme>
      );
   }

   if (error) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
               <h2 className="mb-2 text-xl font-bold text-red-600">Error Loading Dashboard</h2>
               <p className="text-gray-600">{error}</p>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-8">
         {/* Performance Charts Section */}
         <div className="flex flex-col w-full gap-5 mx-auto text-gray-700 lg:flex-row xl:w-3/4">
            <SurveyPerformanceCharts
               topSurveys={data.topSurveys}
               bottomSurveys={data.bottomSurveys}
            />
         </div>

         {/* Main Dashboard Content */}
         <div className="flex flex-col w-full gap-5 mx-auto text-gray-700 lg:flex-row xl:w-3/4">
            {/* Left Column - Stats and Latest Survey */}
            <div className="flex flex-col w-full space-y-4 lg:w-3/4">
               <DashboardStats
                  totalSurveys={data.totalSurveys}
                  totalAnswers={data.totalAnswers}
               />
               <LatestSurveyCard
                  survey={data.latestSurvey}
                  onViewResponses={handleViewResponses}
               />
            </div>

            {/* Right Column - Analytics */}
            <div className="w-full space-y-5 lg:w-2/3">
               <RatingDistributionChart data={data.ratingsData} />
               <SurveyAnalyticsChart data={data.chartData} />
               <LatestResponsesList
                  responses={data.latestAnswers}
                  onViewDetail={handleViewDetail}
               />
            </div>
         </div>

         <Footer />
      </div>
   );
}

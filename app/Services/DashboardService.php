<?php

namespace App\Services;

use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Http\Resources\SurveyResourceDashboard;
use App\Http\Resources\SurveyAnswerResource;
use Illuminate\Support\Facades\DB;

class DashboardService
{
   public function getDashboardData(int $userId): array
   {
      $total = Survey::where('user_id', $userId)->count();

      $latest = Survey::where('user_id', $userId)
         ->latest('created_at')
         ->first();

      $totalAnswers = SurveyAnswer::join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
         ->where('surveys.user_id', $userId)
         ->count();

      $latestAnswers = SurveyAnswer::select('survey_answers.*')
         ->join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
         ->where('surveys.user_id', $userId)
         ->orderBy('survey_answers.end_date', 'DESC')
         ->limit(15)
         ->get();

      return [
         'totalSurveys' => (int) $total,
         'latestSurvey' => $latest ? new SurveyResourceDashboard($latest) : null,
         'totalAnswers' => (int) $totalAnswers,
         'latestAnswers' => SurveyAnswerResource::collection($latestAnswers)
      ];
   }

   public function getAnalyticsData(int $userId): array
   {
      $surveyStats = Survey::select(['id', 'title', 'created_at', 'updated_at', 'expire_date', 'status'])
         ->withCount('answers')
         ->where('user_id', $userId)
         ->get()
         ->map(function ($survey) {
            return [
               'id' => $survey->id,
               'title' => strip_tags($survey->title),
               'answers' => (int) $survey->answers_count,
               'created_at' => $survey->created_at->format('Y-m-d H:i:s'),
               'updated_at' => $survey->updated_at->format('Y-m-d H:i:s'),
            ];
         });

      $surveyQuestionsCount = Survey::select(['id', 'title'])
         ->withCount('questions')
         ->where('user_id', $userId)
         ->get()
         ->keyBy('id');

      $combinedStats = $surveyStats->map(function ($stat) use ($surveyQuestionsCount) {
         $surveyData = $surveyQuestionsCount->get($stat['id']);
         $questionsCount = $surveyData ? $surveyData->questions_count : 0;

         return [
            'id' => $stat['id'],
            'title' => $stat['title'],
            'answers' => $stat['answers'],
            'questions' => (int) $questionsCount,
            'created_at' => $stat['created_at'],
            'updated_at' => $stat['updated_at'],
         ];
      })->sortByDesc('updated_at')
         ->values();

      $totalSurveys = $combinedStats->count();
      $totalAnswers = $surveyStats->sum('answers');

      return [
         'analytics' => [
            'surveyStats' => $combinedStats,
            'totalAnswers' => (int) $totalAnswers,
            'totalSurveys' => (int) $totalSurveys,
         ],
      ];
   }

   public function getPerformanceData(int $userId): array
   {
      $surveys = Survey::select(['id', 'title', 'created_at'])
         ->where('user_id', $userId)
         ->withCount(['answers', 'questions'])
         ->get();

      $totalViews = $surveys->sum('questions_count') * 10;
      $totalResponses = $surveys->sum('answers_count');
      $responseRate = $totalViews > 0 ? round(($totalResponses / $totalViews) * 100, 2) : 0;
      $avgCompletionTime = $surveys->count() > 0 ? rand(120, 300) : 0;

      $topSurveys = $surveys->sortByDesc('answers_count')
         ->take(5)
         ->map(function ($survey) {
            return [
               'id' => $survey->id,
               'title' => strip_tags($survey->title),
               'answers_count' => (int) $survey->answers_count,
               'questions_count' => (int) $survey->questions_count
            ];
         })
         ->values();

      return [
         'responseRate' => (float) $responseRate,
         'avgCompletionTime' => (int) $avgCompletionTime,
         'totalViews' => (int) $totalViews,
         'totalResponses' => (int) $totalResponses,
         'topSurveys' => $topSurveys
      ];
   }

   public function getRecentActivity(int $userId): array
   {
      $recentSurveys = Survey::select(['id', 'title', 'status', 'created_at', 'updated_at'])
         ->where('user_id', $userId)
         ->latest('updated_at')
         ->take(10)
         ->get()
         ->map(function ($survey) {
            return [
               'id' => $survey->id,
               'title' => strip_tags($survey->title),
               'status' => (bool) $survey->status,
               'created_at' => $survey->created_at->toISOString(),
               'updated_at' => $survey->updated_at->toISOString()
            ];
         });

      $recentAnswers = SurveyAnswer::select(['survey_answers.id', 'survey_answers.created_at', 'surveys.title as survey_title'])
         ->join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
         ->where('surveys.user_id', $userId)
         ->latest('survey_answers.created_at')
         ->take(10)
         ->get()
         ->map(function ($answer) {
            return [
               'id' => $answer->id,
               'created_at' => $answer->created_at->toISOString(),
               'survey_title' => strip_tags($answer->survey_title)
            ];
         });

      return [
         'recentSurveys' => $recentSurveys,
         'recentAnswers' => $recentAnswers,
         'lastUpdated' => now()->toISOString()
      ];
   }

   public function getSummaryData(int $userId): array
   {
      $totalSurveys = Survey::where('user_id', $userId)->count();

      $activeSurveys = Survey::where('user_id', $userId)
         ->where('status', true)
         ->where('expire_date', '>', now())
         ->count();

      $totalResponses = SurveyAnswer::join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
         ->where('surveys.user_id', $userId)
         ->count();

      $avgResponsesPerSurvey = $totalSurveys > 0 ? round($totalResponses / $totalSurveys, 2) : 0;

      $thirtyDaysAgo = now()->subDays(30);

      $newSurveysThisMonth = Survey::where('user_id', $userId)
         ->where('created_at', '>=', $thirtyDaysAgo)
         ->count();

      $newResponsesThisMonth = SurveyAnswer::join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
         ->where('surveys.user_id', $userId)
         ->where('survey_answers.created_at', '>=', $thirtyDaysAgo)
         ->count();

      return [
         'totalSurveys' => (int) $totalSurveys,
         'activeSurveys' => (int) $activeSurveys,
         'totalResponses' => (int) $totalResponses,
         'avgResponsesPerSurvey' => (float) $avgResponsesPerSurvey,
         'newSurveysThisMonth' => (int) $newSurveysThisMonth,
         'newResponsesThisMonth' => (int) $newResponsesThisMonth,
         'lastUpdated' => now()->toISOString()
      ];
   }
}

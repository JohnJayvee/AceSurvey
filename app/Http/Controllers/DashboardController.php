<?php

namespace App\Http\Controllers;

use App\Http\Resources\SurveyAnswerResource;
use App\Http\Resources\SurveyResourceDashboard;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $cacheKey = "dashboard_data_user_{$user->id}";

        // Cache dashboard data for 5 minutes (300 seconds)
        $dashboardData = Cache::remember($cacheKey, 300, function () use ($user) {
            // Total Number of Surveys
            $total = Survey::query()->where('user_id', $user->id)->count();

            // Latest Survey
            $latest = Survey::query()->where('user_id', $user->id)->latest('created_at')->first();

            // Total Number of answers
            $totalAnswers = SurveyAnswer::query()
                ->join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
                ->where('surveys.user_id', $user->id)
                ->count();

            // Latest 15 answers
            $latestAnswers = SurveyAnswer::query()
                ->join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
                ->where('surveys.user_id', $user->id)
                ->orderBy('end_date', 'DESC')
                ->limit(15)
                ->getModels('survey_answers.*');

            return [
                'totalSurveys' => $total,
                'latestSurvey' => $latest ? new SurveyResourceDashboard($latest) : null,
                'totalAnswers' => $totalAnswers,
                'latestAnswers' => SurveyAnswerResource::collection($latestAnswers)
            ];
        });

        return $dashboardData;
    }

    public function analytics(Request $request)
    {
        $user = $request->user();
        $cacheKey = "analytics_data_user_{$user->id}";

        // Cache analytics data for 10 minutes (600 seconds)
        $analyticsData = Cache::remember($cacheKey, 600, function () use ($user) {
            // Get survey statistics (survey answers count)
            $surveyStats = Survey::withCount('answers')
                ->where('user_id', $user->id)
                ->get()
                ->map(function ($survey) {
                    return [
                        'title' => $survey->title,
                        'answers' => $survey->answers_count,
                        'created_at' => $survey->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            // Fetch the number of questions for each survey
            $surveyQuestionsCount = Survey::withCount('questions')
                ->where('user_id', $user->id)
                ->get()
                ->map(function ($survey) {
                    return [
                        'title' => $survey->title,
                        'questions' => $survey->questions_count,
                    ];
                });

            // Fetch additional analytics like active vs expired surveys
            $surveyStatus = Survey::where('user_id', $user->id)
                ->get()
                ->map(function ($survey) {
                    $isExpired = $survey->expire_date <= now();
                    return [
                        'title' => $survey->title,
                        'status' => $isExpired ? 'Expired' : ($survey->status ? 'Active' : 'Closed'),
                    ];
                });

            // Combine the survey statistics, questions count, and survey status into one array
            $combinedStats = $surveyStats->map(function ($stat) use ($surveyQuestionsCount, $surveyStatus) {
                $questionsCount = $surveyQuestionsCount->firstWhere('title', $stat['title']);
                $status = $surveyStatus->firstWhere('title', $stat['title']);

                return [
                    'title' => $stat['title'],
                    'answers' => $stat['answers'],
                    'questions' => $questionsCount ? $questionsCount['questions'] : 0,
                    'status' => $status ? $status['status'] : 'Unknown',
                    'created_at' => $stat['created_at'],
                ];
            });

            // Calculate overall statistics
            $totalSurveys = $surveyStats->count();
            $totalAnswers = $surveyStats->sum('answers');

            return [
                'analytics' => [
                    'surveyStats' => $combinedStats,
                    'totalAnswers' => $totalAnswers,
                    'totalSurveys' => $totalSurveys,
                ],
            ];
        });

        return response()->json($analyticsData);
    }

    /**
     * Clear dashboard cache for a specific user
     * Call this method when surveys are created, updated, or deleted
     */
    public function clearDashboardCache(Request $request)
    {
        $user = $request->user();
        Cache::forget("dashboard_data_user_{$user->id}");
        Cache::forget("analytics_data_user_{$user->id}");

        return response()->json(['message' => 'Dashboard cache cleared successfully']);
    }

    /**
     * Clear dashboard cache for a specific user ID
     * Use this in other controllers when survey data changes
     */
    public static function clearUserDashboardCache($userId)
    {
        Cache::forget("dashboard_data_user_{$userId}");
        Cache::forget("analytics_data_user_{$userId}");
    }
}

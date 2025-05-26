<?php

namespace App\Http\Controllers;

use App\Http\Resources\SurveyAnswerResource;
use App\Http\Resources\SurveyResourceDashboard;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Services\DatabaseLogger; // Add this import

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $cacheKey = "dashboard_data_user_{$user->id}";

        DatabaseLogger::info('dashboard_access', 'User accessed dashboard', [], $request, $user->id);

        try {
            // Cache dashboard data for 5 minutes (300 seconds)
            $dashboardData = Cache::remember($cacheKey, 300, function () use ($user, $request) {
                DatabaseLogger::info('dashboard_data_generation', 'Generating dashboard data from database', [], $request, $user->id);

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

            DatabaseLogger::info('dashboard_data_retrieved', 'Dashboard data retrieved successfully', [
                'total_surveys' => $dashboardData['totalSurveys'],
                'total_answers' => $dashboardData['totalAnswers'],
                'has_latest_survey' => !is_null($dashboardData['latestSurvey']),
                'latest_answers_count' => count($dashboardData['latestAnswers']),
                'cached' => Cache::has($cacheKey)
            ], $request, $user->id);

            return $dashboardData;
        } catch (\Exception $e) {
            DatabaseLogger::error('dashboard_error', 'Failed to retrieve dashboard data', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], $request, $user->id);
            throw $e;
        }
    }

    public function analytics(Request $request)
    {
        $user = $request->user();
        $cacheKey = "analytics_data_user_{$user->id}";

        DatabaseLogger::info('analytics_access', 'User accessed analytics', [], $request, $user->id);

        try {
            // Cache analytics data for 10 minutes (600 seconds)
            $analyticsData = Cache::remember($cacheKey, 600, function () use ($user, $request) {
                DatabaseLogger::info('analytics_data_generation', 'Generating analytics data from database', [], $request, $user->id);

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

            DatabaseLogger::info('analytics_data_retrieved', 'Analytics data retrieved successfully', [
                'total_surveys' => $analyticsData['analytics']['totalSurveys'],
                'total_answers' => $analyticsData['analytics']['totalAnswers'],
                'survey_stats_count' => count($analyticsData['analytics']['surveyStats']),
                'cached' => Cache::has($cacheKey)
            ], $request, $user->id);

            return response()->json($analyticsData);
        } catch (\Exception $e) {
            DatabaseLogger::error('analytics_error', 'Failed to retrieve analytics data', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], $request, $user->id);
            throw $e;
        }
    }

    /**
     * Clear dashboard cache for a specific user
     * Call this method when surveys are created, updated, or deleted
     */
    public function clearDashboardCache(Request $request)
    {
        $user = $request->user();

        DatabaseLogger::info('dashboard_cache_clear_request', 'User requested dashboard cache clear', [], $request, $user->id);

        try {
            Cache::forget("dashboard_data_user_{$user->id}");
            Cache::forget("analytics_data_user_{$user->id}");

            DatabaseLogger::info('dashboard_cache_cleared', 'Dashboard cache cleared successfully', [], $request, $user->id);

            return response()->json(['message' => 'Dashboard cache cleared successfully']);
        } catch (\Exception $e) {
            DatabaseLogger::error('dashboard_cache_clear_error', 'Failed to clear dashboard cache', [
                'error' => $e->getMessage()
            ], $request, $user->id);
            throw $e;
        }
    }

    /**
     * Clear dashboard cache for a specific user ID
     * Use this in other controllers when survey data changes
     */
    public static function clearUserDashboardCache($userId)
    {
        try {
            Cache::forget("dashboard_data_user_{$userId}");
            Cache::forget("analytics_data_user_{$userId}");

            DatabaseLogger::info('dashboard_cache_cleared_static', 'Dashboard cache cleared via static method', [
                'target_user_id' => $userId
            ], request());
        } catch (\Exception $e) {
            DatabaseLogger::error('dashboard_cache_clear_static_error', 'Failed to clear dashboard cache via static method', [
                'target_user_id' => $userId,
                'error' => $e->getMessage()
            ], request());
        }
    }

    /**
     * Get dashboard performance metrics
     */
    public function performance(Request $request)
    {
        $user = $request->user();

        DatabaseLogger::info('dashboard_performance_access', 'User accessed dashboard performance metrics', [], $request, $user->id);

        try {
            $cacheKey = "dashboard_performance_user_{$user->id}";

            $performanceData = Cache::remember($cacheKey, 900, function () use ($user, $request) {
                DatabaseLogger::info('dashboard_performance_generation', 'Generating performance metrics', [], $request, $user->id);

                // Calculate response rates
                $surveys = Survey::where('user_id', $user->id)
                    ->withCount(['answers', 'questions'])
                    ->get();

                $totalViews = $surveys->sum('questions_count') * 10; // Estimated views
                $totalResponses = $surveys->sum('answers_count');
                $responseRate = $totalViews > 0 ? round(($totalResponses / $totalViews) * 100, 2) : 0;

                // Calculate average completion time (mock data for now)
                $avgCompletionTime = $surveys->count() > 0 ? rand(120, 300) : 0; // seconds

                // Top performing surveys
                $topSurveys = $surveys->sortByDesc('answers_count')->take(5)->values();

                return [
                    'responseRate' => $responseRate,
                    'avgCompletionTime' => $avgCompletionTime,
                    'totalViews' => $totalViews,
                    'totalResponses' => $totalResponses,
                    'topSurveys' => $topSurveys
                ];
            });

            DatabaseLogger::info('dashboard_performance_retrieved', 'Performance metrics retrieved successfully', [
                'response_rate' => $performanceData['responseRate'],
                'avg_completion_time' => $performanceData['avgCompletionTime'],
                'total_responses' => $performanceData['totalResponses'],
                'cached' => Cache::has($cacheKey)
            ], $request, $user->id);

            return response()->json($performanceData);
        } catch (\Exception $e) {
            DatabaseLogger::error('dashboard_performance_error', 'Failed to retrieve performance metrics', [
                'error' => $e->getMessage()
            ], $request, $user->id);
            throw $e;
        }
    }

    /**
     * Get recent activity for dashboard
     */
    public function recentActivity(Request $request)
    {
        $user = $request->user();

        DatabaseLogger::info('dashboard_activity_access', 'User accessed recent activity', [], $request, $user->id);

        try {
            $cacheKey = "dashboard_activity_user_{$user->id}";

            $activityData = Cache::remember($cacheKey, 300, function () use ($user, $request) {
                DatabaseLogger::info('dashboard_activity_generation', 'Generating recent activity data', [], $request, $user->id);

                // Get recent survey activities
                $recentSurveys = Survey::where('user_id', $user->id)
                    ->latest('updated_at')
                    ->take(10)
                    ->get(['id', 'title', 'status', 'created_at', 'updated_at']);

                // Get recent answers
                $recentAnswers = SurveyAnswer::join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
                    ->where('surveys.user_id', $user->id)
                    ->latest('survey_answers.created_at')
                    ->take(10)
                    ->get(['survey_answers.id', 'survey_answers.created_at', 'surveys.title as survey_title']);

                return [
                    'recentSurveys' => $recentSurveys,
                    'recentAnswers' => $recentAnswers,
                    'lastUpdated' => now()->toISOString()
                ];
            });

            DatabaseLogger::info('dashboard_activity_retrieved', 'Recent activity data retrieved successfully', [
                'recent_surveys_count' => count($activityData['recentSurveys']),
                'recent_answers_count' => count($activityData['recentAnswers']),
                'cached' => Cache::has($cacheKey)
            ], $request, $user->id);

            return response()->json($activityData);
        } catch (\Exception $e) {
            DatabaseLogger::error('dashboard_activity_error', 'Failed to retrieve recent activity', [
                'error' => $e->getMessage()
            ], $request, $user->id);
            throw $e;
        }
    }

    /**
     * Get dashboard summary statistics
     */
    public function summary(Request $request)
    {
        $user = $request->user();

        DatabaseLogger::info('dashboard_summary_access', 'User accessed dashboard summary', [], $request, $user->id);

        try {
            $cacheKey = "dashboard_summary_user_{$user->id}";

            $summaryData = Cache::remember($cacheKey, 600, function () use ($user, $request) {
                DatabaseLogger::info('dashboard_summary_generation', 'Generating dashboard summary', [], $request, $user->id);

                $totalSurveys = Survey::where('user_id', $user->id)->count();
                $activeSurveys = Survey::where('user_id', $user->id)
                    ->where('status', true)
                    ->where('expire_date', '>', now())
                    ->count();

                $totalResponses = SurveyAnswer::join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
                    ->where('surveys.user_id', $user->id)
                    ->count();

                $avgResponsesPerSurvey = $totalSurveys > 0 ? round($totalResponses / $totalSurveys, 2) : 0;

                // Growth metrics (compared to last 30 days)
                $thirtyDaysAgo = now()->subDays(30);
                $newSurveysThisMonth = Survey::where('user_id', $user->id)
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->count();

                $newResponsesThisMonth = SurveyAnswer::join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
                    ->where('surveys.user_id', $user->id)
                    ->where('survey_answers.created_at', '>=', $thirtyDaysAgo)
                    ->count();

                return [
                    'totalSurveys' => $totalSurveys,
                    'activeSurveys' => $activeSurveys,
                    'totalResponses' => $totalResponses,
                    'avgResponsesPerSurvey' => $avgResponsesPerSurvey,
                    'newSurveysThisMonth' => $newSurveysThisMonth,
                    'newResponsesThisMonth' => $newResponsesThisMonth,
                    'lastUpdated' => now()->toISOString()
                ];
            });

            DatabaseLogger::info('dashboard_summary_retrieved', 'Dashboard summary retrieved successfully', [
                'total_surveys' => $summaryData['totalSurveys'],
                'active_surveys' => $summaryData['activeSurveys'],
                'total_responses' => $summaryData['totalResponses'],
                'avg_responses_per_survey' => $summaryData['avgResponsesPerSurvey'],
                'cached' => Cache::has($cacheKey)
            ], $request, $user->id);

            return response()->json($summaryData);
        } catch (\Exception $e) {
            DatabaseLogger::error('dashboard_summary_error', 'Failed to retrieve dashboard summary', [
                'error' => $e->getMessage()
            ], $request, $user->id);
            throw $e;
        }
    }
}

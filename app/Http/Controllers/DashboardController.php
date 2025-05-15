<?php

namespace App\Http\Controllers;

use App\Http\Resources\SurveyAnswerResource;
use App\Http\Resources\SurveyResourceDashboard;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Total Number of Surveys
        $total = Survey::query()->where('user_id', $user->id)->count();

        // Latest Survey
        $latest = Survey::query()->where('user_id', $user->id)->latest('created_at')->first();

        // Total Number of answers
        $totalAnswers = SurveyAnswer::query()
            ->join('surveys', 'survey_answers.survey_id', '=', 'surveys.id')
            ->where('surveys.user_id', $user->id)
            ->count();

        // Latest 5 answer
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
    }

    public function analytics(Request $request)
    {
        $user = $request->user(); // Authenticated user

        // Get survey statistics (survey answers count)
        $surveyStats = Survey::withCount('answers')
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($survey) {
                return [
                    'title' => $survey->title,
                    'answers' => $survey->answers_count,  // Answers count for each survey
                    'created_at' => $survey->created_at->format('Y-m-d H:i:s'), // Added creation date
                ];
            });

        // Fetch the number of questions for each survey
        $surveyQuestionsCount = Survey::withCount('questions')
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($survey) {
                return [
                    'title' => $survey->title,
                    'questions' => $survey->questions_count,  // Questions count for each survey
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
                'status' => $status ? $status['status'] : 'Unknown', // Default status if not found
                'created_at' => $stat['created_at'], // Include the creation date

            ];
        });

        // Optionally, calculate some overall statistics, like total answers and total surveys
        $totalSurveys = $surveyStats->count();
        $totalAnswers = $surveyStats->sum('answers');

        return response()->json([
            'analytics' => [
                'surveyStats' => $combinedStats,
                'totalAnswers' => $totalAnswers,
                'totalSurveys' => $totalSurveys,
            ],
        ]);
    }

    public function topSurvey()
    {
        $topSurveys = Survey::query()
            ->select('id', 'title', 'expire_date')
            ->withCount('answers')
            ->having('answers_count', '>', 0)  // Only include surveys with responses
            ->orderBy('answers_count', 'desc') // Highest first
            ->limit(5)
            ->get();

        return response()->json($topSurveys);
    }

    public function botSurvey()
    {
        $botSurveys = Survey::query()
            ->select('id', 'title', 'expire_date')
            ->withCount('answers')
            ->having('answers_count', '>', 0)  // Only include surveys with responses
            ->orderBy('answers_count', 'asc')  // Lowest first
            ->limit(5)
            ->get();

        return response()->json($botSurveys);
    }
}

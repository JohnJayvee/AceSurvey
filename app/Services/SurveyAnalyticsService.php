<?php

namespace App\Services;

use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestionAnswer;

class SurveyAnalyticsService
{
   public function getTotalRatings(int $userId): array
   {
      $userSurveyIds = Survey::where('user_id', $userId)->pluck('id');

      $totalAnswers = SurveyQuestionAnswer::whereHas('surveyAnswer', function ($query) use ($userSurveyIds) {
         $query->whereIn('survey_id', $userSurveyIds);
      })->count();

      if ($totalAnswers === 0) {
         return ['message' => 'No ratings found', 'ratings' => []];
      }

      $ratings = [
         '5' => ['count' => 0, 'percentage' => 0],
         '4' => ['count' => 0, 'percentage' => 0],
         '3' => ['count' => 0, 'percentage' => 0],
         '2' => ['count' => 0, 'percentage' => 0],
         '1' => ['count' => 0, 'percentage' => 0]
      ];

      $answers = SurveyQuestionAnswer::whereHas('surveyAnswer', function ($query) use ($userSurveyIds) {
         $query->whereIn('survey_id', $userSurveyIds);
      })->whereRaw('answer REGEXP "^[1-5]"')->get();

      foreach ($answers as $answer) {
         $sanitizedAnswer = strip_tags($answer->answer);
         $rating = substr($sanitizedAnswer, 0, 1);
         if (isset($ratings[$rating])) {
            $ratings[$rating]['count']++;
         }
      }

      $validAnswers = array_sum(array_column($ratings, 'count'));
      if ($validAnswers > 0) {
         foreach ($ratings as $rating => $data) {
            $ratings[$rating]['percentage'] = round(($data['count'] / $validAnswers) * 100, 2);
         }
      }

      return ['ratings' => $ratings];
   }

   public function getTopSurveys(int $userId, int $limit = 5): \Illuminate\Database\Eloquent\Collection
   {
      return Survey::query()
         ->select('id', 'title', 'expire_date')
         ->where('user_id', $userId)
         ->withCount('answers')
         ->having('answers_count', '>', 0)
         ->orderBy('answers_count', 'desc')
         ->limit($limit)
         ->get();
   }

   public function getBottomSurveys(int $userId, int $limit = 5): \Illuminate\Database\Eloquent\Collection
   {
      return Survey::query()
         ->select('id', 'title', 'expire_date')
         ->where('user_id', $userId)
         ->withCount('answers')
         ->having('answers_count', '>', 0)
         ->orderBy('answers_count', 'asc')
         ->limit($limit)
         ->get();
   }

   public function getResponseCount(Survey $survey): int
   {
      return SurveyAnswer::where('survey_id', $survey->id)->count();
   }
}

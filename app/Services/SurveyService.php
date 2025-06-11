<?php

namespace App\Services;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestionAnswer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use App\Enums\QuestionTypeEnum;

class SurveyService
{
   public function createSurvey(array $data, int $userId): Survey
   {
      return DB::transaction(function () use ($data, $userId) {
         $data['title'] = strip_tags(trim($data['title']));
         $data['description'] = strip_tags(trim($data['description'] ?? ''));
         $data['user_id'] = $userId;

         $survey = Survey::create($data);

         if (isset($data['questions'])) {
            $questions = array_slice($data['questions'], 0, 50);
            foreach ($questions as $question) {
               $question['survey_id'] = $survey->id;
               $this->createQuestion($question);
            }
         }

         return $survey;
      });
   }

   public function updateSurvey(Survey $survey, array $data): Survey
   {
      return DB::transaction(function () use ($survey, $data) {
         if (isset($data['title'])) {
            $data['title'] = strip_tags(trim($data['title']));
         }
         if (isset($data['description'])) {
            $data['description'] = strip_tags(trim($data['description']));
         }

         $survey->update($data);

         if (isset($data['questions'])) {
            $this->updateSurveyQuestions($survey, $data['questions']);
         }

         return $survey;
      });
   }

   public function deleteSurvey(Survey $survey): void
   {
      DB::transaction(function () use ($survey) {
         $survey->delete();
      });
   }

   public function storeSurveyAnswer(Survey $survey, array $answers, string $ipAddress): void
   {
      DB::transaction(function () use ($survey, $answers, $ipAddress) {
         $surveyAnswer = SurveyAnswer::create([
            'survey_id' => $survey->id,
            'start_date' => now(),
            'end_date' => now(),
            'ip_address' => $ipAddress,
         ]);

         foreach ($answers as $questionId => $answer) {
            $question = SurveyQuestion::where([
               'id' => $questionId,
               'survey_id' => $survey->id
            ])->first();

            if (!$question) {
               throw new \Exception('Invalid question ID');
            }

            $sanitizedAnswer = is_array($answer)
               ? json_encode(array_map('strip_tags', $answer))
               : strip_tags($answer);

            SurveyQuestionAnswer::create([
               'survey_question_id' => $questionId,
               'survey_answer_id' => $surveyAnswer->id,
               'answer' => $sanitizedAnswer
            ]);
         }
      });
   }

   public function getSurveysByUser(int $userId, ?string $search = null, int $perPage = 12)
   {
      $query = Survey::where('user_id', $userId);

      if ($search) {
         $query->where(function ($q) use ($search) {
            $q->where('title', 'LIKE', '%' . addslashes($search) . '%')
               ->orWhere('description', 'LIKE', '%' . addslashes($search) . '%');
         });
      }

      return $query->orderBy('created_at', 'desc')->paginate($perPage);
   }

   public function isUserAuthorized(Survey $survey, int $userId): bool
   {
      return $survey->user_id === $userId;
   }

   public function isSurveyActive(Survey $survey): bool
   {
      return $survey->status && new \DateTime() <= new \DateTime($survey->expire_date);
   }

   private function createQuestion(array $data): SurveyQuestion
   {
      $data['question'] = strip_tags(trim($data['question']));
      $data['description'] = isset($data['description']) ? strip_tags(trim($data['description'])) : null;

      if (is_array($data['data'])) {
         $data['data'] = json_encode($data['data']);
      }

      $validator = Validator::make($data, [
         'question' => 'required|string|max:1000',
         'type' => ['required', new Enum(QuestionTypeEnum::class)],
         'description' => 'nullable|string|max:2000',
         'data' => 'present',
         'survey_id' => 'required|exists:surveys,id'
      ]);

      return SurveyQuestion::create($validator->validated());
   }

   private function updateSurveyQuestions(Survey $survey, array $questions): void
   {
      $existingIds = $survey->questions()->pluck('id')->toArray();
      $newIds = array_filter(array_column($questions, 'id'));
      $toDelete = array_diff($existingIds, $newIds);

      if (!empty($toDelete)) {
         SurveyQuestion::destroy($toDelete);
      }

      $questions = array_slice($questions, 0, 50);

      foreach ($questions as $questionData) {
         if (isset($questionData['id']) && in_array($questionData['id'], $existingIds)) {
            $question = SurveyQuestion::find($questionData['id']);
            if ($question && $question->survey_id === $survey->id) {
               $this->updateQuestion($question, $questionData);
            }
         } else {
            $questionData['survey_id'] = $survey->id;
            $this->createQuestion($questionData);
         }
      }
   }

   private function updateQuestion(SurveyQuestion $question, array $data): void
   {
      $data['question'] = strip_tags(trim($data['question']));
      $data['description'] = isset($data['description']) ? strip_tags(trim($data['description'])) : null;

      if (is_array($data['data'])) {
         $data['data'] = json_encode($data['data']);
      }

      $validator = Validator::make($data, [
         'id' => 'exists:survey_questions,id',
         'question' => 'required|string|max:1000',
         'type' => ['required', new Enum(QuestionTypeEnum::class)],
         'description' => 'nullable|string|max:2000',
         'data' => 'present',
      ]);

      $question->update($validator->validated());
   }
}

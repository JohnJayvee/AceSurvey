<?php

namespace App\Http\Controllers;

use Cache;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use Illuminate\Http\Request;
use App\Services\SurveyService;
use App\Services\DatabaseLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use App\Services\SurveyCacheService;
use App\Services\SurveyImageService;
use App\Http\Resources\SurveyResource;
use App\Services\SurveyAnalyticsService;
use App\Services\SurveyRateLimitService;
use App\Http\Requests\SurveyStoreRequest;
use App\Http\Requests\SurveyUpdateRequest;
use App\Http\Requests\StoreSurveyAnswerRequest;

class SurveyController extends Controller
{
   private SurveyService $surveyService;
   private SurveyAnalyticsService $analyticsService;
   private SurveyRateLimitService $rateLimitService;
   private SurveyCacheService $cacheService;
   private SurveyImageService $imageService;

   public function __construct(
      SurveyService $surveyService,
      SurveyAnalyticsService $analyticsService,
      SurveyRateLimitService $rateLimitService,
      SurveyCacheService $cacheService,
      SurveyImageService $imageService
   ) {
      $this->surveyService = $surveyService;
      $this->analyticsService = $analyticsService;
      $this->rateLimitService = $rateLimitService;
      $this->cacheService = $cacheService;
      $this->imageService = $imageService;

      $this->middleware('throttle:60,1')->only(['index', 'show', 'responses']);
      $this->middleware('throttle:10,1')->only(['store', 'update', 'destroy']);
      $this->middleware('throttle:30,1')->only(['storeAnswer', 'getBySlug']);
      $this->middleware('throttle:100,1')->only(['getLinks']);
      $this->middleware('auth:sanctum')->except(['getBySlug', 'storeAnswer', 'getLinks']);
   }

   /**
    * Display a listing of the resource.
    */
   public function index(Request $request)
   {
      $user = $request->user();
      $validated = $request->validate([
         'search' => 'nullable|string|max:255',
         'page' => 'nullable|integer|min:1|max:1000',
         'per_page' => 'nullable|integer|min:1|max:50'
      ]);

      $search = isset($validated['search']) && $validated['search'] ? strip_tags(trim($validated['search'])) : null;
      $page = $validated['page'] ?? 1;
      $perPage = min($validated['per_page'] ?? 12, 50);

      DatabaseLogger::info('surveys_index', 'User accessed surveys list', [
         'search' => $search,
         'page' => $page,
         'per_page' => $perPage
      ], $request, $user->id);

      try {
         $cacheKey = $this->cacheService->createSurveyListCacheKey($user->id, $search, $page, $perPage);

         $result = $this->cacheService->remember($cacheKey, 300, function () use ($user, $search, $perPage) {
            return $this->surveyService->getSurveysByUser($user->id, $search, $perPage);
         });

         DatabaseLogger::info('surveys_index_success', 'Surveys list retrieved successfully', [
            'search' => $search,
            'page' => $page,
            'cached' => $this->cacheService->has($cacheKey)
         ], $request, $user->id);

         return SurveyResource::collection($result)
            ->response()
            ->withHeaders($this->getSecurityHeaders());

      } catch (\Exception $e) {
         return $this->handleError('surveys_index_error', 'Failed to retrieve surveys list', $e, $request, $user->id);
      }
   }

   /**
    * Store a newly created resource in storage.
    */
   public function store(SurveyStoreRequest $request)
   {
      $data = $request->validated();
      $user = $request->user();

      if ($this->rateLimitService->checkLimit('survey_create', $user->id, 10)) {
         return $this->errorResponse('Too many survey creation attempts', 429);
      }

      $userSurveyCount = Survey::where('user_id', $user->id)->count();
      if ($userSurveyCount >= 100) {
         return $this->errorResponse('Survey limit reached', 403);
      }

      DatabaseLogger::info('survey_create_attempt', 'User attempting to create survey', [
         'title' => strip_tags($data['title']),
         'questions_count' => count($data['questions'] ?? [])
      ], $request, $user->id);

      try {
         if (isset($data['image'])) {
            $data['image'] = $this->imageService->saveImage($data['image']);
         }

         $survey = $this->surveyService->createSurvey($data, $user->id);

         $this->rateLimitService->clear('survey_create', $user->id);
         $this->cacheService->clearUserSurveyCache($user->id);

         DatabaseLogger::info('survey_create_success', 'Survey created successfully', [
            'survey_id' => $survey->id,
            'title' => $survey->title,
            'slug' => $survey->slug
         ], $request, $user->id);

         return (new SurveyResource($survey))
            ->response()
            ->withHeaders($this->getSecurityHeaders());

      } catch (\Exception $e) {
         $this->rateLimitService->hit('survey_create', $user->id);
         return $this->handleError('survey_create_error', 'Failed to create survey', $e, $request, $user->id);
      }
   }

   /**
    * Display the specified resource.
    */
   public function show(Survey $survey, Request $request)
   {
      $user = $request->user();

      if (!$this->surveyService->isUserAuthorized($survey, $user->id)) {
         DatabaseLogger::warning('survey_access_denied', 'Unauthorized survey access attempt', [
            'survey_id' => $survey->id,
            'survey_owner_id' => $survey->user_id
         ], $request, $user->id);

         return $this->errorResponse('Unauthorized', 403);
      }

      DatabaseLogger::info('survey_view', 'User viewing survey details', [
         'survey_id' => $survey->id,
         'survey_title' => $survey->title
      ], $request, $user->id);

      $cachedSurvey = $this->cacheService->remember("survey_{$survey->id}", 3600, function () use ($survey) {
         return $survey->load('questions');
      });

      return (new SurveyResource($cachedSurvey))
         ->response()
         ->withHeaders($this->getSecurityHeaders());
   }

   /**
    * Update the specified resource in storage.
    */
   public function update(SurveyUpdateRequest $request, Survey $survey)
   {
      $data = $request->validated();
      $user = $request->user();

      if (!$this->surveyService->isUserAuthorized($survey, $user->id)) {
         return $this->errorResponse('Unauthorized', 403);
      }

      if ($this->rateLimitService->checkLimit('survey_update', $user->id, 20)) {
         return $this->errorResponse('Too many update attempts', 429);
      }

      DatabaseLogger::info('survey_update_attempt', 'User attempting to update survey', [
         'survey_id' => $survey->id,
         'title' => strip_tags($data['title'] ?? $survey->title)
      ], $request, $survey->user_id);

      try {
         if (isset($data['image'])) {
            $data['image'] = $this->imageService->saveImage($data['image']);
            if ($survey->image) {
               $this->imageService->deleteImage($survey->image);
            }
         }

         $survey = $this->surveyService->updateSurvey($survey, $data);

         $this->rateLimitService->clear('survey_update', $user->id);
         $this->cacheService->clearSurveyCaches($survey);

         DatabaseLogger::info('survey_update_success', 'Survey updated successfully', [
            'survey_id' => $survey->id,
            'title' => $survey->title
         ], $request, $survey->user_id);

         return (new SurveyResource($survey))
            ->response()
            ->withHeaders($this->getSecurityHeaders());

      } catch (\Exception $e) {
         $this->rateLimitService->hit('survey_update', $user->id);
         return $this->handleError('survey_update_error', 'Failed to update survey', $e, $request, $survey->user_id);
      }
   }

   /**
    * Remove the specified resource from storage.
    */
   public function destroy(Survey $survey, Request $request)
   {
      $user = $request->user();

      if (!$this->surveyService->isUserAuthorized($survey, $user->id)) {
         return $this->errorResponse('Unauthorized', 403);
      }

      if ($this->rateLimitService->checkLimit('survey_delete', $user->id, 10)) {
         return $this->errorResponse('Too many delete attempts', 429);
      }

      DatabaseLogger::info('survey_delete_attempt', 'User attempting to delete survey', [
         'survey_id' => $survey->id,
         'survey_title' => $survey->title
      ], $request, $user->id);

      try {
         $imagePath = $survey->image;

         $this->surveyService->deleteSurvey($survey);

         if ($imagePath) {
            $this->imageService->deleteImage($imagePath);
         }

         $this->rateLimitService->clear('survey_delete', $user->id);
         $this->cacheService->clearSurveyCaches($survey);

         DatabaseLogger::info('survey_delete_success', 'Survey deleted successfully', [
            'survey_id' => $survey->id
         ], $request, $user->id);

         return response('', 204)->withHeaders($this->getSecurityHeaders());

      } catch (\Exception $e) {
         $this->rateLimitService->hit('survey_delete', $user->id);
         return $this->handleError('survey_delete_error', 'Failed to delete survey', $e, $request, $user->id);
      }
   }

   public function getBySlug(Survey $survey, Request $request)
   {
      if ($this->rateLimitService->checkLimit('survey_public', $request->ip(), 30)) {
         return $this->errorResponse('Too many requests', 429);
      }

      DatabaseLogger::info('survey_public_access', 'Public survey access attempt', [
         'survey_id' => $survey->id,
         'survey_slug' => $survey->slug,
         'ip' => $request->ip()
      ], $request);

      $cachedSurvey = $this->cacheService->remember("survey_by_slug_{$survey->slug}", 1800, function () use ($survey) {
         return $this->surveyService->isSurveyActive($survey) ? $survey->load('questions') : null;
      });

      if (!$cachedSurvey) {
         $this->rateLimitService->hit('survey_public', $request->ip());
         return $this->errorResponse('Survey not available', 404);
      }

      return (new SurveyResource($cachedSurvey))
         ->response()
         ->withHeaders($this->getSecurityHeaders());
   }

   public function storeAnswer(StoreSurveyAnswerRequest $request, Survey $survey)
   {
      $validated = $request->validated();

      if ($this->rateLimitService->checkLimit('survey_answer', $request->ip() . ':' . $survey->id, 5)) {
         return $this->errorResponse('Too many answer submissions', 429);
      }

      if (!$this->surveyService->isSurveyActive($survey)) {
         return $this->errorResponse('Survey is not available', 403);
      }

      DatabaseLogger::info('survey_answer_attempt', 'User attempting to submit survey answer', [
         'survey_id' => $survey->id,
         'answers_count' => count($validated['answers'] ?? []),
         'ip' => $request->ip()
      ], $request);

      try {
         $this->surveyService->storeSurveyAnswer($survey, $validated['answers'], $request->ip());

         $this->rateLimitService->clear('survey_answer', $request->ip() . ':' . $survey->id);

         DatabaseLogger::info('survey_answer_success', 'Survey answer submitted successfully', [
            'survey_id' => $survey->id
         ], $request);

         return response("", 201)->withHeaders($this->getSecurityHeaders());

      } catch (\Exception $e) {
         $this->rateLimitService->hit('survey_answer', $request->ip() . ':' . $survey->id);
         return $this->handleError('survey_answer_error', 'Failed to submit survey answer', $e, $request);
      }
   }

   public function totalRatings(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('ratings_total_view', 'User viewing total ratings', [], $request, $user->id);

      $cacheKey = "user_total_ratings_{$user->id}";
      $ratingsData = $this->cacheService->remember($cacheKey, 600, function () use ($user) {
         return $this->analyticsService->getTotalRatings($user->id);
      });

      return response()->json($ratingsData)->withHeaders($this->getSecurityHeaders());
   }

   public function topSurvey(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('top_surveys_view', 'User viewing top surveys', [], $request, $user->id);

      $cacheKey = "top_surveys_user_{$user->id}";
      $topSurveys = $this->cacheService->remember($cacheKey, 900, function () use ($user) {
         return $this->analyticsService->getTopSurveys($user->id);
      });

      return response()->json($topSurveys)->withHeaders($this->getSecurityHeaders());
   }

   public function botSurvey(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('bot_surveys_view', 'User viewing bottom surveys', [], $request, $user->id);

      $cacheKey = "bot_surveys_user_{$user->id}";
      $botSurveys = $this->cacheService->remember($cacheKey, 900, function () use ($user) {
         return $this->analyticsService->getBottomSurveys($user->id);
      });

      return response()->json($botSurveys)->withHeaders($this->getSecurityHeaders());
   }

   private function getSecurityHeaders(): array
   {
      return [
         'X-Content-Type-Options' => 'nosniff',
         'X-Frame-Options' => 'DENY',
         'X-XSS-Protection' => '1; mode=block',
         'Referrer-Policy' => 'strict-origin-when-cross-origin',
         'Content-Security-Policy' => "default-src 'self'",
      ];
   }

   private function errorResponse(string $message, int $code = 500): JsonResponse
   {
      return response()->json(['error' => $message], $code)->withHeaders($this->getSecurityHeaders());
   }

   private function handleError(string $logType, string $message, \Exception $e, Request $request, ?int $userId = null): JsonResponse
   {
      DatabaseLogger::error($logType, $message, [
         'error' => $e->getMessage(),
         'file' => basename($e->getFile()),
         'line' => $e->getLine()
      ], $request, $userId);

      return $this->errorResponse($message);
   }

   public function getResponseDetails($surveyId, $responseId, Request $request)
   {
      $user = $request->user();

      // Find survey and check authorization
      $survey = Survey::findOrFail($surveyId);
      if ($user->id !== $survey->user_id) {
         return response()->json(['error' => 'Unauthorized'], 403)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_response_details_view', 'User viewing survey response details', [
         'survey_id' => $surveyId,
         'response_id' => $responseId
      ], $request, $user->id);

      // Cache response details for 10 minutes
      $cacheKey = "response_details_{$surveyId}_{$responseId}";

      $responseData = Cache::remember($cacheKey, 600, function () use ($surveyId, $responseId) {
         // Fetch survey with related questions
         $survey = Survey::with(['questions'])->findOrFail($surveyId);

         // Find the SurveyAnswer with the correct surveyId and responseId
         $response = SurveyAnswer::where('id', $responseId)
            ->where('survey_id', $surveyId)
            ->with('answers')
            ->first();

         if (!$response) {
            return null;
         }

         // Ensure answers are present and log them
         $answers = $response->answers->mapWithKeys(function ($answer) {
            return [$answer->survey_question_id => strip_tags($answer->answer)];
         });

         // Retrieve and map the answers for the survey questions
         $questions = $survey->questions->map(function ($question) use ($answers) {
            return [
               'id' => $question->id,
               'type' => $question->type,
               'question' => strip_tags($question->question),
               'data' => json_decode($question->data),
               'answer' => $answers->get($question->id)
            ];
         });

         return [
            'title' => strip_tags($survey->title),
            'description' => strip_tags($survey->description),
            'status' => $survey->status,
            'image_url' => $survey->image ? url($survey->image) : null,
            'questions' => $questions
         ];
      });

      if (!$responseData) {
         DatabaseLogger::warning('survey_response_details_not_found', 'Survey response details not found', [
            'survey_id' => $surveyId,
            'response_id' => $responseId
         ], $request, $user->id);

         return response()->json(['message' => 'Response not found'], 404)
            ->withHeaders($this->getSecurityHeaders());
      }

      return response()->json($responseData)->withHeaders($this->getSecurityHeaders());
   }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSurveyAnswerRequest;
use App\Http\Requests\SurveyStoreRequest;
use App\Models\Survey;
use App\Http\Requests\SurveyUpdateRequest;
use App\Http\Resources\SurveyResource;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\SurveyQuestionAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use App\Enums\QuestionTypeEnum;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use App\Services\DatabaseLogger;
use Illuminate\Routing\Controller;


class SurveyController extends Controller
{
   public function __construct()
   {
      // Apply rate limiting to prevent abuse
      $this->middleware('throttle:60,1')->only(['index', 'show', 'responses']);
      $this->middleware('throttle:10,1')->only(['store', 'update', 'destroy']);
      $this->middleware('throttle:30,1')->only(['storeAnswer', 'getBySlug']);
      $this->middleware('throttle:100,1')->only(['getLinks']);

      // Ensure authentication for most endpoints
      $this->middleware('auth:sanctum')->except(['getBySlug', 'storeAnswer', 'getLinks']);
   }

   /**
    * Display a listing of the resource.
    */
   public function index(Request $request)
   {
      $user = $request->user();

      // Validate and sanitize input
      $request->validate([
         'search' => 'nullable|string|max:255',
         'page' => 'nullable|integer|min:1|max:1000',
         'per_page' => 'nullable|integer|min:1|max:50'
      ]);

      $search = $request->query('search');
      $page = $request->query('page', 1);
      $perPage = min($request->query('per_page', 12), 50);

      // Sanitize search input
      $search = $search ? strip_tags(trim($search)) : null;

      DatabaseLogger::info('surveys_index', 'User accessed surveys list', [
         'search' => $search,
         'page' => $page,
         'per_page' => $perPage
      ], $request, $user->id);

      // Create secure cache key
      $cacheKey = sprintf(
         "surveys_user_%d_search_%s_page_%d_per_page_%d",
         $user->id,
         hash('sha256', $search ?? ''),
         $page,
         $perPage
      );

      try {
         $result = Cache::remember($cacheKey, 300, function () use ($user, $search, $perPage) {
            $query = Survey::where("user_id", $user->id);

            if ($search) {
               $query->where(function ($q) use ($search) {
                  $q->where('title', 'LIKE', '%' . addslashes($search) . '%')
                     ->orWhere('description', 'LIKE', '%' . addslashes($search) . '%');
               });
            }

            return $query->orderBy("created_at", "desc")->paginate($perPage);
         });

         DatabaseLogger::info('surveys_index_success', 'Surveys list retrieved successfully', [
            'search' => $search,
            'page' => $page,
            'cached' => Cache::has($cacheKey)
         ], $request, $user->id);

         // Fix: Return resource collection with proper response
         return SurveyResource::collection($result)
            ->response()
            ->withHeaders($this->getSecurityHeaders());

      } catch (\Exception $e) {
         DatabaseLogger::error('surveys_index_error', 'Failed to retrieve surveys list', [
            'search' => $search,
            'page' => $page,
            'error' => $e->getMessage()
         ], $request, $user->id);

         return response()->json(['error' => 'Failed to retrieve surveys'], 500)
            ->withHeaders($this->getSecurityHeaders());
      }
   }

   /**
    * Store a newly created resource in storage.
    */
   public function store(SurveyStoreRequest $request)
   {
      $data = $request->validated();
      $user = $request->user();

      // Rate limiting per user
      $rateLimitKey = 'survey_create:' . $user->id;
      if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
         return response()->json(['error' => 'Too many survey creation attempts'], 429)
            ->withHeaders($this->getSecurityHeaders());
      }

      // Check user's survey quota (prevent spam)
      $userSurveyCount = Survey::where('user_id', $user->id)->count();
      if ($userSurveyCount >= 100) {
         return response()->json(['error' => 'Survey limit reached'], 403)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_create_attempt', 'User attempting to create survey', [
         'title' => strip_tags($data['title']),
         'questions_count' => count($data['questions'] ?? [])
      ], $request, $user->id);

      try {
         DB::beginTransaction();

         // Sanitize title and description
         $data['title'] = strip_tags(trim($data['title']));
         $data['description'] = strip_tags(trim($data['description'] ?? ''));
         $data['user_id'] = $user->id;

         if (isset($data['image'])) {
            $relativePath = $this->saveImage($data['image']);
            $data['image'] = $relativePath;
         }

         $survey = Survey::create($data);

         // Limit number of questions
         $questions = array_slice($data['questions'] ?? [], 0, 50);
         foreach ($questions as $question) {
            $question['survey_id'] = $survey->id;
            $this->createQuestion($question);
         }

         DB::commit();
         RateLimiter::clear($rateLimitKey);

         // Clear user's survey cache
         $this->clearUserSurveyCache($user->id);

         // Cache the new survey
         Cache::put("survey_{$survey->id}", $survey->load('questions'), 3600);

         DatabaseLogger::info('survey_create_success', 'Survey created successfully', [
            'survey_id' => $survey->id,
            'title' => $survey->title,
            'slug' => $survey->slug,
            'questions_count' => count($questions)
         ], $request, $user->id);

         // Fix: Convert resource to response first, then add headers
         return (new SurveyResource($survey))
            ->response()
            ->withHeaders($this->getSecurityHeaders());

      } catch (\Exception $e) {
         DB::rollBack();
         RateLimiter::hit($rateLimitKey);

         DatabaseLogger::error('survey_create_error', 'Failed to create survey', [
            'title' => $data['title'] ?? null,
            'error' => $e->getMessage()
         ], $request, $user->id);

         return response()->json(['error' => 'Failed to create survey'], 500)
            ->withHeaders($this->getSecurityHeaders());
      }
   }

   /**
    * Display the specified resource.
    */
   public function show(Survey $survey, Request $request)
   {
      $user = $request->user();

      // Authorization check
      if ($user->id !== $survey->user_id) {
         DatabaseLogger::warning('survey_access_denied', 'Unauthorized survey access attempt', [
            'survey_id' => $survey->id,
            'survey_title' => $survey->title,
            'survey_owner_id' => $survey->user_id
         ], $request, $user->id);

         return response()->json(['error' => 'Unauthorized'], 403)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_view', 'User viewing survey details', [
         'survey_id' => $survey->id,
         'survey_title' => $survey->title
      ], $request, $user->id);

      // Cache survey data for 1 hour
      $cachedSurvey = Cache::remember("survey_{$survey->id}", 3600, function () use ($survey) {
         return $survey->load('questions');
      });

      // Fix: Convert resource to response first, then add headers
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

      // Authorization check
      if ($user->id !== $survey->user_id) {
         return response()->json(['error' => 'Unauthorized'], 403)
            ->withHeaders($this->getSecurityHeaders());
      }

      // Rate limiting
      $rateLimitKey = 'survey_update:' . $user->id;
      if (RateLimiter::tooManyAttempts($rateLimitKey, 20)) {
         return response()->json(['error' => 'Too many update attempts'], 429)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_update_attempt', 'User attempting to update survey', [
         'survey_id' => $survey->id,
         'title' => strip_tags($data['title'] ?? $survey->title),
         'questions_count' => count($data['questions'] ?? [])
      ], $request, $survey->user_id);

      try {
         DB::beginTransaction();

         // Sanitize input
         if (isset($data['title'])) {
            $data['title'] = strip_tags(trim($data['title']));
         }
         if (isset($data['description'])) {
            $data['description'] = strip_tags(trim($data['description']));
         }

         // Handle image upload securely
         if (isset($data['image'])) {
            $relativePath = $this->saveImage($data['image']);
            $data['image'] = $relativePath;

            // Delete old image securely
            if ($survey->image) {
               $this->deleteImage($survey->image);
            }
         }

         // Update survey in the database
         $survey->update($data);

         // Handle questions securely
         if (isset($data['questions'])) {
            $this->updateSurveyQuestions($survey, $data['questions']);
         }

         DB::commit();
         RateLimiter::clear($rateLimitKey);

         // Clear caches related to this survey
         $this->clearSurveyCaches($survey);

         DatabaseLogger::info('survey_update_success', 'Survey updated successfully', [
            'survey_id' => $survey->id,
            'title' => $survey->title
         ], $request, $survey->user_id);

         // Fix: Convert resource to response first, then add headers
         return (new SurveyResource($survey))
            ->response()
            ->withHeaders($this->getSecurityHeaders());

      } catch (\Exception $e) {
         DB::rollBack();
         RateLimiter::hit($rateLimitKey);

         DatabaseLogger::error('survey_update_error', 'Failed to update survey', [
            'survey_id' => $survey->id,
            'error' => $e->getMessage()
         ], $request, $survey->user_id);

         return response()->json(['error' => 'Failed to update survey'], 500)
            ->withHeaders($this->getSecurityHeaders());
      }
   }

   /**
    * Remove the specified resource from storage.
    */
   public function destroy(Survey $survey, Request $request)
   {
      $user = $request->user();

      // Authorization check
      if ($user->id !== $survey->user_id) {
         DatabaseLogger::warning('survey_delete_denied', 'Unauthorized survey deletion attempt', [
            'survey_id' => $survey->id,
            'survey_title' => $survey->title,
            'survey_owner_id' => $survey->user_id
         ], $request, $user->id);

         return response()->json(['error' => 'Unauthorized'], 403)
            ->withHeaders($this->getSecurityHeaders());
      }

      // Rate limiting
      $rateLimitKey = 'survey_delete:' . $user->id;
      if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
         return response()->json(['error' => 'Too many delete attempts'], 429)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_delete_attempt', 'User attempting to delete survey', [
         'survey_id' => $survey->id,
         'survey_title' => $survey->title
      ], $request, $user->id);

      try {
         DB::beginTransaction();

         // Store image path before deletion
         $imagePath = $survey->image;

         // Delete survey (cascade will handle related records)
         $survey->delete();

         // Delete image file securely
         if ($imagePath) {
            $this->deleteImage($imagePath);
         }

         DB::commit();
         RateLimiter::clear($rateLimitKey);

         // Clear all caches related to this survey
         $this->clearSurveyCaches($survey);

         DatabaseLogger::info('survey_delete_success', 'Survey deleted successfully', [
            'survey_id' => $survey->id,
            'survey_title' => $survey->title
         ], $request, $user->id);

         return response('', 204)->withHeaders($this->getSecurityHeaders());
      } catch (\Exception $e) {
         DB::rollBack();
         RateLimiter::hit($rateLimitKey);

         DatabaseLogger::error('survey_delete_error', 'Failed to delete survey', [
            'survey_id' => $survey->id,
            'error' => $e->getMessage()
         ], $request, $user->id);

         return response()->json(['error' => 'Failed to delete survey'], 500)
            ->withHeaders($this->getSecurityHeaders());
      }
   }

   public function getBySlug(Survey $survey, Request $request)
   {
      // Rate limiting for public access
      $rateLimitKey = 'survey_public:' . $request->ip();
      if (RateLimiter::tooManyAttempts($rateLimitKey, 30)) {
         return response()->json(['error' => 'Too many requests'], 429)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_public_access', 'Public survey access attempt', [
         'survey_id' => $survey->id,
         'survey_slug' => $survey->slug,
         'survey_title' => $survey->title,
         'ip' => $request->ip()
      ], $request);

      // Cache survey by slug for public access
      $cachedSurvey = Cache::remember("survey_by_slug_{$survey->slug}", 1800, function () use ($survey) {
         if (!$survey->status) {
            return null;
         }

         $currentDate = new \DateTime();
         $expireDate = new \DateTime($survey->expire_date);
         if ($currentDate > $expireDate) {
            return null;
         }

         return $survey->load('questions');
      });

      if (!$cachedSurvey) {
         RateLimiter::hit($rateLimitKey);

         DatabaseLogger::warning('survey_public_access_denied', 'Public survey access denied - survey not available', [
            'survey_id' => $survey->id,
            'survey_slug' => $survey->slug,
            'status' => $survey->status,
            'expire_date' => $survey->expire_date
         ], $request);

         return response()->json(['message' => "Survey not available"], 404)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_public_access_success', 'Public survey accessed successfully', [
         'survey_id' => $survey->id,
         'survey_slug' => $survey->slug,
         'survey_title' => $survey->title
      ], $request);

      // Fix: Convert resource to response first, then add headers
      return (new SurveyResource($cachedSurvey))
         ->response()
         ->withHeaders($this->getSecurityHeaders());
   }

   public function storeAnswer(StoreSurveyAnswerRequest $request, Survey $survey)
   {
      $validated = $request->validated();

      // Rate limiting per IP for answer submissions
      $rateLimitKey = 'survey_answer:' . $request->ip() . ':' . $survey->id;
      if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
         return response()->json(['error' => 'Too many answer submissions'], 429)
            ->withHeaders($this->getSecurityHeaders());
      }

      // Check if survey is still active
      if (!$survey->status || new \DateTime() > new \DateTime($survey->expire_date)) {
         return response()->json(['error' => 'Survey is not available'], 403)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_answer_attempt', 'User attempting to submit survey answer', [
         'survey_id' => $survey->id,
         'survey_title' => $survey->title,
         'answers_count' => count($validated['answers'] ?? []),
         'ip' => $request->ip()
      ], $request);

      try {
         DB::beginTransaction();

         $surveyAnswer = SurveyAnswer::create([
            'survey_id' => $survey->id,
            'start_date' => now(),
            'end_date' => now(),
            'ip_address' => $request->ip(), // Track IP for security
         ]);

         foreach ($validated['answers'] as $questionId => $answer) {
            // Validate question exists and belongs to this survey
            $question = SurveyQuestion::where([
               'id' => $questionId,
               'survey_id' => $survey->id
            ])->first();

            if (!$question) {
               DB::rollBack();
               RateLimiter::hit($rateLimitKey);

               DatabaseLogger::error('survey_answer_invalid_question', 'Invalid question ID in survey answer', [
                  'survey_id' => $survey->id,
                  'question_id' => $questionId
               ], $request);

               return response()->json(['error' => 'Invalid question'], 400)
                  ->withHeaders($this->getSecurityHeaders());
            }

            // Sanitize answer
            $sanitizedAnswer = is_array($answer) ?
               json_encode(array_map('strip_tags', $answer)) :
               strip_tags($answer);

            SurveyQuestionAnswer::create([
               'survey_question_id' => $questionId,
               'survey_answer_id' => $surveyAnswer->id,
               'answer' => $sanitizedAnswer
            ]);
         }

         DB::commit();
         RateLimiter::clear($rateLimitKey);

         // Clear related caches
         $this->clearSurveyResponseCaches($survey);

         DatabaseLogger::info('survey_answer_success', 'Survey answer submitted successfully', [
            'survey_id' => $survey->id,
            'survey_title' => $survey->title,
            'answer_id' => $surveyAnswer->id,
            'answers_count' => count($validated['answers'] ?? [])
         ], $request);

         return response("", 201)->withHeaders($this->getSecurityHeaders());
      } catch (\Exception $e) {
         DB::rollBack();
         RateLimiter::hit($rateLimitKey);

         DatabaseLogger::error('survey_answer_error', 'Failed to submit survey answer', [
            'survey_id' => $survey->id,
            'error' => $e->getMessage()
         ], $request);

         return response()->json(['error' => 'Failed to submit answer'], 500)
            ->withHeaders($this->getSecurityHeaders());
      }
   }

   public function responses(Survey $survey, Request $request)
   {
      $user = $request->user();

      // Authorization check
      if ($user->id !== $survey->user_id) {
         DatabaseLogger::warning('survey_responses_access_denied', 'Unauthorized survey responses access attempt', [
            'survey_id' => $survey->id,
            'survey_owner_id' => $survey->user_id
         ], $request, $user->id);

         return response()->json(['error' => 'Unauthorized'], 403)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_responses_view', 'User viewing survey responses', [
         'survey_id' => $survey->id,
         'survey_title' => $survey->title
      ], $request, $user->id);

      // Cache survey responses for 5 minutes
      $cacheKey = "survey_responses_{$survey->id}";

      $transformedResponses = Cache::remember($cacheKey, 300, function () use ($survey) {
         // Fetch questions with proper security
         $questions = $survey->questions()->select('id', 'question', 'type')->get();

         // Define special questions for PII identification
         $specialQuestions = [
            'Full name',
            'Name',
            'First name',
            'Last name',
            'Email',
            'Email address',
            'Phone',
            'Phone number',
            'Contact',
            'Address',
            'Location'
         ];

         // Fetch responses with proper pagination
         $responses = SurveyAnswer::where('survey_id', $survey->id)
            ->with([
               'answers' => function ($query) {
                  $query->select('id', 'survey_question_id', 'survey_answer_id', 'answer', 'created_at')
                     ->orderBy('created_at', 'desc');
               }
            ])
            ->limit(1000) // Prevent memory issues
            ->get();

         return $responses->map(function ($response) use ($questions, $specialQuestions) {
            $allAnswers = collect();

            foreach ($response->answers as $answer) {
               $question = $questions->firstWhere('id', $answer->survey_question_id);

               if ($question) {
                  // Sanitize answer for display
                  $sanitizedAnswer = strip_tags($answer->answer);

                  $answerData = [
                     'id' => $answer->id,
                     'question' => strip_tags($question->question),
                     'answer' => $sanitizedAnswer,
                     'created_at' => $answer->created_at,
                     'is_special' => in_array($question->question, $specialQuestions)
                  ];

                  $allAnswers->push($answerData);
               }
            }

            return [
               'id' => $response->id,
               'answers' => $allAnswers,
            ];
         });
      });

      return response()->json([
         'success' => true,
         'data' => $transformedResponses
      ])->withHeaders($this->getSecurityHeaders());
   }

   public function countResponses(Survey $survey, Request $request)
   {
      $user = $request->user();

      // Authorization check
      if ($user->id !== $survey->user_id) {
         DatabaseLogger::warning('survey_count_access_denied', 'Unauthorized survey response count access attempt', [
            'survey_id' => $survey->id,
            'survey_owner_id' => $survey->user_id
         ], $request, $user->id);

         return response()->json(['error' => 'Unauthorized'], 403)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_count_view', 'User viewing survey response count', [
         'survey_id' => $survey->id,
         'survey_title' => $survey->title
      ], $request, $user->id);

      // Cache response count for 5 minutes
      $count = Cache::remember("survey_response_count_{$survey->id}", 300, function () use ($survey) {
         return SurveyAnswer::where('survey_id', $survey->id)->count();
      });

      return response()->json(['count' => $count])->withHeaders($this->getSecurityHeaders());
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

   public function totalRatings(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('ratings_total_view', 'User viewing total ratings', [], $request, $user->id);

      // Cache user ratings for 10 minutes
      $cacheKey = "user_total_ratings_{$user->id}";

      $ratingsData = Cache::remember($cacheKey, 600, function () use ($user) {
         // Get IDs of surveys belonging to the logged-in user
         $userSurveyIds = Survey::where('user_id', $user->id)->pluck('id');

         // Get survey answers for user's surveys
         $totalAnswers = SurveyQuestionAnswer::whereHas('surveyAnswer', function ($query) use ($userSurveyIds) {
            $query->whereIn('survey_id', $userSurveyIds);
         })->count();

         if ($totalAnswers === 0) {
            return [
               'message' => 'No ratings found',
               'ratings' => []
            ];
         }

         // Initialize ratings array
         $ratings = [
            '5' => ['count' => 0, 'percentage' => 0],
            '4' => ['count' => 0, 'percentage' => 0],
            '3' => ['count' => 0, 'percentage' => 0],
            '2' => ['count' => 0, 'percentage' => 0],
            '1' => ['count' => 0, 'percentage' => 0]
         ];

         // Get all answers that start with a number for user's surveys
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
      });

      return response()->json($ratingsData)->withHeaders($this->getSecurityHeaders());
   }

   public function totalDepartmentRatings($surveyAnswerId, Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('ratings_department_view', 'User viewing department ratings', [
         'survey_answer_id' => $surveyAnswerId
      ], $request, $user->id);

      // Cache department ratings for 30 seconds
      $cacheKey = "dept_ratings_{$surveyAnswerId}_{$user->id}";

      $ratingsData = Cache::remember($cacheKey, 30, function () use ($user, $surveyAnswerId) {
         // Initialize ratings array
         $ratings = [
            '5' => ['count' => 0, 'percentage' => 0],
            '4' => ['count' => 0, 'percentage' => 0],
            '3' => ['count' => 0, 'percentage' => 0],
            '2' => ['count' => 0, 'percentage' => 0],
            '1' => ['count' => 0, 'percentage' => 0]
         ];

         // Get all answers for this specific survey answer
         $answers = SurveyQuestionAnswer::whereHas('surveyAnswer', function ($query) use ($user, $surveyAnswerId) {
            $query->where('survey_id', $surveyAnswerId)
               ->whereHas('survey', function ($q) use ($user) {
                  $q->where('user_id', $user->id);
               });
         })->get();

         if ($answers->isEmpty()) {
            return [
               'message' => 'No ratings found for this survey answer',
               'ratings' => $ratings
            ];
         }

         foreach ($answers as $answer) {
            $answerValue = strip_tags($answer->answer);
            $decoded = json_decode($answerValue, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
               continue;
            }

            $cleanAnswer = trim($answerValue);
            if (preg_match('/^([1-5])/', $cleanAnswer, $matches)) {
               $rating = $matches[1];
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
      });

      return response()->json($ratingsData)->withHeaders($this->getSecurityHeaders());
   }

   public function topSurvey(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('top_surveys_view', 'User viewing top surveys', [], $request, $user->id);

      // Cache top surveys for 15 minutes
      $cacheKey = "top_surveys_user_{$user->id}";

      $topSurveys = Cache::remember($cacheKey, 900, function () use ($user) {
         return Survey::query()
            ->select('id', 'title', 'expire_date')
            ->where('user_id', $user->id)
            ->withCount('answers')
            ->having('answers_count', '>', 0)
            ->orderBy('answers_count', 'desc')
            ->limit(5)
            ->get();
      });

      return response()->json($topSurveys)->withHeaders($this->getSecurityHeaders());
   }

   public function botSurvey(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('bot_surveys_view', 'User viewing bottom surveys', [], $request, $user->id);

      // Cache bottom surveys for 15 minutes
      $cacheKey = "bot_surveys_user_{$user->id}";

      $botSurveys = Cache::remember($cacheKey, 900, function () use ($user) {
         return Survey::query()
            ->select('id', 'title', 'expire_date')
            ->where('user_id', $user->id)
            ->withCount('answers')
            ->having('answers_count', '>', 0)
            ->orderBy('answers_count', 'asc')
            ->limit(5)
            ->get();
      });

      return response()->json($botSurveys)->withHeaders($this->getSecurityHeaders());
   }

   public function getLinks(Request $request)
   {
      // Rate limiting for public access
      $rateLimitKey = 'survey_links:' . $request->ip();
      if (RateLimiter::tooManyAttempts($rateLimitKey, 100)) {
         return response()->json(['error' => 'Too many requests'], 429)
            ->withHeaders($this->getSecurityHeaders());
      }

      DatabaseLogger::info('survey_links_view', 'User viewing survey links', [], $request);

      // Cache survey links for 30 minutes
      $cacheKey = "survey_links_all";

      $linksData = Cache::remember($cacheKey, 1800, function () {
         try {
            // Get all active surveys slugs with security check
            $slugs = Survey::where('status', true)
               ->where('expire_date', '>', now())
               ->pluck('slug')
               ->toArray();

            // Use secure base URL
            $baseUrl = config('app.url') . '/survey/public';
            $fullUrls = array_map(function ($slug) use ($baseUrl) {
               return $baseUrl . '/' . $slug;
            }, $slugs);

            return [
               'success' => true,
               'count' => count($fullUrls),
               'data' => $fullUrls
            ];
         } catch (\Exception $e) {
            return [
               'success' => false,
               'message' => 'Failed to retrieve survey links',
               'error' => $e->getMessage()
            ];
         }
      });

      if (!$linksData['success']) {
         DatabaseLogger::error('survey_links_error', 'Failed to retrieve survey links', [
            'error' => $linksData['error'] ?? 'Unknown error'
         ], $request);
      }

      return response()->json($linksData, $linksData['success'] ? 200 : 500)
         ->withHeaders($this->getSecurityHeaders());
   }

   // Add security headers to responses
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

   // Secure image upload
   private function saveImage($image): string
   {
      // Validate image format and size
      if (!preg_match('/^data:image\/(jpeg|jpg|png|gif);base64,/', $image, $type)) {
         throw new \Exception('Invalid image format');
      }

      $imageData = substr($image, strpos($image, ',') + 1);
      $type = strtolower($type[1]);

      // Validate file type
      if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
         throw new \Exception('Invalid image type');
      }

      $imageData = str_replace(' ', '+', $imageData);
      $decodedImage = base64_decode($imageData);

      if ($decodedImage === false) {
         throw new \Exception('Failed to decode image');
      }

      // Check file size (max 5MB)
      if (strlen($decodedImage) > 5 * 1024 * 1024) {
         throw new \Exception('Image too large');
      }

      // Generate secure filename
      $filename = hash('sha256', $decodedImage . time()) . '.' . $type;
      $dir = 'images/';
      $relativePath = $dir . $filename;
      $absolutePath = public_path($dir);

      // Create directory if it doesn't exist
      if (!File::exists($absolutePath)) {
         File::makeDirectory($absolutePath, 0755, true);
      }

      // Save file with proper permissions
      file_put_contents($absolutePath . $filename, $decodedImage);
      chmod($absolutePath . $filename, 0644);

      return $relativePath;
   }

   // Secure image deletion
   private function deleteImage(string $imagePath): void
   {
      $absolutePath = public_path($imagePath);
      if (File::exists($absolutePath)) {
         File::delete($absolutePath);
      }
   }

   // Clear survey-related caches
   private function clearSurveyCaches(Survey $survey): void
   {
      $cacheKeys = [
         "survey_{$survey->id}",
         "survey_by_slug_{$survey->slug}",
         "survey_responses_{$survey->id}",
         "survey_response_count_{$survey->id}",
      ];

      foreach ($cacheKeys as $key) {
         Cache::forget($key);
      }

      $this->clearUserSurveyCache($survey->user_id);
   }


   // Clear response-related caches
   private function clearSurveyResponseCaches(Survey $survey): void
   {
      Cache::forget("survey_responses_{$survey->id}");
      Cache::forget("survey_response_count_{$survey->id}");
      Cache::forget("user_total_ratings_{$survey->user_id}");
      Cache::forget("top_surveys_user_{$survey->user_id}");
      Cache::forget("bot_surveys_user_{$survey->user_id}");
   }

   // Update survey questions securely
   private function updateSurveyQuestions(Survey $survey, array $questions): void
   {
      $existingIds = $survey->questions()->pluck('id')->toArray();
      $newIds = array_filter(Arr::pluck($questions, 'id'));
      $toDelete = array_diff($existingIds, $newIds);

      // Delete removed questions
      if (!empty($toDelete)) {
         SurveyQuestion::destroy($toDelete);
      }

      // Process questions (limit to 50)
      $questions = array_slice($questions, 0, 50);

      foreach ($questions as $questionData) {
         if (isset($questionData['id']) && in_array($questionData['id'], $existingIds)) {
            // Update existing question
            $question = SurveyQuestion::find($questionData['id']);
            if ($question && $question->survey_id === $survey->id) {
               $this->updateQuestion($question, $questionData);
            }
         } else {
            // Create new question
            $questionData['survey_id'] = $survey->id;
            $this->createQuestion($questionData);
         }
      }
   }

   /**
    * Clear all survey-related cache for a user
    */
   private function clearUserSurveyCache($userId): void
   {
      // Clear user-specific caches
      $patterns = [
         "top_surveys_user_{$userId}",
         "bot_surveys_user_{$userId}",
         "user_total_ratings_{$userId}",
      ];

      foreach ($patterns as $pattern) {
         Cache::forget($pattern);
      }

      // Clear paginated survey caches for this user
      for ($page = 1; $page <= 10; $page++) {
         for ($perPage = 1; $perPage <= 50; $perPage++) {
            $cacheKey = sprintf(
               "surveys_user_%d_search_%s_page_%d_per_page_%d",
               $userId,
               hash('sha256', ''),
               $page,
               $perPage
            );
            Cache::forget($cacheKey);
         }
      }
   }

   private function createQuestion($data)
   {
      // Sanitize question data
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

   private function updateQuestion(SurveyQuestion $question, $data)
   {
      // Sanitize question data
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

      return $question->update($validator->validated());
   }
}

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

class SurveyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $search = $request->query('search');
        $page = $request->query('page', 1);

        // Create cache key based on user, search, and page
        $cacheKey = "surveys_user_{$user->id}_search_" . md5($search ?? '') . "_page_{$page}";

        return Cache::remember($cacheKey, 300, function () use ($user, $search) {
            $query = Survey::where("user_id", $user->id);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'LIKE', "%{$search}%")
                        ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            return SurveyResource::collection(
                $query->orderBy("created_at", "desc")
                    ->paginate(12)
            );
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SurveyStoreRequest $request)
    {
        $data = $request->validated();

        if (isset($data['image'])) {
            $relativePath = $this->saveImage($data['image']);
            $data['image'] = $relativePath;
        }

        $survey = Survey::create($data);

        foreach ($data['questions'] as $question) {
            $question['survey_id'] = $survey->id;
            $this->createQuestion($question);
        }

        // Clear user's survey cache
        $this->clearUserSurveyCache($request->user()->id);

        // Cache the new survey
        Cache::put("survey_{$survey->id}", $survey->load('questions'), 3600);

        return new SurveyResource($survey);
    }

    /**
     * Display the specified resource.
     */
    public function show(Survey $survey, Request $request)
    {
        $user = $request->user();
        if ($user->id !== $survey->user_id) {
            return abort(403, 'Unauthorized action');
        }

        // Cache survey data for 1 hour
        $cachedSurvey = Cache::remember("survey_{$survey->id}", 3600, function () use ($survey) {
            return $survey->load('questions');
        });

        return new SurveyResource($cachedSurvey);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SurveyUpdateRequest $request, Survey $survey)
    {
        $data = $request->validated();

        // Check if image was given and save on local file system
        if (isset($data['image'])) {
            $relativePath = $this->saveImage($data['image']);
            $data['image'] = $relativePath;

            // If there is an old image, delete it
            if ($survey->image) {
                $absolutePath = public_path($survey->image);
                File::delete($absolutePath);
            }
        }

        // Update survey in the database
        $survey->update($data);

        // Get ids as plain array of existing questions
        $existingIds = $survey->questions()->pluck('id')->toArray();
        // Get ids as plain array of new questions
        $newIds = Arr::pluck($data['questions'], 'id');
        // Find questions to delete
        $toDelete = array_diff($existingIds, $newIds);
        //Find questions to add
        $toAdd = array_diff($newIds, $existingIds);

        // Delete questions by $toDelete array
        SurveyQuestion::destroy($toDelete);

        // Create new questions
        foreach ($data['questions'] as $question) {
            if (in_array($question['id'], $toAdd)) {
                $question['survey_id'] = $survey->id;
                $this->createQuestion($question);
            }
        }

        // Update existing questions
        $questionMap = collect($data['questions'])->keyBy('id');
        foreach ($survey->questions as $question) {
            if (isset($questionMap[$question->id])) {
                $this->updateQuestion($question, $questionMap[$question->id]);
            }
        }

        // Clear caches related to this survey
        Cache::forget("survey_{$survey->id}");
        Cache::forget("survey_by_slug_{$survey->slug}");
        $this->clearUserSurveyCache($survey->user_id);

        return new SurveyResource($survey);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Survey $survey, Request $request)
    {
        $user = $request->user();
        if ($user->id !== $survey->user_id) {
            return abort(403, 'Unauthorized action');
        }

        // Clear all caches related to this survey
        Cache::forget("survey_{$survey->id}");
        Cache::forget("survey_by_slug_{$survey->slug}");
        Cache::forget("survey_responses_{$survey->id}");
        Cache::forget("survey_response_count_{$survey->id}");
        $this->clearUserSurveyCache($user->id);

        $survey->delete();

        // If there is an old image, delete it
        if ($survey->image) {
            $absolutePath = public_path($survey->image);
            File::delete($absolutePath);
        }

        return response('', 204);
    }

    public function getBySlug(Survey $survey)
    {
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
            return response()->json(['message' => "Survey not available"], 404);
        }

        return new SurveyResource($cachedSurvey);
    }

    public function storeAnswer(StoreSurveyAnswerRequest $request, Survey $survey)
    {
        $validated = $request->validated();

        $surveyAnswer = SurveyAnswer::create([
            'survey_id' => $survey->id,
            'start_date' => date('Y-m-d H:i:s'),
            'end_date' => date('Y-m-d H:i:s'),
        ]);

        foreach ($validated['answers'] as $questionId => $answer) {
            $question = SurveyQuestion::where(['id' => $questionId, 'survey_id' => $survey->id])->get();
            if (!$question) {
                return response("Invalid question ID: \"$questionId\"", 400);
            }

            $data = [
                'survey_question_id' => $questionId,
                'survey_answer_id' => $surveyAnswer->id,
                'answer' => is_array($answer) ? json_encode($answer) : $answer
            ];

            $questionAnswer = SurveyQuestionAnswer::create($data);
        }

        // Clear related caches when new answer is stored
        Cache::forget("survey_responses_{$survey->id}");
        Cache::forget("survey_response_count_{$survey->id}");
        Cache::forget("user_total_ratings_{$survey->user_id}");
        Cache::forget("top_surveys_user_{$survey->user_id}");
        Cache::forget("bot_surveys_user_{$survey->user_id}");

        return response("", 201);
    }

    public function responses(Survey $survey, Request $request)
    {
        $user = $request->user();
        if ($user->id !== $survey->user_id) {
            return abort(403, 'Unauthorized action');
        }

        // Cache survey responses for 5 minutes
        $cacheKey = "survey_responses_{$survey->id}";

        $transformedResponses = Cache::remember($cacheKey, 300, function () use ($survey) {
            // Fetch all questions related to the survey with eager loading
            $questions = $survey->questions;

            // Define special questions - expanded list
            $specialQuestions = [
                'Full name',
                'Name',
                'First name',
                'Email',
                'Phone',
                'Contact'
            ];

            // Fetch all responses with answers using eager loading
            $responses = SurveyAnswer::where('survey_id', $survey->id)
                ->with([
                    'answers' => function ($query) {
                        $query->orderBy('created_at', 'desc');
                    }
                ])
                ->get();

            // Transform responses
            return $responses->map(function ($response) use ($questions, $specialQuestions) {
                $allAnswers = collect();

                foreach ($response->answers as $answer) {
                    $question = $questions->firstWhere('id', $answer->survey_question_id);

                    if ($question) {
                        $answerData = [
                            'id' => $answer->id,
                            'question' => $question->question,
                            'answer' => $answer->answer,
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
        ]);
    }

    public function countResponses(Survey $survey, Request $request)
    {
        $user = $request->user();
        if ($user->id !== $survey->user_id) {
            return abort(403, 'Unauthorized action');
        }

        // Cache response count for 5 minutes
        $count = Cache::remember("survey_response_count_{$survey->id}", 300, function () use ($survey) {
            return SurveyAnswer::where('survey_id', $survey->id)->count();
        });

        return response()->json(['count' => $count]);
    }

    public function getResponseDetails($surveyId, $responseId)
    {
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
                return [$answer->survey_question_id => $answer->answer];
            });

            // Retrieve and map the answers for the survey questions
            $questions = $survey->questions->map(function ($question) use ($answers) {
                return [
                    'id' => $question->id,
                    'type' => $question->type,
                    'question' => $question->question,
                    'data' => json_decode($question->data),
                    'answer' => $answers->get($question->id)
                ];
            });

            return [
                'title' => $survey->title,
                'description' => $survey->description,
                'status' => $survey->status,
                'image_url' => $survey->image ? url($survey->image) : null,
                'questions' => $questions
            ];
        });

        if (!$responseData) {
            return response()->json(['message' => 'Response not found'], 404);
        }

        return response()->json($responseData);
    }

    public function totalRatings(Request $request)
    {
        $user = $request->user();

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
                $rating = substr($answer->answer, 0, 1);
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

        return response()->json($ratingsData);
    }

    public function totalDepartmentRatings($surveyAnswerId, Survey $survey, Request $request)
    {
        $user = $request->user();

        // Cache department ratings for 10 minutes
        $cacheKey = "dept_ratings_{$surveyAnswerId}_{$user->id}";

        $ratingsData = Cache::remember($cacheKey, 600, function () use ($user, $surveyAnswerId) {
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
                $answerValue = $answer->answer;
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

        return response()->json($ratingsData);
    }

    public function topSurvey(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

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

        return response()->json($topSurveys);
    }

    public function botSurvey(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

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

        return response()->json($botSurveys);
    }

    public function getLinks(Request $request)
    {
        // Cache survey links for 30 minutes
        $cacheKey = "survey_links_all";

        $linksData = Cache::remember($cacheKey, 1800, function () {
            try {
                // Get all active surveys slugs
                $slugs = Survey::where('status', true)
                    ->pluck('slug')
                    ->toArray();

                // Use hardcoded base URL instead of dynamic one
                $baseUrl = 'http://white-raccoon-508494.hostingersite.com/survey/public';
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

        return response()->json($linksData, $linksData['success'] ? 200 : 500);
    }

    /**
     * Clear all survey-related cache for a user
     */
    private function clearUserSurveyCache($userId)
    {
        // Clear specific cache patterns for the user
        $patterns = [
            "surveys_user_{$userId}_*",
            "top_surveys_user_{$userId}",
            "bot_surveys_user_{$userId}",
            "user_total_ratings_{$userId}",
        ];

        foreach ($patterns as $pattern) {
            if (strpos($pattern, '*') !== false) {
                // For wildcard patterns, you'd need to implement cache tag support
                // or manually track cache keys
                Cache::flush(); // Or implement a more sophisticated approach
            } else {
                Cache::forget($pattern);
            }
        }
    }

    // ...existing private methods remain the same...
    private function saveImage($image)
    {
        // Check if image is valid base64 string
        if (preg_match('/^data:image\/(\w+);base64,/', $image, $type)) {
            // Take out the base64 encoded text without mime type
            $image = substr($image, strpos($image, ',') + 1);
            // Get file extension
            $type = strtolower($type[1]); // jpg, png, gif

            // Check if file is an image
            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                throw new \Exception('invalid image type');
            }
            $image = str_replace(' ', '+', $image);
            $image = base64_decode($image);

            if ($image === false) {
                throw new \Exception('base64_decode failed');
            }
        } else {
            throw new \Exception('did not match data URI with image data');
        }

        $dir = 'images/';
        $file = Str::random() . '.' . $type;
        $absolutePath = public_path($dir);
        $relativePath = $dir . $file;

        // Check if the directory exists, if not create it
        if (!File::exists($absolutePath)) {
            File::makeDirectory($absolutePath, 0755, true);
        }

        file_put_contents($absolutePath . '/' . $file, $image);

        return $relativePath;
    }

    private function createQuestion($data)
    {
        if (is_array($data['data'])) {
            $data['data'] = json_encode($data['data']);
        }
        $validator = Validator::make($data, [
            'question' => 'required|string',
            'type' => [
                'required',
                new Enum(QuestionTypeEnum::class)
            ],
            'description' => 'nullable|string',
            'data' => 'present',
            'survey_id' => 'exists:App\Models\Survey,id'
        ]);

        return SurveyQuestion::create($validator->validated());
    }

    private function updateQuestion(SurveyQuestion $question, $data)
    {
        if (is_array($data['data'])) {
            $data['data'] = json_encode($data['data']);
        }
        $validator = Validator::make($data, [
            'id' => 'exists:App\Models\SurveyQuestion,id',
            'question' => 'required|string',
            'type' => [
                'required',
                new Enum(QuestionTypeEnum::class)
            ],
            'description' => 'nullable|string',
            'data' => 'present',
        ]);

        return $question->update($validator->validated());
    }
}


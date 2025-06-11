<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\DatabaseLogger;
use App\Services\DashboardService;
use App\Services\DashboardCacheService;
use App\Services\DashboardRateLimitService;
use Illuminate\Routing\Controller;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
   private DashboardService $dashboardService;
   private DashboardCacheService $cacheService;
   private DashboardRateLimitService $rateLimitService;

   public function __construct(
      DashboardService $dashboardService,
      DashboardCacheService $cacheService,
      DashboardRateLimitService $rateLimitService
   ) {
      $this->dashboardService = $dashboardService;
      $this->cacheService = $cacheService;
      $this->rateLimitService = $rateLimitService;

      $this->middleware(['auth:sanctum']);
      $this->middleware('throttle:60,1')->only(['index', 'analytics']);
      $this->middleware('throttle:30,1')->only(['performance', 'recentActivity', 'summary']);
      $this->middleware('throttle:10,1')->only(['clearDashboardCache']);
   }

   public function index(Request $request): JsonResponse
   {
      return $this->handleDashboardRequest(
         request: $request,
         type: 'dashboard',
         cacheKey: 'dashboard',
         cacheTtl: 300,
         dataCallback: fn($userId) => $this->dashboardService->getDashboardData($userId),
         logContext: fn($data) => [
            'total_surveys' => $data['totalSurveys'],
            'total_answers' => $data['totalAnswers'],
            'has_latest_survey' => !is_null($data['latestSurvey']),
            'latest_answers_count' => count($data['latestAnswers']),
         ]
      );
   }

   public function analytics(Request $request): JsonResponse
   {
      return $this->handleDashboardRequest(
         request: $request,
         type: 'analytics',
         cacheKey: 'analytics',
         cacheTtl: 30,
         dataCallback: fn($userId) => $this->dashboardService->getAnalyticsData($userId),
         logContext: fn($data) => [
            'total_surveys' => $data['analytics']['totalSurveys'],
            'total_answers' => $data['analytics']['totalAnswers'],
            'survey_stats_count' => count($data['analytics']['surveyStats']),
         ]
      );
   }

   public function performance(Request $request): JsonResponse
   {
      return $this->handleDashboardRequest(
         request: $request,
         type: 'performance',
         cacheKey: 'performance',
         cacheTtl: 900,
         dataCallback: fn($userId) => $this->dashboardService->getPerformanceData($userId),
         logContext: fn($data) => [
            'response_rate' => $data['responseRate'],
            'total_responses' => $data['totalResponses'],
         ]
      );
   }

   public function recentActivity(Request $request): JsonResponse
   {
      return $this->handleDashboardRequest(
         request: $request,
         type: 'activity',
         cacheKey: 'activity',
         cacheTtl: 300,
         dataCallback: fn($userId) => $this->dashboardService->getRecentActivity($userId),
         logContext: fn($data) => [
            'recent_surveys_count' => count($data['recentSurveys']),
            'recent_answers_count' => count($data['recentAnswers']),
         ]
      );
   }

   public function summary(Request $request): JsonResponse
   {
      return $this->handleDashboardRequest(
         request: $request,
         type: 'summary',
         cacheKey: 'summary',
         cacheTtl: 600,
         dataCallback: fn($userId) => $this->dashboardService->getSummaryData($userId),
         logContext: fn($data) => [
            'total_surveys' => $data['totalSurveys'],
            'active_surveys' => $data['activeSurveys'],
            'total_responses' => $data['totalResponses'],
         ]
      );
   }

   public function clearDashboardCache(Request $request): JsonResponse
   {
      $user = $request->user();

      if ($this->rateLimitService->checkLimit('cache_clear', $user->id)) {
         DatabaseLogger::warning('cache_clear_rate_limit', 'Cache clear rate limit exceeded', [], $request, $user->id);
         return $this->errorResponse('Too many cache clear requests', 429);
      }

      try {
         DatabaseLogger::info('dashboard_cache_clear_request', 'User requested dashboard cache clear', [
            'ip' => $request->ip()
         ], $request, $user->id);

         $success = $this->cacheService->clearUserCache($user->id);

         if ($success) {
            $this->rateLimitService->clear('cache_clear', $user->id);
            DatabaseLogger::info('dashboard_cache_cleared', 'Dashboard cache cleared successfully', [], $request, $user->id);

            return $this->successResponse(['message' => 'Dashboard cache cleared successfully']);
         }

         throw new \Exception('Failed to clear cache');

      } catch (\Exception $e) {
         $this->rateLimitService->hit('cache_clear', $user->id);
         return $this->handleError('dashboard_cache_clear_error', 'Failed to clear dashboard cache', $e, $request, $user->id);
      }
   }

   private function handleDashboardRequest(
      Request $request,
      string $type,
      string $cacheKey,
      int $cacheTtl,
      callable $dataCallback,
      callable $logContext
   ): JsonResponse {
      $user = $request->user();

      if ($this->rateLimitService->checkLimit($type, $user->id)) {
         DatabaseLogger::warning("{$type}_rate_limit", "{$type} access rate limit exceeded", [], $request, $user->id);
         return $this->errorResponse('Too many requests', 429);
      }

      try {
         $cacheKeyString = $this->cacheService->createSecureCacheKey($cacheKey, $user->id);

         DatabaseLogger::info("dashboard_{$type}_access", "User accessed dashboard {$type}", [
            'ip' => $request->ip(),
            'user_agent' => substr($request->userAgent(), 0, 255)
         ], $request, $user->id);

         $data = $this->cacheService->remember($cacheKeyString, $cacheTtl, function () use ($dataCallback, $user, $request, $type) {
            DatabaseLogger::info("dashboard_{$type}_generation", "Generating {$type} data from database", [], $request, $user->id);
            return $dataCallback($user->id);
         });

         $this->rateLimitService->clear($type, $user->id);

         $contextData = $logContext($data);
         $contextData['cached'] = $this->cacheService->has($cacheKeyString);

         DatabaseLogger::info("dashboard_{$type}_retrieved", "{$type} data retrieved successfully", $contextData, $request, $user->id);

         return $this->successResponse($data);

      } catch (\Exception $e) {
         $this->rateLimitService->hit($type, $user->id);
         return $this->handleError("dashboard_{$type}_error", "Failed to retrieve {$type} data", $e, $request, $user->id);
      }
   }

   private function successResponse(array $data): JsonResponse
   {
      return response()->json($data)->withHeaders($this->getSecurityHeaders());
   }

   private function errorResponse(string $message, int $code = 500): JsonResponse
   {
      return response()->json(['error' => $message], $code)->withHeaders($this->getSecurityHeaders());
   }

   private function handleError(string $logType, string $message, \Exception $e, Request $request, int $userId): JsonResponse
   {
      DatabaseLogger::error($logType, $message, [
         'error' => $e->getMessage(),
         'file' => basename($e->getFile()),
         'line' => $e->getLine()
      ], $request, $userId);

      return $this->errorResponse($message);
   }

   private function getSecurityHeaders(): array
   {
      return [
         'X-Content-Type-Options' => 'nosniff',
         'X-Frame-Options' => 'DENY',
         'X-XSS-Protection' => '1; mode=block',
         'Referrer-Policy' => 'strict-origin-when-cross-origin',
         'Content-Security-Policy' => "default-src 'self'",
         'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
      ];
   }
}

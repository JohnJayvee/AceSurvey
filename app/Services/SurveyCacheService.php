<?php

namespace App\Services;

use App\Models\Survey;
use Illuminate\Support\Facades\Cache;

class SurveyCacheService
{
    public function remember(string $key, int $ttl, callable $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    public function forget(string $key): void
    {
        Cache::forget($key);
    }

    public function has(string $key): bool
    {
        return Cache::has($key);
    }

    public function clearSurveyCaches(Survey $survey): void
    {
        $cacheKeys = [
            "survey_{$survey->id}",
            "survey_by_slug_{$survey->slug}",
            "survey_responses_{$survey->id}",
            "survey_response_count_{$survey->id}",
        ];

        foreach ($cacheKeys as $key) {
            $this->forget($key);
        }

        $this->clearUserSurveyCache($survey->user_id);
    }

    public function clearUserSurveyCache(int $userId): void
    {
        // Clear specific user caches
        $patterns = [
            "top_surveys_user_{$userId}",
            "bot_surveys_user_{$userId}",
            "user_total_ratings_{$userId}",
        ];

        foreach ($patterns as $pattern) {
            $this->forget($pattern);
        }

        // Use cache tags or flush all survey list caches for this user
        $this->clearSurveyListCaches($userId);
    }

    private function clearSurveyListCaches(int $userId): void
    {
        // Use a more efficient approach with cache tags if available
        if (method_exists(Cache::getStore(), 'tags')) {
            Cache::tags(["user_surveys_{$userId}"])->flush();
            return;
        }

        // Fallback: Clear known cache patterns
        $this->clearPaginatedCaches($userId);
    }

    private function clearPaginatedCaches(int $userId): void
    {
        // Clear with wildcard pattern if supported
        $pattern = "surveys_user_{$userId}_*";

        if (config('cache.default') === 'redis') {
            $this->clearRedisPattern($pattern);
        } else {
            // Fallback for other cache drivers
            $this->clearKnownPaginatedCaches($userId);
        }
    }

    private function clearRedisPattern(string $pattern): void
    {
        $redis = Cache::getStore()->connection();
        $keys = $redis->keys($pattern);

        if (!empty($keys)) {
            $redis->del($keys);
        }
    }

    private function clearKnownPaginatedCaches(int $userId): void
    {
        // Clear common pagination combinations
        $commonPerPage = [12, 15, 20, 25, 50];
        $maxPages = 20;

        for ($page = 1; $page <= $maxPages; $page++) {
            foreach ($commonPerPage as $perPage) {
                // Clear both with search and without search
                $patterns = [
                    "surveys_user_{$userId}_search_no_search_page_{$page}_per_page_{$perPage}",
                ];

                foreach ($patterns as $pattern) {
                    $this->forget($pattern);
                }
            }
        }
    }

    public function createSurveyListCacheKey(int $userId, ?string $search, int $page, int $perPage): string
    {
        $searchHash = $search ? hash('sha256', $search) : 'no_search';

        $key = sprintf(
            "surveys_user_%d_search_%s_page_%d_per_page_%d",
            $userId,
            $searchHash,
            $page,
            $perPage
        );

        // Tag the cache entry for easier clearing
        if (method_exists(Cache::getStore(), 'tags')) {
            return $this->createTaggedCacheKey($key, $userId);
        }

        return $key;
    }

    private function createTaggedCacheKey(string $key, int $userId): string
    {
        // This would be used with the tagged cache
        return $key;
    }

    public function rememberWithTags(string $key, array $tags, int $ttl, callable $callback)
    {
        if (method_exists(Cache::getStore(), 'tags')) {
            return Cache::tags($tags)->remember($key, $ttl, $callback);
        }

        return $this->remember($key, $ttl, $callback);
    }
}

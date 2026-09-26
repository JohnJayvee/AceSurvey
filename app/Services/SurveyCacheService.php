<?php

namespace App\Services;

use App\Models\Survey;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

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
        foreach ([
            "survey_{$survey->id}", "survey_by_slug_{$survey->slug}",
            "survey_responses_{$survey->id}", "survey_response_count_{$survey->id}",
            "dept_ratings_{$survey->id}_{$survey->user_id}",
        ] as $key) {
            $this->forget($key);
        }
        $this->clearUserSurveyCache($survey->user_id);
    }

    public function clearUserSurveyCache(int $userId): void
    {
        foreach ([
            "top_surveys_user_{$userId}", "bot_surveys_user_{$userId}",
            "user_total_ratings_{$userId}", 'public_survey_links_v2',
        ] as $key) {
            $this->forget($key);
        }
        // Versioning works with every cache driver and every search/page combination.
        // Old entries expire normally; no Redis KEYS scan or hundreds of deletes.
        Cache::forever("survey_list_version_{$userId}", (string) Str::uuid());
        app(DashboardCacheService::class)->clearUserCache($userId);
    }

    public function createSurveyListCacheKey(int $userId, ?string $search, int $page, int $perPage): string
    {
        $version = Cache::get("survey_list_version_{$userId}", 'initial');
        $searchHash = hash('sha256', $search ?? '');
        return "surveys_user_{$userId}_{$version}_{$searchHash}_{$page}_{$perPage}";
    }

    public function rememberWithTags(string $key, array $tags, int $ttl, callable $callback)
    {
        return Cache::supportsTags()
            ? Cache::tags($tags)->remember($key, $ttl, $callback)
            : $this->remember($key, $ttl, $callback);
    }
}

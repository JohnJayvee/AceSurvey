<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use App\Services\DatabaseLogger;

class DashboardCacheService
{
   private const CACHE_PREFIX = [
      'dashboard' => 'dashboard_data',
      'analytics' => 'analytics_data',
      'performance' => 'dashboard_performance',
      'activity' => 'dashboard_activity',
      'summary' => 'dashboard_summary'
   ];

   public function createSecureCacheKey(string $type, int $userId): string
   {
      $prefix = self::CACHE_PREFIX[$type] ?? $type;
      $key = "{$prefix}_user_{$userId}";

      if (!$this->validateCacheKey($key)) {
         throw new \InvalidArgumentException('Invalid cache key format');
      }

      return $key;
   }

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

   public function clearUserCache(int $userId): bool
   {
      if (!is_numeric($userId) || $userId <= 0) {
         DatabaseLogger::error('invalid_user_id_cache_clear', 'Invalid user ID for cache clear', [
            'user_id' => $userId
         ], request());
         return false;
      }

      try {
         foreach (self::CACHE_PREFIX as $prefix) {
            $this->forget("{$prefix}_user_{$userId}");
         }

         DatabaseLogger::info('dashboard_cache_cleared_bulk', 'Dashboard cache cleared for user', [
            'user_id' => $userId
         ], request());

         return true;
      } catch (\Exception $e) {
         DatabaseLogger::error('dashboard_cache_clear_error', 'Failed to clear user cache', [
            'user_id' => $userId,
            'error' => $e->getMessage()
         ], request());

         return false;
      }
   }

   private function validateCacheKey(string $key): bool
   {
      return preg_match('/^[a-zA-Z0-9_-]+$/', $key) && strlen($key) <= 100;
   }
}

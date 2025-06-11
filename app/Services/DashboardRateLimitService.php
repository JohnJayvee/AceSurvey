<?php

namespace App\Services;

use Illuminate\Support\Facades\RateLimiter;

class DashboardRateLimitService
{
   private const LIMITS = [
      'dashboard' => 60,
      'analytics' => 30,
      'performance' => 20,
      'activity' => 30,
      'summary' => 40,
      'cache_clear' => 5
   ];

   public function checkLimit(string $type, int $userId): bool
   {
      $key = $this->createRateLimitKey($type, $userId);
      $limit = self::LIMITS[$type] ?? 30;

      return RateLimiter::tooManyAttempts($key, $limit);
   }

   public function hit(string $type, int $userId): void
   {
      $key = $this->createRateLimitKey($type, $userId);
      RateLimiter::hit($key);
   }

   public function clear(string $type, int $userId): void
   {
      $key = $this->createRateLimitKey($type, $userId);
      RateLimiter::clear($key);
   }

   private function createRateLimitKey(string $type, int $userId): string
   {
      return "{$type}_access:{$userId}";
   }
}

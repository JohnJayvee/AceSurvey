<?php

namespace App\Services;

use Illuminate\Support\Facades\RateLimiter;

class SurveyRateLimitService
{
   public function checkLimit(string $type, string $identifier, int $limit): bool
   {
      $key = $this->createKey($type, $identifier);
      return RateLimiter::tooManyAttempts($key, $limit);
   }

   public function hit(string $type, string $identifier): void
   {
      $key = $this->createKey($type, $identifier);
      RateLimiter::hit($key);
   }

   public function clear(string $type, string $identifier): void
   {
      $key = $this->createKey($type, $identifier);
      RateLimiter::clear($key);
   }

   private function createKey(string $type, string $identifier): string
   {
      return "{$type}:{$identifier}";
   }
}

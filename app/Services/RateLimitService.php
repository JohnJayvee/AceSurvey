<?php

namespace App\Services;

use Illuminate\Support\Facades\RateLimiter;

class RateLimitService
{
   public function checkLoginLimit(string $login, string $ip): bool
   {
      $key = 'login:' . hash('sha256', $login . '|' . $ip);
      return RateLimiter::tooManyAttempts($key, 5);
   }

   public function hitLoginLimit(string $login, string $ip): void
   {
      $key = 'login:' . hash('sha256', $login . '|' . $ip);
      RateLimiter::hit($key);
   }

   public function clearLoginLimit(string $login, string $ip): void
   {
      $key = 'login:' . hash('sha256', $login . '|' . $ip);
      RateLimiter::clear($key);
   }

   public function checkSignupLimit(string $ip): bool
   {
      return RateLimiter::tooManyAttempts('signup:' . $ip, 3);
   }

   public function hitSignupLimit(string $ip): void
   {
      RateLimiter::hit('signup:' . $ip);
   }

   public function clearSignupLimit(string $ip): void
   {
      RateLimiter::clear('signup:' . $ip);
   }
}

<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthService
{
   public function createUser(array $data): User
   {
      return DB::transaction(function () use ($data) {
         return User::create([
            'name' => strip_tags($data['name']),
            'username' => $data['username'] ?? 'user_'.Str::uuid(),
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
         ]);
      });
   }

   public function generateAuthToken(User $user): string
   {
      $tokenName = 'auth_' . Str::uuid();
      return $user->createToken($tokenName, ['*'], now()->addDays(30))->plainTextToken;
   }

   public function findUserForLogin(string $login, string $loginType): ?User
   {
      if ($loginType === 'username') {
         $user = User::where('username', $login)->first();
         return $user && hash_equals($user->username, $login) ? $user : null;
      }

      return User::where('email', $login)->first();
   }

   public function processSuccessfulLogin(User $user): array
   {
      return DB::transaction(function () use ($user) {
         $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
         $firstLogin = $user->first_login_at === null;
         // Generate secure remember token
         $rememberToken = $this->generateUniqueRememberToken($user);

         $user->forceFill(['remember_token' => $rememberToken, 'first_login_at' => $user->first_login_at ?? now()])->save();

         $token = $this->generateAuthToken($user);

         return [
            'user' => $user->only(['id', 'name', 'email', 'is_admin', 'created_at']),
            'token' => $token,
            'show_welcome_tour' => $firstLogin,
         ];
      });
   }

   private function generateUniqueRememberToken(User $user): string
   {
      do {
         $token = hash('sha256', Str::random(60) . time() . $user->id);
      } while (User::where('remember_token', $token)->exists());

      return $token;
   }
}

<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\EmailChanged;
use Illuminate\Http\Request;
use App\Mail\PasswordChanged;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\SignupRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use App\Http\Requests\ChangePasswordRequest;
use App\Mail\PasswordReset;
use App\Services\DatabaseLogger;
use App\Services\AuthService;
use App\Services\RateLimitService;
use App\Services\TimingAttackProtection;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
   private AuthService $authService;
   private RateLimitService $rateLimitService;

   public function __construct(AuthService $authService, RateLimitService $rateLimitService)
   {
      $this->authService = $authService;
      $this->rateLimitService = $rateLimitService;

      $this->middleware('throttle:6,1')->only(['login', 'sendResetLinkEmail']);
      $this->middleware('throttle:3,1')->only(['changePassword', 'changeEmail']);
      $this->middleware('throttle:10,1')->only(['verifyEmailExists']);
   }

   public function me(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('user_profile_access', 'User accessed profile information', [], $request, $user->id);

      try {
         $cacheKey = "user_profile_{$user->id}";

         $userProfile = Cache::remember($cacheKey, 300, function () use ($user) {
            return $user->fresh()->only(['id', 'name', 'email', 'is_admin', 'created_at', 'updated_at']);
         });

         DatabaseLogger::info('user_profile_retrieved', 'User profile retrieved successfully', [
            'cached' => Cache::has($cacheKey)
         ], $request, $user->id);

         return response()->json($userProfile);
      } catch (\Exception $e) {
         return $this->handleError('user_profile_error', 'Failed to retrieve user profile', $e, $request, $user->id);
      }
   }

   public function signup(SignupRequest $request)
   {
      $data = $request->validated();

      if ($this->rateLimitService->checkSignupLimit($request->ip())) {
         DatabaseLogger::warning('signup_rate_limited', 'Signup rate limit exceeded', [
            'ip' => $request->ip()
         ], $request);

         return response()->json(['error' => 'Too many signup attempts. Please try again later.'], 429);
      }

      DatabaseLogger::info('signup_attempt', 'User signup attempt', [
         'email' => $data['email'],
         'name' => $data['name']
      ], $request);

      try {
         $user = $this->authService->createUser($data);
         $token = $this->authService->generateAuthToken($user);

         $this->rateLimitService->clearSignupLimit($request->ip());

         DatabaseLogger::info('signup_success', 'User signup successful', [
            'email' => $user->email,
            'name' => $user->name
         ], $request, $user->id);

         return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'is_admin', 'created_at']),
            'token' => $token
         ]);
      } catch (\Exception $e) {
         $this->rateLimitService->hitSignupLimit($request->ip());
         return $this->handleError('signup_failed', 'User signup failed', $e, $request, null, [
            'email' => $data['email']
         ]);
      }
   }

   public function login(Request $request)
   {
      $timingProtection = new TimingAttackProtection();

      $request->validate([
         'login' => 'required|string|max:255',
         'password' => 'required|string|min:8|max:255',
      ]);

      $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

      if ($this->rateLimitService->checkLoginLimit($request->login, $request->ip())) {
         DatabaseLogger::warning('login_rate_limited', 'Login rate limit exceeded', [
            'login' => $request->login,
            'ip' => $request->ip()
         ], $request);

         $timingProtection->protect();
         return response()->json(['error' => 'Too many login attempts. Please try again later.'], 429);
      }

      DatabaseLogger::info('login_attempt', 'User login attempt', [
         'login' => $request->login,
         'login_type' => $loginType,
         'remember' => $request->has('remember')
      ], $request);

      $user = $this->authService->findUserForLogin($request->login, $loginType);

      if (!$user || !Hash::check($request->password, $user->password)) {
         $this->rateLimitService->hitLoginLimit($request->login, $request->ip());

         DatabaseLogger::warning('login_failed', 'Failed login attempt', [
            'login' => $request->login,
            'login_type' => $loginType
         ], $request);

         $timingProtection->protect();
         return response()->json(['error' => 'Invalid credentials'], 401);
      }

      try {
         $this->rateLimitService->clearLoginLimit($request->login, $request->ip());

         $response = $this->authService->processSuccessfulLogin($user);

         DatabaseLogger::info('login_success', 'User login completed successfully', [], $request, $user->id);

         $timingProtection->protect();
         return response()->json($response);
      } catch (\Exception $e) {
         $timingProtection->protect();
         return $this->handleError('login_token_error', 'Login token generation failed', $e, $request, $user->id);
      }
   }

   public function logout(Request $request)
   {
      $user = Auth::user();
      DatabaseLogger::info('logout_initiated', 'User logout initiated', [], $request, $user->id);

      try {
         $token = $request->user()->currentAccessToken();
         if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $token->delete();
         }
         $user->forceFill(['remember_token' => null])->save();
         Cache::forget("user_profile_{$user->id}");

         DatabaseLogger::info('logout_success', 'User logout successful', [], $request, $user->id);
         return response()->json(['success' => true]);
      } catch (\Exception $e) {
         return $this->handleError('logout_failed', 'User logout failed', $e, $request, $user->id);
      }
   }

   public function changePassword(ChangePasswordRequest $request)
   {
      $user = Auth::user();
      $rateLimitKey = 'change_password:' . $user->id;

      if (RateLimiter::tooManyAttempts($rateLimitKey, 3)) {
         return response()->json(['error' => 'Too many password change attempts. Please try again later.'], 429);
      }

      try {
         $data = $request->validated();

         $recentPasswords = $user->passwordHistory()->latest()->take(5)->get();
         foreach ($recentPasswords as $oldPassword) {
            if (Hash::check($data['new_password'], $oldPassword->password)) {
               return response()->json(['error' => 'Cannot reuse a recent password'], 422);
            }
         }

         DatabaseLogger::info('password_change_attempt', 'Password change attempt', [], $request, $user->id);

         if (!Hash::check($data['current_password'], $user->password)) {
            RateLimiter::hit($rateLimitKey);

            DatabaseLogger::warning('password_change_failed', 'Password change failed - incorrect current password', [], $request, $user->id);

            return response()->json(['error' => 'Current password is incorrect'], 422);
         }

         if (Hash::check($data['new_password'], $user->password)) {
            return response()->json(['error' => 'New password must be different from current password'], 422);
         }

         DB::beginTransaction();

         $user->passwordHistory()->create([
            'password' => $user->password,
            'created_at' => now()
         ]);

         $user->password = Hash::make($data['new_password']);
         $user->save();

         $currentToken = $user->currentAccessToken();
         $user->tokens()->when($currentToken instanceof \Laravel\Sanctum\PersonalAccessToken, fn ($query) => $query->where('id', '!=', $currentToken->id))->delete();

         Cache::forget("user_profile_{$user->id}");

         DB::commit();
         RateLimiter::clear($rateLimitKey);

         $this->sendAccountNotification($user, new PasswordChanged($user));

         DatabaseLogger::info('password_change_success', 'Password changed successfully', [], $request, $user->id);

         return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
         ]);
      } catch (\Exception $e) {
         DB::rollBack();

         DatabaseLogger::error('password_change_error', 'Password change error', [
            'error' => $e->getMessage()
         ], $request, $user->id ?? null);

         return response()->json(['error' => 'Password change failed'], 500);
      }
   }

   public function sendResetLinkEmail(Request $request)
   {
      $data = $request->validate(['email' => 'required|email|max:255']);

      $rateLimitKey = 'reset:' . hash('sha256', $data['email']);

      if (RateLimiter::tooManyAttempts($rateLimitKey, 2)) {
         return response()->json([
            'message' => 'Too many reset attempts. Please try again later.'
         ], 429);
      }

      DatabaseLogger::info('password_reset_requested', 'Password reset link requested', [
         'email' => $data['email']
      ], $request);

      $user = User::where('email', $data['email'])->first();

      $successMessage = 'If the email exists in our system, we will send a password reset link.';

      if (!$user) {
         RateLimiter::hit($rateLimitKey);

         DatabaseLogger::warning('password_reset_nonexistent', 'Password reset requested for non-existent email', [
            'email' => $data['email']
         ], $request);

         return response()->json(['message' => $successMessage], 200);
      }

      DB::table('password_resets')
         ->where('email', $data['email'])
         ->where('created_at', '<', now()->subHours(1))
         ->delete();

      $status = Password::sendResetLink($data);

      RateLimiter::hit($rateLimitKey);

      DatabaseLogger::info('password_reset_status', 'Password reset status', [
         'status' => $status,
         'email' => $data['email']
      ], $request, $user->id);

      return response()->json(['message' => $successMessage], 200);
   }

   public function reset(Request $request)
   {
      $data = $request->validate([
         'token' => 'required|string|max:255',
         'email' => 'required|email|max:255',
         'password' => 'required|string|min:8|max:255|confirmed',
      ]);

      DatabaseLogger::info('password_reset_attempt', 'Password reset attempt', [
         'email' => $data['email']
      ], $request);

      $status = Password::reset(
         $data,
         function ($user, $password) use ($request) {
            DB::beginTransaction();

            try {
               $user->forceFill([
                  'password' => Hash::make($password),
                  'remember_token' => null,
               ])->save();

               $user->tokens()->delete();

               Cache::forget("user_profile_{$user->id}");

               DB::commit();

               DatabaseLogger::info('password_reset_success', 'Password reset successful', [
                  'email' => $user->email
               ], $request, $user->id);

               $this->sendAccountNotification($user, new PasswordReset($user));
            } catch (\Exception $e) {
               DB::rollBack();
               throw $e;
            }
         }
      );

      if ($status === Password::PASSWORD_RESET) {
         DatabaseLogger::info('password_reset_completed', 'Password reset completed', [
            'email' => $data['email']
         ], $request);
         return response()->json(['message' => 'Password reset successfully'], 200);
      } else {
         DatabaseLogger::warning('password_reset_failed', 'Password reset failed', [
            'status' => $status,
            'email' => $data['email']
         ], $request);
         return response()->json(['message' => 'Password reset failed'], 400);
      }
   }

   public function changeEmail(Request $request)
   {
      $data = $request->validate([
         'email' => 'required|email|max:255|unique:users,email',
         // 'password' => 'required|string',
      ]);

      $user = Auth::user();

      // if (!Hash::check($data['password'], $user->password)) {
      //    return response()->json(['error' => 'Password confirmation required'], 422);
      // }

      $oldEmail = $user->email;

      DatabaseLogger::info('email_change_attempt', 'Email change attempt', [
         'old_email' => $oldEmail,
         'new_email' => $data['email']
      ], $request, $user->id);

      try {
         DB::beginTransaction();

         $user->email = $data['email'];
         $user->save();

         Cache::forget('user_email_' . hash('sha256', $oldEmail));
         Cache::forget('user_profile_' . $user->id);

         DB::commit();

         $this->sendAccountNotification($user, new EmailChanged($user));

         DatabaseLogger::info('email_change_success', 'Email changed successfully', [
            'old_email' => $oldEmail,
            'new_email' => $data['email']
         ], $request, $user->id);

         return response()->json(['message' => 'Email address updated successfully.'], 200);
      } catch (\Exception $e) {
         DB::rollBack();

         DatabaseLogger::error('email_change_failed', 'Email change failed', [
            'old_email' => $oldEmail,
            'new_email' => $data['email'],
            'error' => $e->getMessage()
         ], $request, $user->id);

         return response()->json(['error' => 'Email change failed'], 500);
      }
   }

   public function verifyEmailExists(Request $request)
   {
      $data = $request->validate([
         'email' => 'required|email|max:255',
      ]);

      $rateLimitKey = 'verify_email:' . $request->ip();

      if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
         return response()->json(['error' => 'Too many requests'], 429);
      }

      RateLimiter::hit($rateLimitKey);

      DatabaseLogger::info('email_verification_request', 'Email verification request', [
         'email' => $data['email']
      ], $request);

      $cacheKey = 'user_email_' . hash('sha256', $data['email']);

      $userInfo = Cache::remember($cacheKey, 300, function () use ($data) {
         $user = User::where('email', $data['email'])->first(['name']);

         if (!$user) {
            return null;
         }

         return [
            'name' => $user->name,
            'avatarUrl' => $user->avatar_url ?? null,
         ];
      });

      if (!$userInfo) {
         DatabaseLogger::info('email_verification_not_found', 'Email verification - no account found', [
            'email' => $data['email']
         ], $request);

         return response()->json([
            'message' => 'No account found with this email address'
         ], 404);
      }

      DatabaseLogger::info('email_verification_found', 'Email verification - account found', [
         'email' => $data['email'],
         'name' => $userInfo['name']
      ], $request);

      return response()->json([
         'accountInfo' => $userInfo
      ]);
   }

   private function sendAccountNotification(User $user, \Illuminate\Mail\Mailable $mail): void
   {
      // The account change has committed. Mail failure must not report it as failed.
      try {
         Mail::to($user->email)->send($mail);
      } catch (\Throwable $error) {
         DatabaseLogger::error('account_notification_failed', 'Account notification could not be sent', [
            'error' => $error->getMessage(),
         ], request(), $user->id);
      }
   }

   private function handleError(string $logType, string $message, \Exception $e, Request $request, ?int $userId = null, array $context = []): \Illuminate\Http\JsonResponse
   {
      DatabaseLogger::error($logType, $message, array_merge($context, [
         'error' => $e->getMessage()
      ]), $request, $userId);

      return response()->json(['error' => $message], 500);
   }
}

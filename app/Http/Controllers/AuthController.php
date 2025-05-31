<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\EmailChanged;
use Illuminate\Support\Str;
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
use Illuminate\Validation\ValidationException;
use App\Mail\PasswordReset;
use App\Services\DatabaseLogger;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
   public function __construct()
   {

      // Apply rate limiting middleware to sensitive endpoints
      $this->middleware('throttle:6,1')->only(['login', 'sendResetLinkEmail']);
      $this->middleware('throttle:3,1')->only(['changePassword', 'changeEmail']);
      $this->middleware('throttle:10,1')->only(['verifyEmailExists']);

   }

   public function me(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('user_profile_access', 'User accessed profile information', [], $request, $user->id);

      try {
         // Cache user profile for 5 minutes (reduced from 10)
         $cacheKey = "user_profile_{$user->id}";

         $userProfile = Cache::remember($cacheKey, 300, function () use ($user) {
            return $user->fresh()->only(['id', 'name', 'email', 'created_at', 'updated_at']); // Only return safe fields
         });

         DatabaseLogger::info('user_profile_retrieved', 'User profile retrieved successfully', [
            'cached' => Cache::has($cacheKey)
         ], $request, $user->id);

         return response()->json($userProfile);
      } catch (\Exception $e) {
         DatabaseLogger::error('user_profile_error', 'Failed to retrieve user profile', [
            'error' => $e->getMessage()
         ], $request, $user->id);

         return response()->json(['error' => 'Failed to retrieve profile'], 500);
      }
   }

   public function signup(SignupRequest $request)
   {
      $data = $request->validated();

      // Rate limiting for signup attempts
      $key = 'signup:' . $request->ip();
      if (RateLimiter::tooManyAttempts($key, 3)) {
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
         DB::beginTransaction();

         /** @var \App\Models\User $user */
         $user = User::create([
            'name' => strip_tags($data['name']), // Sanitize input
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
         ]);

         // Generate secure token
         $token = $user->createToken('auth_token', ['*'], now()->addDays(30))->plainTextToken;

         DB::commit();
         RateLimiter::clear($key);

         DatabaseLogger::info('signup_success', 'User signup successful', [
            'email' => $user->email,
            'name' => $user->name
         ], $request, $user->id);

         return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'created_at']),
            'token' => $token
         ]);
      } catch (\Exception $e) {
         DB::rollBack();
         RateLimiter::hit($key);

         DatabaseLogger::error('signup_failed', 'User signup failed', [
            'email' => $data['email'],
            'error' => $e->getMessage()
         ], $request);

         return response()->json(['error' => 'Registration failed'], 500);
      }
   }

   public function login(Request $request)
   {
      // Add timing attack protection
      $startTime = microtime(true);

      $request->validate([
         'login' => 'required|string|max:255',
         'password' => 'required|string|min:8|max:255',
         // Add CAPTCHA after failed attempts
         'captcha' => 'sometimes|required|captcha',
      ]);

      $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
      $rateLimitKey = 'login:' . hash('sha256', $request->login . '|' . $request->ip());

      // Rate limiting per user/IP combination
      if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
         DatabaseLogger::warning('login_rate_limited', 'Login rate limit exceeded', [
            'login' => $request->login,
            'ip' => $request->ip()
         ], $request);

         return response()->json(['error' => 'Too many login attempts. Please try again later.'], 429);
      }

      DatabaseLogger::info('login_attempt', 'User login attempt', [
         'login' => $request->login,
         'login_type' => $loginType,
         'remember' => $request->has('remember')
      ], $request);

      // For username login, perform case-sensitive check
      if ($loginType === 'username') {
         $user = User::whereRaw('BINARY username = ?', [$request->login])->first();
         if (!$user) {
            RateLimiter::hit($rateLimitKey);
            DatabaseLogger::warning('login_failed', 'Failed login attempt - username not found', [
               'login' => $request->login
            ], $request);

            // Use consistent error message to prevent user enumeration
            return response()->json(['error' => 'Invalid credentials'], 401);
         }
      }

      $credentials = [
         $loginType => $request->login,
         'password' => $request->password,
      ];

      if (!Auth::attempt($credentials, $request->has('remember'))) {
         RateLimiter::hit($rateLimitKey);

         DatabaseLogger::warning('login_failed', 'Failed login attempt', [
            'login' => $request->login,
            'login_type' => $loginType
         ], $request);

         return response()->json(['error' => 'Invalid credentials'], 401);
      }

      // Clear rate limit on successful login
      RateLimiter::clear($rateLimitKey);

      /** @var \App\Models\User $user */
      $user = Auth::user();

      DatabaseLogger::info('authentication_success', 'User authentication successful', [
         'email' => $user->email
      ], $request, $user->id);

      try {
         DB::beginTransaction();

         // Generate secure remember token
         $rememberToken = hash('sha256', Str::random(60) . time() . $user->id);

         // Ensure uniqueness
         while (User::where('remember_token', $rememberToken)->exists()) {
            $rememberToken = hash('sha256', Str::random(60) . time() . $user->id);
         }

         $user->remember_token = $rememberToken;
         $user->save();

         // Revoke old tokens for security (optional - uncomment if needed)
         // $user->tokens()->delete();

         // Generate API token with expiration
         $tokenName = 'auth_' . Str::uuid();
         $token = $user->createToken($tokenName, ['*'], now()->addDays(30))->plainTextToken;

         DB::commit();

         DatabaseLogger::info('login_success', 'User login completed successfully', [
            'token_name' => $tokenName
         ], $request, $user->id);

         return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'created_at']),
            'token' => $token,
         ]);
      } catch (\Exception $e) {
         DB::rollBack();

         DatabaseLogger::error('login_token_error', 'Login token generation failed', [
            'error' => $e->getMessage()
         ], $request, $user->id);

         Auth::logout();
         return response()->json(['error' => 'Login failed'], 500);
      }

      // Prevent timing attacks
      $executionTime = microtime(true) - $startTime;
      if ($executionTime < 0.5) {
         usleep((0.5 - $executionTime) * 1000000);
      }
   }

   public function logout(Request $request)
   {
      /** @var User $user */
      $user = Auth::user();

      DatabaseLogger::info('logout_initiated', 'User logout initiated', [], $request, $user->id);

      try {
         // Revoke current token
         $request->user()->currentAccessToken()->delete();

         // Clear remember token
         $user->forceFill(['remember_token' => null])->save();

         // Clear user profile cache
         Cache::forget("user_profile_{$user->id}");

         DatabaseLogger::info('logout_success', 'User logout successful', [], $request, $user->id);

         return response()->json(['success' => true]);
      } catch (\Exception $e) {
         DatabaseLogger::error('logout_failed', 'User logout failed', [
            'error' => $e->getMessage()
         ], $request, $user->id);

         return response()->json(['error' => 'Logout failed'], 500);
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

         // Add password history check (prevent reusing last 5 passwords)
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

         // Check if new password is different from current
         if (Hash::check($data['new_password'], $user->password)) {
            return response()->json(['error' => 'New password must be different from current password'], 422);
         }

         DB::beginTransaction();

         // Store old password in history
         $user->passwordHistory()->create([
            'password' => $user->password,
            'created_at' => now()
         ]);

         // Update password
         $user->password = Hash::make($data['new_password']);
         $user->save();

         // Revoke all existing tokens except current one
         $currentToken = $user->currentAccessToken();
         $user->tokens()->where('id', '!=', $currentToken->id)->delete();

         // Clear cache
         Cache::forget("user_profile_{$user->id}");

         DB::commit();
         RateLimiter::clear($rateLimitKey);

         // Send confirmation email
         Mail::to($user->email)->send(new PasswordChanged($user));

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

      // Always return success to prevent email enumeration
      $successMessage = 'If the email exists in our system, we will send a password reset link.';

      if (!$user) {
         RateLimiter::hit($rateLimitKey);

         DatabaseLogger::warning('password_reset_nonexistent', 'Password reset requested for non-existent email', [
            'email' => $data['email']
         ], $request);

         return response()->json(['message' => $successMessage], 200);
      }

      // Clean old reset attempts
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
         'password' => 'required|min:8|max:255|confirmed',
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
                  'remember_token' => null, // Clear remember token
               ])->save();

               // Revoke all tokens
               $user->tokens()->delete();

               // Clear cache
               Cache::forget("user_profile_{$user->id}");

               DB::commit();

               DatabaseLogger::info('password_reset_success', 'Password reset successful', [
                  'email' => $user->email
               ], $request, $user->id);

               Mail::to($user->email)->send(new PasswordReset($user));
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
         'password' => 'required|string', // Require password confirmation
      ]);

      $user = Auth::user();

      // Verify password before allowing email change
      if (!Hash::check($data['password'], $user->password)) {
         return response()->json(['error' => 'Password confirmation required'], 422);
      }

      $oldEmail = $user->email;

      DatabaseLogger::info('email_change_attempt', 'Email change attempt', [
         'old_email' => $oldEmail,
         'new_email' => $data['email']
      ], $request, $user->id);

      try {
         DB::beginTransaction();

         $user->email = $data['email'];
         $user->save();

         // Clear caches
         Cache::forget('user_email_' . md5($oldEmail));
         Cache::forget('user_profile_' . $user->id);

         DB::commit();

         // Send email notification
         Mail::to($user->email)->send(new EmailChanged($user));

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
}

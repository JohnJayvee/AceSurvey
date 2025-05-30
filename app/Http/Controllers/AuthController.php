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
use App\Http\Requests\ChangePasswordRequest;
use Illuminate\Validation\ValidationException;
use App\Mail\PasswordReset;
use App\Services\DatabaseLogger; // Add this import

class AuthController extends Controller
{
   // ...existing methods...

   public function me(Request $request)
   {
      $user = $request->user();

      DatabaseLogger::info('user_profile_access', 'User accessed profile information', [], $request, $user->id);

      try {
         // Cache user profile for 10 minutes
         $cacheKey = "user_profile_{$user->id}";

         $userProfile = Cache::remember($cacheKey, 600, function () use ($user) {
            return $user->fresh(); // Get fresh user data from database
         });

         DatabaseLogger::info('user_profile_retrieved', 'User profile retrieved successfully', [
            'cached' => Cache::has($cacheKey)
         ], $request, $user->id);

         return response()->json($userProfile);
      } catch (\Exception $e) {
         DatabaseLogger::error('user_profile_error', 'Failed to retrieve user profile', [
            'error' => $e->getMessage()
         ], $request, $user->id);
         throw $e;
      }
   }

   // ...rest of existing methods...

   public function signup(SignupRequest $request)
   {
      $data = $request->validated();

      DatabaseLogger::info('signup_attempt', 'User signup attempt', [
         'email' => $data['email'],
         'name' => $data['name']
      ], $request);

      try {
         /** @var \App\Models\User $user */
         $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
         ]);
         $token = $user->createToken('main')->plainTextToken;

         DatabaseLogger::info('signup_success', 'User signup successful', [
            'email' => $user->email,
            'name' => $user->name
         ], $request, $user->id);

         return response([
            'user' => $user,
            'token' => $token
         ]);
      } catch (\Exception $e) {
         DatabaseLogger::error('signup_failed', 'User signup failed', [
            'email' => $data['email'],
            'error' => $e->getMessage()
         ], $request);
         throw $e;
      }
   }

   public function login(Request $request)
   {
      // Validate the input data (login and password)
      $request->validate([
         'login' => 'required|string',
         'password' => 'required|string',
      ]);

      // Determine if the login is by email or username
      $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

      DatabaseLogger::info('login_attempt', 'User login attempt', [
         'login' => $request->login,
         'login_type' => $loginType,
         'remember' => $request->has('remember')
      ], $request);

      // For username login, perform case-sensitive check first
      if ($loginType === 'username') {
         $user = User::whereRaw('BINARY username = ?', [$request->login])->first();

         if (!$user) {
            DatabaseLogger::warning('login_failed', 'Failed login attempt - username not found (case-sensitive)', [
               'login' => $request->login,
               'login_type' => $loginType
            ], $request);

            throw ValidationException::withMessages([
               'login' => ['The provided credentials are incorrect.'],
            ]);
         }
      }

      // Prepare the credentials for authentication
      $credentials = [
         $loginType => $request->login,
         'password' => $request->password,
      ];

      // Attempt to log in with the credentials and remember flag
      if (!Auth::attempt($credentials, $request->has('remember'))) {
         DatabaseLogger::warning('login_failed', 'Failed login attempt', [
            'login' => $request->login,
            'login_type' => $loginType
         ], $request);

         throw ValidationException::withMessages([
            'login' => ['The provided credentials are incorrect.'],
         ]);
      }

      // Get the authenticated user
      /** @var \App\Models\User $user */
      $user = Auth::user();

      DatabaseLogger::info('authentication_success', 'User authentication successful', [
         'email' => $user->email
      ], $request, $user->id);

      // Use a transaction to ensure atomicity during token generation and check for uniqueness
      DB::beginTransaction();

      try {
         // Retry the token generation if there's a collision
         do {
            // Generate a random remember_token
            $rememberToken = Str::random(60);

            // Check if the generated token already exists
            $existingToken = User::where('remember_token', $rememberToken)->exists();

         } while ($existingToken); // Repeat if the token is not unique

         // Set the generated unique remember_token for the user
         $user->remember_token = $rememberToken;
         $user->save();

         // Commit the transaction
         DB::commit();

         DatabaseLogger::info('remember_token_generated', 'Remember token generated successfully', [], $request, $user->id);
      } catch (\Exception $e) {
         // Rollback the transaction if anything goes wrong
         DB::rollBack();

         DatabaseLogger::error('remember_token_failed', 'Remember token generation failed', [
            'error' => $e->getMessage()
         ], $request, $user->id);

         // Throw an error if token generation fails
         throw new \Exception("Could not generate a unique remember token.");
      }

      // Ensure the remember_token is valid (it should not be empty or invalid)
      if (empty($user->remember_token) || $user->remember_token != $rememberToken) {
         DatabaseLogger::error('invalid_remember_token', 'Invalid remember token detected', [
            'token_empty' => empty($user->remember_token),
            'token_mismatch' => $user->remember_token != $rememberToken
         ], $request, $user->id);

         // Log out the user if the remember_token is empty or invalid
         Auth::logout();

         // Throw an error saying a valid remember token is needed to log in
         throw ValidationException::withMessages([
            'login' => ['You must have a valid remember token to log in.'],
         ]);
      }

      // Generate an API token for the user (if using Sanctum)
      do {
         $randomName = Str::uuid(); // or Str::random(40)
         $exists = $user->tokens()->where('name', $randomName)->exists();
      } while ($exists);

      $token = $user->createToken($randomName)->plainTextToken;

      DatabaseLogger::info('login_success', 'User login completed successfully', [
         'token_name' => $randomName
      ], $request, $user->id);

      // Return the user and token information
      return response()->json([
         'user' => $user,
         'token' => $token,
      ]);
   }

   public function logout(Request $request)
   {
      /** @var User $user */
      $user = Auth::user();

      DatabaseLogger::info('logout_initiated', 'User logout initiated', [], $request, $user->id);

      try {
         // Revoke the current token
         $user->currentAccessToken()->delete();

         // Clear the remember_token
         $user->forceFill(['remember_token' => null])->save();

         // Clear user profile cache
         Cache::forget("user_profile_{$user->id}");

         DatabaseLogger::info('logout_success', 'User logout successful', [], $request, $user->id);

         return response([
            'success' => true
         ]);
      } catch (\Exception $e) {
         DatabaseLogger::error('logout_failed', 'User logout failed', [
            'error' => $e->getMessage()
         ], $request, $user->id);
         throw $e;
      }
   }

   public function changePassword(ChangePasswordRequest $request)
   {
      try {
         $user = Auth::user();
         $data = $request->validated();

         DatabaseLogger::info('password_change_attempt', 'Password change attempt', [], $request, $user->id);

         // Check if the current password is correct
         if (!Hash::check($data['current_password'], $user->password)) {
            DatabaseLogger::warning('password_change_failed', 'Password change failed - incorrect current password', [], $request, $user->id);

            return response([
               'error' => 'Current password is incorrect'
            ], 422);
         }

         // Update the password
         $user->password = Hash::make($data['new_password']);
         $user->save();

         // Clear user profile cache since password changed
         Cache::forget("user_profile_{$user->id}");

         // Send confirmation email
         Mail::to($user->email)->send(new PasswordChanged($user));

         DatabaseLogger::info('password_change_success', 'Password changed successfully', [], $request, $user->id);

         return response([
            'success' => true,
            'message' => 'Password changed successfully'
         ]);
      } catch (\Exception $e) {
         DatabaseLogger::error('password_change_error', 'Password change error', [
            'error' => $e->getMessage()
         ], $request, $user->id ?? null);

         return response([
            'error' => 'An error occurred while changing the password.',
            'details' => $e->getMessage()
         ], 500);
      }
   }

   public function sendResetLinkEmail(Request $request)
   {
      $data = $request->validate(['email' => 'required|email']);

      DatabaseLogger::info('password_reset_requested', 'Password reset link requested', [
         'email' => $data['email']
      ], $request);

      // First check if the email exists (prevents throttling for non-existent emails)
      $user = User::where('email', $data['email'])->first();
      if (!$user) {
         DatabaseLogger::warning('password_reset_nonexistent', 'Password reset requested for non-existent email', [
            'email' => $data['email']
         ], $request);

         return response()->json([
            'message' => 'If the email exists in our system, we will send a password reset link.'
         ], 200);
      }

      // Clear any previous reset attempts for this user to prevent throttling
      DB::table('password_resets')
         ->where('email', $data['email'])
         ->delete();

      // Send the reset link
      $status = Password::sendResetLink($data);

      DatabaseLogger::info('password_reset_status', 'Password reset status', [
         'status' => $status,
         'email' => $data['email']
      ], $request, $user->id);

      // Return appropriate response based on status
      if ($status === Password::RESET_LINK_SENT) {
         DatabaseLogger::info('password_reset_sent', 'Password reset link sent successfully', [
            'email' => $data['email']
         ], $request, $user->id);
         return response()->json(['message' => 'Password reset link has been sent to your email.'], 200);
      } elseif ($status === Password::RESET_THROTTLED) {
         DatabaseLogger::warning('password_reset_throttled', 'Password reset throttled', [
            'email' => $data['email']
         ], $request, $user->id);
         return response()->json([
            'message' => 'Password reset link has been sent to your email.'
         ], 200);
      } else {
         DatabaseLogger::error('password_reset_failed', 'Password reset link failed to send', [
            'status' => $status,
            'email' => $data['email']
         ], $request, $user->id);
         return response()->json([
            'message' => 'Unable to send password reset link. Please try again later.'
         ], 400);
      }
   }

   public function reset(Request $request)
   {
      $data = $request->validate([
         'token' => 'required',
         'email' => 'required|email',
         'password' => 'required|min:8|confirmed',
      ]);

      DatabaseLogger::info('password_reset_attempt', 'Password reset attempt', [
         'email' => $data['email']
      ], $request);

      $status = Password::reset(
         $data,
         function ($user, $password) use ($request) {
            $user->forceFill([
               'password' => Hash::make($password),
            ])->save();

            // Clear user profile cache since password changed
            Cache::forget("user_profile_{$user->id}");

            DatabaseLogger::info('password_reset_success', 'Password reset successful', [
               'email' => $user->email
            ], $request, $user->id);

            // ✅ Send the email
            Mail::to($user->email)->send(new PasswordReset($user));
         }
      );

      if ($status === Password::PASSWORD_RESET) {
         DatabaseLogger::info('password_reset_completed', 'Password reset completed', [
            'email' => $data['email']
         ], $request);
         return response()->json(['message' => __($status)], 200);
      } else {
         DatabaseLogger::warning('password_reset_failed', 'Password reset failed', [
            'status' => $status,
            'email' => $data['email']
         ], $request);
         return response()->json(['message' => __($status)], 400);
      }
   }

   public function changeEmail(Request $request)
   {
      $data = $request->validate([
         'email' => 'required|email|unique:users,email',
      ]);

      $user = Auth::user();
      $oldEmail = $user->email;

      DatabaseLogger::info('email_change_attempt', 'Email change attempt', [
         'old_email' => $oldEmail,
         'new_email' => $data['email']
      ], $request, $user->id);

      try {
         $user->email = $data['email'];
         $user->save();

         // Clear cache for old and new email
         Cache::forget('user_email_' . md5($oldEmail));
         Cache::forget('user_profile_' . $user->id);

         // Send email notification
         Mail::to($user->email)->send(new EmailChanged($user));

         DatabaseLogger::info('email_change_success', 'Email changed successfully', [
            'old_email' => $oldEmail,
            'new_email' => $data['email']
         ], $request, $user->id);

         return response()->json(['message' => 'Email address updated successfully.'], 200);
      } catch (\Exception $e) {
         DatabaseLogger::error('email_change_failed', 'Email change failed', [
            'old_email' => $oldEmail,
            'new_email' => $data['email'],
            'error' => $e->getMessage()
         ], $request, $user->id);
         throw $e;
      }
   }

   public function verifyEmailExists(Request $request)
   {
      // Validate the input
      $data = $request->validate([
         'email' => 'required|email',
      ]);

      DatabaseLogger::info('email_verification_request', 'Email verification request', [
         'email' => $data['email']
      ], $request);

      // Create a cache key for this email lookup
      $cacheKey = 'user_email_' . md5($data['email']);

      // Try to get user data from cache first
      $userInfo = Cache::remember($cacheKey, 300, function () use ($data) { // Cache for 5 minutes
         $user = User::where('email', $data['email'])->first(['name']);

         if (!$user) {
            return null;
         }

         return [
            'name' => $user->name,
            'avatarUrl' => $user->avatar_url ?? null,
         ];
      });

      // If no user is found with this email
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

      // Return cached account information
      return response()->json([
         'accountInfo' => $userInfo
      ]);
   }
}

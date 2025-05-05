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
use App\Http\Requests\ChangePasswordRequest;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function signup(SignupRequest $request)
    {
        $data = $request->validated();

        /** @var \App\Models\User $user */
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
        ]);
        $token = $user->createToken('main')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token
        ]);
    }
    // NOTE: Original Code
    // public function login(Request $request)
    // {
    //     $request->validate([
    //         'login' => 'required|string',
    //         'password' => 'required|string',
    //     ]);

    //     $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

    //     if (!Auth::attempt([$loginType => $request->login, 'password' => $request->password])) {
    //         throw ValidationException::withMessages([
    //             'login' => ['The provided credentials are incorrect.'],
    //         ]);
    //     }

    //     $user = Auth::user();

    //     // Optional: generate token if using Sanctum
    //     $token = $user->createToken('api-token')->plainTextToken;

    //     return response()->json([
    //         'user' => $user,
    //         'token' => $token,
    //     ]);
    // }


    // IDEA: Login with remember token
    public function login(Request $request)
    {
        // Validate the input data (login and password)
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        // Determine if the login is by email or username
        $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        // Prepare the credentials for authentication
        $credentials = [
            $loginType => $request->login,
            'password' => $request->password,
        ];

        // Attempt to log in with the credentials and remember flag
        if (!Auth::attempt($credentials, $request->has('remember'))) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Get the authenticated user
        /** @var \App\Models\User $user */
        $user = Auth::user();

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
        } catch (\Exception $e) {
            // Rollback the transaction if anything goes wrong
            DB::rollBack();

            // Throw an error if token generation fails
            throw new \Exception("Could not generate a unique remember token.");
        }

        // Ensure the remember_token is valid (it should not be empty or invalid)
        if (empty($user->remember_token) || $user->remember_token != $rememberToken) {
            // Log out the user if the remember_token is empty or invalid
            Auth::logout();

            // Throw an error saying a valid remember token is needed to log in
            throw ValidationException::withMessages([
                'login' => ['You must have a valid remember token to log in.'],
            ]);
        }

        // Generate an API token for the user (if using Sanctum)
        // $token = $user->createToken('api-token')->plainTextToken;\
        do {
            $randomName = Str::uuid(); // or Str::random(40)
            $exists = $user->tokens()->where('name', $randomName)->exists();
        } while ($exists);

        $token = $user->createToken($randomName)->plainTextToken;


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

        // Revoke the current token
        $user->currentAccessToken()->delete();

        // Clear the remember_token
        $user->forceFill(['remember_token' => null])->save();

        return response([
            'success' => true
        ]);
    }


    public function me(Request $request)
    {
        return $request->user();
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        try {
            $user = Auth::user();
            $data = $request->validated();

            // Check if the current password is correct
            if (!Hash::check($data['current_password'], $user->password)) {
                return response([
                    'error' => 'Current password is incorrect'
                ], 422);
            }

            // Update the password
            $user->password = Hash::make($data['new_password']);
            $user->save();

            // Send confirmation email
            Mail::to($user->email)->send(new PasswordChanged($user));

            return response([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            return response([
                'error' => 'An error occurred while changing the password.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function sendResetLinkEmail(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($data);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($status)], 200);
        } elseif ($status === Password::RESET_THROTTLED) {
            return response()->json(['message' => 'Please wait before retrying.'], 429);
        } else {
            return response()->json(['message' => __($status)], 400);
        }
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);
        $status = Password::reset(
            $data,
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => __($status)], 200)
            : response()->json(['message' => __($status)], 400);
    }

    public function changeEmail(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|unique:users,email',
        ]);

        $user = Auth::user();
        $user->email = $data['email'];
        $user->save();

        // Send email notification
        Mail::to($user->email)->send(new EmailChanged($user));

        return response()->json(['message' => 'Email address updated successfully.'], 200);
    }
}

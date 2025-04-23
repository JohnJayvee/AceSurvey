<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\SignupRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmailChanged;
use App\Http\Requests\ChangePasswordRequest;
use App\Mail\PasswordChanged;

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

    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $remember = $credentials['remember'] ?? false;
        unset($credentials['remember']);

        if (!Auth::attempt($credentials, $remember)) {
            return response([
                'error' => 'The Provided credentials are not correct'
            ], 422);
        }

        $user = Auth::user();
        $token = $user->createToken('main')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        // Revoke the token that was used to authenticate the current request...
        $user->currentAccessToken()->delete();

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

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Services\DatabaseLogger;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->only('id', 'name', 'username', 'email', 'is_admin'));
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['required', 'string', 'alpha_dash', 'max:191', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'email', 'max:191', Rule::unique('users')->ignore($user->id)],
            'current_password' => 'nullable|string|max:255',
        ]);
        if (($data['email'] !== $user->email || $data['username'] !== $user->username)
            && !Hash::check($data['current_password'] ?? '', $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Enter your current password to change your email or username.']);
        }
        $oldEmail = $user->email;
        if ($oldEmail !== $data['email']) {
            Password::deleteToken($user);
            $user->email_verified_at = null;
        }
        $user->fill(['name' => strip_tags($data['name']), 'username' => $data['username'], 'email' => $data['email']])->save();
        Cache::forget('user_profile_'.$user->id);
        foreach ([$oldEmail, $user->email] as $email) Cache::forget('user_email_'.hash('sha256', $email));
        DatabaseLogger::info('profile_updated', 'User updated their profile', [], $request, $user->id);
        return $this->show($request);
    }
}

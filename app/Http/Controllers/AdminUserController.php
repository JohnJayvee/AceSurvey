<?php

namespace App\Http\Controllers;

use App\Http\Requests\SignupRequest;
use App\Models\User;
use App\Services\AuthService;
use App\Services\DatabaseLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->is_admin, 403);
        $request->validate(['page' => 'nullable|integer|min:1']);

        return response()->json(User::select('id', 'name', 'username', 'email', 'is_admin', 'is_active', 'created_at')
            ->orderByDesc('id')->paginate(25));
    }

    public function store(Request $request, AuthService $authService)
    {
        abort_unless($request->user()?->is_admin, 403);
        $data = $request->validate([
            ...(new SignupRequest)->rules(),
            'username' => 'required|string|alpha_dash|max:191|unique:users,username',
            'role' => 'required|in:admin,user',
        ]);

        $user = DB::transaction(function () use ($data, $authService) {
            $user = $authService->createUser($data);
            $user->is_admin = $data['role'] === 'admin';
            $user->save();
            return $user;
        });

        DatabaseLogger::info('admin_account_created', 'Admin created an account', [
            'created_user_id' => $user->id, 'role' => $data['role'],
        ], $request, $request->user()->id);

        return response()->json(['data' => $user->fresh()->only('id', 'name', 'username', 'email', 'is_admin', 'is_active', 'created_at')], 201);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($request->user()?->is_admin, 403);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['required', 'string', 'alpha_dash', 'max:191', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'email', 'max:191', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|in:admin,user',
            'is_active' => 'required|boolean',
            'password' => ['nullable', 'string', 'max:255', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        if ((int) $request->user()->id === (int) $user->id && (!$data['is_active'] || $data['role'] !== 'admin')) {
            throw ValidationException::withMessages(['role' => 'You cannot disable your own account or remove your own admin access.']);
        }

        $passwordChanged = !empty($data['password']);
        DB::transaction(function () use ($data, $user, $passwordChanged) {
            $oldEmail = $user->email;
            $roleChanged = $user->is_admin !== ($data['role'] === 'admin');
            $user->fill(['name' => strip_tags($data['name']), 'username' => $data['username'], 'email' => $data['email']]);
            $user->is_admin = $data['role'] === 'admin';
            $user->is_active = $data['is_active'];
            if ($oldEmail !== $user->email) {
                $user->email_verified_at = null;
            }
            if ($passwordChanged) {
                $user->passwordHistory()->create(['password' => $user->password]);
                $user->password = $data['password'];
            }
            if ($passwordChanged || !$user->is_active || $roleChanged || $oldEmail !== $user->email) {
                $user->tokens()->delete();
                $user->remember_token = Str::random(60);
                DB::table('sessions')->where('user_id', $user->id)->delete();
                $resetIdentity = clone $user;
                $resetIdentity->email = $oldEmail;
                \Illuminate\Support\Facades\Password::deleteToken($resetIdentity);
                \Illuminate\Support\Facades\Password::deleteToken($user);
            }
            $user->save();
        });
        Cache::forget("user_profile_{$user->id}");
        DatabaseLogger::info('admin_account_updated', 'Admin updated an account', [
            'updated_user_id' => $user->id, 'role' => $data['role'],
            'is_active' => $user->is_active, 'password_changed' => $passwordChanged,
        ], $request, $request->user()->id);

        return response()->json(['data' => $user->only('id', 'name', 'username', 'email', 'is_admin', 'is_active', 'created_at')]);
    }
}

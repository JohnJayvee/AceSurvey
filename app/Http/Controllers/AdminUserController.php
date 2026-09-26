<?php

namespace App\Http\Controllers;

use App\Http\Requests\SignupRequest;
use App\Models\User;
use App\Services\AuthService;
use App\Services\DatabaseLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->is_admin, 403);
        $request->validate(['page' => 'nullable|integer|min:1']);

        return response()->json(User::select('id', 'name', 'username', 'email', 'is_admin', 'created_at')
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

        return response()->json(['data' => $user->only('id', 'name', 'username', 'email', 'is_admin', 'created_at')], 201);
    }
}

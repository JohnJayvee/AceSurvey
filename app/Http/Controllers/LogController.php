<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->is_admin, 403);
        $request->validate([
            'level' => 'nullable|in:info,warning,error',
            'action' => 'nullable|string|max:255',
            'user_id' => 'nullable|integer|min:1',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d|after_or_equal:from',
            'page' => 'nullable|integer|min:1',
        ]);
        $query = Log::with('user:id,name,email')->latest()->orderByDesc('id');

        // Filter by level
        if ($request->filled('level')) {
            $query->level($request->level);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->action($request->action);
        }

        // Filter by user
        if ($request->filled('user_id')) {
            $query->forUser($request->user_id);
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $logs = $query->paginate(50);

        return response()->json($logs);
    }

    public function show(Log $log, Request $request)
    {
        abort_unless($request->user()?->is_admin, 403);
        return response()->json($log->load('user:id,name,email'));
    }
}

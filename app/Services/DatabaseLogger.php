<?php

namespace App\Services;

use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DatabaseLogger
{
    public static function info(string $action, string $message, array $context = [], Request $request = null, $userId = null)
    {
        self::log('info', $action, $message, $context, $request, $userId);
    }

    public static function warning(string $action, string $message, array $context = [], Request $request = null, $userId = null)
    {
        self::log('warning', $action, $message, $context, $request, $userId);
    }

    public static function error(string $action, string $message, array $context = [], Request $request = null, $userId = null)
    {
        self::log('error', $action, $message, $context, $request, $userId);
    }

    private static function log(string $level, string $action, string $message, array $context = [], Request $request = null, $userId = null)
    {
        try {
            Log::create([
                'level' => $level,
                'action' => $action,
                'message' => $message,
                'context' => $context,
                'user_id' => $userId ?? Auth::id(),
                'ip_address' => $request ? $request->ip() : request()->ip(),
                'user_agent' => $request ? $request->userAgent() : request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Fallback to Laravel's default logging if database logging fails
            \Log::error('Database logging failed: ' . $e->getMessage());
        }
    }
}

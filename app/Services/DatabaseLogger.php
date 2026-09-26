<?php

namespace App\Services;

use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DatabaseLogger
{
    public static function info(string $action, string $message, array $context = [], Request $request = null, $userId = null)
    {
        // Polling and cached reads should not write audit rows on every request.
        if ($request?->isMethod('GET') && !config('logging.database_reads', false)) {
            return;
        }
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
        } catch (\Throwable $e) {
            // Fallback to Laravel's default logging if database logging fails
            try {
                \Illuminate\Support\Facades\Log::error('Database logging failed: ' . $e->getMessage());
            } catch (\Throwable $loggingError) {
                error_log('AceSurvey audit logging is unavailable: '.$loggingError->getMessage());
            }
        }
    }
}

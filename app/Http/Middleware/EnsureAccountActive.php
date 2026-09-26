<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAccountActive
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && !$request->user()->is_active) {
            return response()->json(['message' => 'This account is disabled. Contact your administrator.'], 401);
        }
        return $next($request);
    }
}

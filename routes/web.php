<?php

use Illuminate\Support\Facades\Route;

// Route::get('/', function () {
//     return view('welcome');
// });
Route::get('/', function () {
    $routes = Route::getRoutes();
    return view('welcome', compact('routes'));
});

// Route::get('/api/reset', function () {
//     $token = request('token'); // Get the token from the query string

//     // Check if the token exists
//     if ($token) {
//         // Redirect to localhost with the token
//         return redirect()->away('http://localhost:3000/reset-password/' . $token);
//     }

//     // If no token is provided, you can return an error or handle it as needed
//     return response()->json(['error' => 'Token missing'], 400);
// });
Route::get('/api/reset', function () {
    $token = request('token');
    $host = request()->getHost(); // e.g. exam.com, staging.exam.com

    if (!$token) {
        return response()->json(['error' => 'Token missing'], 400);
    }

    // Map backend domains to their corresponding frontend URLs
    $frontendMap = [
        'https://white-emu-581912.hostingersite.com' => 'https://white-raccoon-508494.hostingersite.com',
    ];

    $frontendBase = $frontendMap[$host] ?? 'http://localhost:3000'; // fallback

    return redirect()->away(rtrim($frontendBase, '/') . '/reset-password/' . $token);
});

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
    $host = request()->getHost(); // e.g. white-emu-581912.hostingersite.com
    $port = request()->getPort(); // Get port, e.g. 443

    if (!$token) {
        return response()->json(['error' => 'Token missing'], 400);
    }

    // Combine host and port if necessary
    $fullHost = $host . ($port ? ":$port" : ''); // Append port if it exists

    // Debugging: Output the full host (check the output of this)
    dd($fullHost);  // It should now output 'white-emu-581912.hostingersite.com:443'

    // Map host:port combinations to frontend URLs
    $frontendMap = [
        'white-emu-581912.hostingersite.com:443' => 'https://white-raccoon-508494.hostingersite.com',
        'survey.test:8080' => 'http://localhost:3000',
    ];

    // Get the frontend base URL based on the full host
    $frontendBase = $frontendMap[$fullHost] ?? 'http://localhost:3000';

    return redirect()->away(rtrim($frontendBase, '/') . '/reset-password/' . $token);
});

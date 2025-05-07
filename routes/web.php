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

    if (!$token) {
        return response()->json(['error' => 'Token missing'], 400);
    }

    // Get the current scheme and host (e.g., http://localhost:3000 or http://10.12.4.56:3000)
    $baseUrl = request()->getScheme() . '://' . request()->getHost();

    return redirect()->away($baseUrl . '/reset-password/' . $token);
});

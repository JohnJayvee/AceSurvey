<?php

use Illuminate\Support\Facades\Route;

// Route::get('/', function () {
//     return view('welcome');
// });
Route::get('/', function () {
    $routes = Route::getRoutes();
    return view('welcome', compact('routes'));
});

Route::get('/api/reset', function () {
    $token = request('token'); // Get the token from the query string

    // Check if the token exists
    if ($token) {
        // Redirect to localhost with the token
        return redirect()->away('http://localhost:3000/reset-password/' . $token);
    }

    // If no token is provided, you can return an error or handle it as needed
    return response()->json(['error' => 'Token missing'], 400);
});

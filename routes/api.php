<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SurveyController;
use Illuminate\Support\Facades\Route;

Route::post('/signup', [AuthController::class, 'signup'])->name('signup');
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/survey/get-by-slug/{survey:slug}', [SurveyController::class, 'getBySlug'])->name('survey.getBySlug');
Route::post('/survey/{survey}/answer', [SurveyController::class, 'storeAnswer'])->name('survey.storeAnswer');

Route::post('forgot-password', [AuthController::class, 'sendResetLinkEmail']);
Route::post('reset', [AuthController::class, 'reset'])->name('password.reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/change-email', [AuthController::class, 'changeEmail'])->name('changeEmail'); // New route for changing email
    Route::get('/me', [AuthController::class, 'me'])->name('me');
    Route::apiResource('survey', SurveyController::class);

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/survey/{survey}/responses', [SurveyController::class, 'responses'])->name('survey.responses');
    Route::get('/survey/{survey}/responses/count', [SurveyController::class, 'countResponses'])->name('survey.countResponses');
    Route::get('/survey/{survey}/responses/{responseId}/details', [SurveyController::class, 'getResponseDetails'])->name('survey.getResponseDetails');
});

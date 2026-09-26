<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SurveyController;
use Illuminate\Support\Facades\Route;

Route::post('/signup', [AuthController::class, 'signup'])->name('signup');
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/survey/get-by-slug/{survey:slug}', [SurveyController::class, 'getBySlug'])->name('survey.getBySlug');
Route::post('/survey/{survey}/answer', [SurveyController::class, 'storeAnswer'])->name('survey.storeAnswer');
Route::get('/survey/links', [SurveyController::class, 'getLinks'])->name('survey.getLinks');

Route::post('forgot-password', [AuthController::class, 'sendResetLinkEmail']);
Route::post('reset', [AuthController::class, 'reset'])->name('password.reset');

// Email verification endpoint for password reset flow
Route::post('/verify-email-exists', [AuthController::class, 'verifyEmailExists']);

Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureAccountActive::class])->group(function () {
    Route::get('/admin/users', [\App\Http\Controllers\AdminUserController::class, 'index']);
    Route::post('/admin/users', [\App\Http\Controllers\AdminUserController::class, 'store'])->middleware('throttle:10,1');
    Route::put('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'update'])->middleware('throttle:20,1');
    Route::get('/logs', [\App\Http\Controllers\LogController::class, 'index']);
    Route::get('/logs/{log}', [\App\Http\Controllers\LogController::class, 'show']);
    Route::get('/survey-analytics', [DashboardController::class, 'analytics']);

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/change-email', [AuthController::class, 'changeEmail'])->name('changeEmail'); // New route for changing email
    Route::get('/me', [AuthController::class, 'me'])->name('me');
    Route::apiResource('survey', SurveyController::class);

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/survey/{survey}/responses', [SurveyController::class, 'responses'])->name('survey.responses');
    Route::get('/survey/{survey}/export', \App\Http\Controllers\SurveyExportController::class);
    Route::get('/survey/{survey}/responses/count', [SurveyController::class, 'countResponses'])->name('survey.countResponses');
    Route::get('/survey/{survey}/responses/{responseId}/details', [SurveyController::class, 'getResponseDetails'])->name('survey.getResponseDetails');
    Route::get('/total-ratings', [SurveyController::class, 'totalRatings'])->name('totalRatings');
    Route::get('/total-department-ratings/{surveyAnswerId}', [SurveyController::class, 'totalDepartmentRatings'])->name('totalDepartmentRatings');

    Route::get('/topSurvey', [SurveyController::class, 'topSurvey']);
    Route::get('/botSurvey', [SurveyController::class, 'botSurvey']);
});

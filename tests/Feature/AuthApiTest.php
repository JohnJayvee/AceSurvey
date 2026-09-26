<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Auth\Notifications\ResetPassword;

uses(RefreshDatabase::class);

it('keeps a committed password change successful when notification delivery fails', function () {
    $user = User::forceCreate(['name' => 'Owner', 'username' => 'owner', 'email' => 'owner@example.test', 'password' => 'Password123!']);
    \Laravel\Sanctum\Sanctum::actingAs($user);
    \Illuminate\Support\Facades\Mail::shouldReceive('to')->andThrow(new RuntimeException('SMTP unavailable'));
    $this->postJson('/api/change-password', [
        'current_password' => 'Password123!', 'new_password' => 'Changed123!', 'new_password_confirmation' => 'Changed123!',
    ])->assertOk();
    expect(\Illuminate\Support\Facades\Hash::check('Changed123!', $user->fresh()->password))->toBeTrue();
});

it('signs up and authenticates using a bearer token without a session', function () {
    $signup = $this->postJson('/api/signup', [
        'name' => 'New User', 'email' => 'new@example.test',
        'password' => 'Password123!', 'password_confirmation' => 'Password123!',
    ])->assertSuccessful();
    expect($signup->json('token'))->toBeString();
    $this->assertDatabaseHas('users', ['email' => 'new@example.test']);
    $this->postJson('/api/login', ['login' => 'new@example.test', 'password' => 'Password123!'])
        ->assertOk()->assertJsonStructure(['user', 'token']);
});

it('logs in by username and rejects invalid credentials without server errors', function () {
    User::forceCreate(['name' => 'Owner', 'username' => 'owner', 'email' => 'owner@example.test', 'password' => 'Password123!']);
    $this->postJson('/api/login', ['login' => 'owner', 'password' => 'Password123!'])->assertOk();
    $this->postJson('/api/login', ['login' => 'unknown', 'password' => 'Password123!'])->assertUnauthorized();
});

it('generates a reset link pointing to the React password reset page', function () {
    Notification::fake();
    $user = User::forceCreate(['name' => 'Owner', 'username' => 'owner', 'email' => 'owner@example.test', 'password' => 'Password123!']);
    config(['app.frontend_url' => 'https://survey.example.test']);
    $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
        $url = $notification->toMail($user)->actionUrl;
        expect($url)->toStartWith('https://survey.example.test/reset-password/')->toContain('email=');
        return true;
    });
});

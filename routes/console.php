<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('user:admin {email} {--revoke : Remove admin access}', function () {
    $user = \App\Models\User::where('email', $this->argument('email'))->first();
    if (!$user) {
        $this->error('No account found for that email.');
        return 1;
    }
    $user->is_admin = !$this->option('revoke');
    $user->save();
    \Illuminate\Support\Facades\Cache::forget("user_profile_{$user->id}");
    $this->info($user->is_admin ? 'Admin access granted.' : 'Admin access removed.');
})->purpose('Grant or revoke admin access for an existing account');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

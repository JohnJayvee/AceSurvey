<?php

namespace App\Providers;

use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(UrlGenerator $url)
    {
        if ($this->app->environment('production')) {
            $url->forceScheme('https');
        }

        ResetPassword::createUrlUsing(fn ($user, $token) =>
            rtrim(config('app.frontend_url'), '/').'/reset-password/'.$token.'?'.http_build_query(['email' => $user->email])
        );
    }
}

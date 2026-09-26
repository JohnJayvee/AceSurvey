<?php

it('returns credential-compatible CORS headers for API preflight requests', function () {
    $origin = 'http://localhost:3000';

    $this->withHeaders([
        'Origin' => $origin,
        'Access-Control-Request-Method' => 'GET',
        'Access-Control-Request-Headers' => 'authorization,content-type',
    ])->options('/api/me')
        ->assertSuccessful()
        ->assertHeader('Access-Control-Allow-Origin', $origin)
        ->assertHeader('Access-Control-Allow-Credentials', 'true');
});

<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('updates only the current profile and requires password for login identity changes', function () {
    $user = User::forceCreate(['name' => 'Member', 'username' => 'member', 'email' => 'member@example.test', 'password' => 'Password123!']);
    $other = User::forceCreate(['name' => 'Other', 'username' => 'other', 'email' => 'other@example.test', 'password' => 'Password123!']);
    $this->getJson('/api/profile')->assertUnauthorized();
    $this->putJson('/api/profile', [])->assertUnauthorized();
    Sanctum::actingAs($user);
    $this->getJson('/api/profile')->assertOk()->assertJsonPath('username', 'member')->assertJsonMissingPath('password');
    $payload = ['name' => 'Updated', 'username' => 'member', 'email' => $user->email, 'is_admin' => true, 'id' => $other->id];
    $this->putJson('/api/profile', $payload)->assertOk()->assertJsonPath('name', 'Updated')->assertJsonPath('is_admin', false);
    expect($other->fresh()->name)->toBe('Other');
    $this->putJson('/api/profile', [...$payload, 'email' => 'new@example.test'])->assertUnprocessable()->assertJsonValidationErrors('current_password');
    $this->putJson('/api/profile', [...$payload, 'username' => 'other', 'current_password' => 'Password123!'])->assertUnprocessable()->assertJsonValidationErrors('username');
    $this->putJson('/api/profile', [...$payload, 'email' => 'new@example.test', 'username' => 'updated', 'current_password' => 'Password123!'])->assertOk()->assertJsonPath('email', 'new@example.test');
    $this->getJson('/api/me')->assertOk()->assertJsonPath('name', 'Updated');
});

<?php

use App\Models\Log;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('allows admins to edit accounts and passwords without exposing passwords', function () {
    $admin = accessUser('editor', true);
    $user = accessUser('target');
    $oldHash = $user->password;
    Sanctum::actingAs($admin);
    $payload = ['name' => 'Updated Name', 'username' => 'updated', 'email' => 'updated@example.test', 'role' => 'user', 'is_active' => true, 'password' => ''];
    $this->putJson('/api/admin/users/'.$user->id, $payload)->assertOk()->assertJsonPath('data.name', 'Updated Name');
    expect($user->fresh()->password)->toBe($oldHash);
    $user->createToken('existing-session');
    $this->putJson('/api/admin/users/'.$user->id, [...$payload, 'role' => 'admin', 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])
        ->assertOk()->assertJsonPath('data.is_admin', true)->assertJsonMissingPath('data.password');
    expect(\Illuminate\Support\Facades\Hash::check('NewPassword123!', $user->fresh()->password))->toBeTrue();
    expect($user->tokens()->count())->toBe(0);
    expect($user->passwordHistory()->count())->toBe(1);
    $log = Log::where('action', 'admin_account_updated')->latest('id')->firstOrFail();
    expect($log->context['password_changed'])->toBeTrue();
    expect(json_encode($log->context))->not->toContain('NewPassword123!');
});

it('blocks disabled accounts from login and authenticated APIs and allows reactivation', function () {
    $admin = accessUser('editor', true);
    $user = accessUser('target');
    $user->createToken('existing-session');
    $payload = ['name' => $user->name, 'username' => $user->username, 'email' => $user->email, 'role' => 'user', 'is_active' => false];
    Sanctum::actingAs($admin);
    $this->putJson('/api/admin/users/'.$user->id, $payload)->assertOk()->assertJsonPath('data.is_active', false);
    expect($user->tokens()->count())->toBe(0);
    $this->postJson('/api/login', ['login' => $user->email, 'password' => 'Password123!'])->assertUnauthorized();
    Sanctum::actingAs($user->fresh());
    $this->getJson('/api/me')->assertUnauthorized();
    $this->getJson('/api/survey')->assertUnauthorized();
    $this->getJson('/api/admin/users')->assertUnauthorized();
    Sanctum::actingAs($admin);
    $this->putJson('/api/admin/users/'.$user->id, [...$payload, 'is_active' => true])->assertOk();
    $this->postJson('/api/login', ['login' => $user->email, 'password' => 'Password123!'])->assertOk();
});

it('rejects unauthorized edits, duplicate details, invalid passwords and self lockout', function () {
    $admin = accessUser('editor', true);
    $user = accessUser('target');
    $payload = ['name' => $user->name, 'username' => $user->username, 'email' => $user->email, 'role' => 'user', 'is_active' => true];
    $this->putJson('/api/admin/users/'.$user->id, $payload)->assertUnauthorized();
    Sanctum::actingAs($user);
    $this->putJson('/api/admin/users/'.$user->id, [...$payload, 'role' => 'admin'])->assertForbidden();
    Sanctum::actingAs($admin);
    $this->putJson('/api/admin/users/'.$user->id, [...$payload, 'email' => $admin->email, 'password' => 'weak', 'password_confirmation' => 'different'])
        ->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    $self = ['name' => $admin->name, 'username' => $admin->username, 'email' => $admin->email, 'role' => 'admin', 'is_active' => true];
    $this->putJson('/api/admin/users/'.$admin->id, [...$self, 'is_active' => false])->assertUnprocessable();
    $this->putJson('/api/admin/users/'.$admin->id, [...$self, 'role' => 'user'])->assertUnprocessable();
    $this->putJson('/api/admin/users/'.$admin->id, $self)->assertOk();
});

it('restricts account listing and creation to admins', function () {
    $this->getJson('/api/admin/users')->assertUnauthorized();
    $this->postJson('/api/admin/users', [])->assertUnauthorized();
    Sanctum::actingAs(accessUser('member'));
    $this->getJson('/api/admin/users')->assertForbidden();
    $this->postJson('/api/admin/users', ['role' => 'admin'])->assertForbidden();
    $this->assertDatabaseCount('users', 1);
});

it('lets admins create both account roles without disclosing credentials or changing sessions', function () {
    $admin = accessUser('admin', true);
    Sanctum::actingAs($admin);
    foreach (['user', 'admin'] as $role) {
        $email = "created-$role@example.test";
        $response = $this->postJson('/api/admin/users', [
            'name' => 'New Account', 'username' => 'created_'.$role, 'email' => $email,
            'password' => 'Password123!', 'password_confirmation' => 'Password123!', 'role' => $role,
        ])->assertCreated()->assertJsonPath('data.is_admin', $role === 'admin');
        expect($response->json('data'))->not->toHaveKey('password');
        expect($response->json())->not->toHaveKey('token');
        $created = User::where('email', $email)->firstOrFail();
        expect(\Illuminate\Support\Facades\Hash::check('Password123!', $created->password))->toBeTrue();
        $this->getJson('/api/me')->assertOk()->assertJsonPath('id', $admin->id);
        $log = Log::where('action', 'admin_account_created')->latest('id')->firstOrFail();
        expect($log->user_id)->toBe($admin->id);
        expect($log->context)->toBe(['created_user_id' => $created->id, 'role' => $role]);
    }
    $list = $this->getJson('/api/admin/users')->assertOk()->assertJsonCount(3, 'data');
    foreach ($list->json('data') as $account) {
        expect($account)->not->toHaveKey('password')->not->toHaveKey('remember_token');
    }
});

it('validates account roles, duplicate identities and password confirmation', function () {
    $admin = accessUser('admin', true);
    Sanctum::actingAs($admin);
    $this->postJson('/api/admin/users', [
        'name' => 'Invalid', 'username' => $admin->username, 'email' => $admin->email,
        'password' => 'short', 'password_confirmation' => 'different', 'role' => 'superadmin',
    ])->assertUnprocessable()->assertJsonValidationErrors(['username', 'email', 'password', 'role']);
    $this->assertDatabaseCount('users', 1);
});

function accessUser(string $name, bool $admin = false): User
{
    return User::forceCreate(['name' => $name, 'username' => $name, 'email' => "$name@example.test", 'password' => 'Password123!', 'is_admin' => $admin]);
}

it('restricts logs to admins and validates filters', function () {
    $log = Log::create(['level' => 'warning', 'action' => 'test_event', 'message' => 'Test activity']);
    $this->getJson('/api/logs')->assertUnauthorized();
    Sanctum::actingAs(accessUser('member'));
    $this->getJson('/api/logs')->assertForbidden();
    $this->getJson('/api/logs/'.$log->id)->assertForbidden();
    Sanctum::actingAs(accessUser('admin', true));
    $this->getJson('/api/logs?level=warning')->assertOk()->assertJsonPath('data.0.id', $log->id);
    $this->getJson('/api/logs?level=error')->assertOk()->assertJsonCount(0, 'data');
    $this->getJson('/api/logs/'.$log->id)->assertOk();
    $this->getJson('/api/logs?level=invalid')->assertUnprocessable();
    $this->getJson('/api/me')->assertOk()->assertJsonPath('is_admin', true);
});

it('allows admins to read all surveys but keeps member lists and detail access private', function () {
    $owner = accessUser('owner');
    $other = accessUser('other');
    $admin = accessUser('admin', true);
    $first = Survey::create(['user_id' => $owner->id, 'title' => 'First survey', 'status' => true]);
    $second = Survey::create(['user_id' => $other->id, 'title' => 'Second survey', 'status' => true]);
    $answer = SurveyAnswer::create(['survey_id' => $second->id, 'start_date' => now(), 'end_date' => now()]);
    Sanctum::actingAs($owner);
    $this->getJson('/api/survey')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $first->id);
    foreach (['', '/responses', '/responses/count', '/responses/'.$answer->id.'/details'] as $suffix) {
        $this->getJson('/api/survey/'.$second->id.$suffix)->assertForbidden();
    }
    $this->putJson('/api/survey/'.$second->id, [])->assertForbidden();
    $this->deleteJson('/api/survey/'.$second->id)->assertForbidden();
    Sanctum::actingAs($admin);
    $this->getJson('/api/survey')->assertOk()->assertJsonCount(2, 'data');
    $this->getJson('/api/survey?search=Second')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.answers_count', 1);
    $this->getJson('/api/survey/'.$second->id)->assertOk()->assertJsonPath('data.can_manage', false);
    $this->getJson('/api/survey/'.$second->id.'/responses')->assertOk();
    $this->getJson('/api/survey/'.$second->id.'/responses/count')->assertOk()->assertJsonPath('count', 1);
    $this->getJson('/api/survey/'.$second->id.'/responses/'.$answer->id.'/details')->assertOk();
    $this->getJson('/api/total-department-ratings/'.$second->id)->assertOk();
    $this->putJson('/api/survey/'.$second->id, [])->assertForbidden();
    $this->deleteJson('/api/survey/'.$second->id)->assertForbidden();
});

it('does not allow signup to grant admin privileges', function () {
    $this->postJson('/api/signup', ['name' => 'Member', 'email' => 'new@example.test', 'password' => 'Password123!', 'password_confirmation' => 'Password123!', 'is_admin' => true])->assertSuccessful();
    expect(User::where('email', 'new@example.test')->first()->is_admin)->toBeFalse();
});

it('grants and revokes admin access using the server command', function () {
    $user = accessUser('member');
    $this->artisan('user:admin', ['email' => $user->email])->assertSuccessful();
    expect($user->fresh()->is_admin)->toBeTrue();
    $this->artisan('user:admin', ['email' => $user->email, '--revoke' => true])->assertSuccessful();
    expect($user->fresh()->is_admin)->toBeFalse();
});

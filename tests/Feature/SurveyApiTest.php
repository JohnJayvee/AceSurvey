<?php

use App\Models\Survey;
use App\Models\User;
use App\Services\SurveyCacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('keeps dashboard activity in creation and submission months after later survey edits', function () {
    $owner = surveyOwner();
    $survey = Survey::create([...surveyPayload(), 'user_id' => $owner->id]);
    DB::table('surveys')->where('id', $survey->id)->update([
        'created_at' => '2025-05-10 12:00:00', 'updated_at' => '2026-09-10 12:00:00',
    ]);
    foreach (['2025-12-31 23:59:59', '2026-01-01 00:00:00'] as $date) {
        DB::table('survey_answers')->insert(['survey_id' => $survey->id, 'start_date' => $date, 'end_date' => $date]);
    }
    $other = Survey::create([...surveyPayload(), 'user_id' => surveyOwner('other')->id]);
    DB::table('survey_answers')->insert(['survey_id' => $other->id, 'start_date' => '2024-01-01 00:00:00', 'end_date' => '2024-01-01 00:00:00']);
    Sanctum::actingAs($owner);
    $this->getJson('/api/survey-analytics')->assertOk()->assertJsonPath('analytics.monthlyActivity', [
        ['month' => '2025-05', 'surveys' => 1, 'responses' => 0],
        ['month' => '2025-12', 'surveys' => 0, 'responses' => 1],
        ['month' => '2026-01', 'surveys' => 0, 'responses' => 1],
    ]);
});

it('rejects invalid images without writing a survey', function () {
    Sanctum::actingAs(surveyOwner());
    $payload = surveyPayload();
    $payload['image'] = 'data:image/png;base64,'.base64_encode('not an image');
    $this->postJson('/api/survey', $payload)->assertUnprocessable()->assertJsonValidationErrors('image');
    $this->assertDatabaseCount('surveys', 0);
});

it('treats nullable expiry as no expiry and remains open through the expiry day', function () {
    $owner = surveyOwner();
    $survey = Survey::create([...surveyPayload(), 'user_id' => $owner->id, 'expire_date' => null]);
    $this->getJson('/api/survey/get-by-slug/'.$survey->slug)->assertOk()->assertJsonPath('data.expire_date', null);
    $survey->update(['expire_date' => today()->toDateString()]);
    $this->getJson('/api/survey/get-by-slug/'.$survey->slug)->assertOk();
    $survey->update(['expire_date' => today()->subDay()->toDateString()]);
    $this->getJson('/api/survey/get-by-slug/'.$survey->slug)->assertNotFound();
});

function surveyOwner(string $suffix = ''): User
{
    return User::forceCreate([
        'name' => 'Survey Owner', 'username' => 'owner'.$suffix,
        'email' => 'owner'.$suffix.'@example.test', 'password' => 'Password123!',
    ]);
}

function surveyPayload(): array
{
    return [
        'title' => 'Service survey', 'description' => null, 'status' => true,
        'expire_date' => now()->addDays(5)->toDateString(), 'image' => null,
        'questions' => [['type' => 'short answer', 'question' => 'Your feedback', 'description' => null, 'data' => []]],
    ];
}

it('creates and updates surveys with unchanged images and new question UUIDs', function () {
    Sanctum::actingAs(surveyOwner());
    $payload = surveyPayload();
    $payload['questions'][0]['id'] = 'draft-question-uuid';
    $created = $this->postJson('/api/survey', $payload)->assertSuccessful();
    $id = $created->json('data.id');
    $questionId = $created->json('data.questions.0.id');
    $payload['questions'][0]['id'] = $questionId;
    $payload['questions'][0]['question'] = 'Updated feedback';
    $this->putJson('/api/survey/'.$id, $payload)->assertOk()
        ->assertJsonPath('data.questions.0.question', 'Updated feedback');
});

it('rejects malformed questions and answers with validation errors', function () {
    $owner = surveyOwner();
    Sanctum::actingAs($owner);
    $payload = surveyPayload();
    $payload['questions'][0]['type'] = 'invalid';
    $this->postJson('/api/survey', $payload)->assertUnprocessable();
    $created = $this->postJson('/api/survey', surveyPayload())->assertSuccessful();
    $id = $created->json('data.id');
    $questionId = $created->json('data.questions.0.id');
    $this->postJson('/api/survey/'.$id.'/answer', ['answers' => [999999 => 'Invalid question']])->assertUnprocessable();
    $this->postJson('/api/survey/'.$id.'/answer', ['answers' => [$questionId => [['nested']]]])->assertUnprocessable();
    $this->assertDatabaseCount('survey_answers', 0);
});

it('refreshes response and dashboard caches immediately after submissions', function () {
    Sanctum::actingAs(surveyOwner());
    $created = $this->postJson('/api/survey', surveyPayload())->assertSuccessful();
    $id = $created->json('data.id');
    $questionId = $created->json('data.questions.0.id');
    $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('totalAnswers', 0);
    $this->getJson('/api/survey/'.$id.'/responses/count')->assertOk()->assertJsonPath('count', 0);
    $this->getJson('/api/survey/'.$id.'/responses')->assertOk()->assertJsonCount(0, 'data');
    $this->postJson('/api/survey/'.$id.'/answer', ['answers' => [$questionId => 'Great service']])->assertCreated();
    $this->getJson('/api/survey/'.$id.'/responses/count')->assertOk()->assertJsonPath('count', 1);
    $this->getJson('/api/survey/'.$id.'/responses')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('totalAnswers', 1);
});

it('isolates survey access between owners', function () {
    $owner = surveyOwner();
    $survey = Survey::create([...surveyPayload(), 'user_id' => $owner->id]);
    Sanctum::actingAs(surveyOwner('other'));
    foreach (['', '/responses', '/responses/count'] as $suffix) {
        $this->getJson('/api/survey/'.$survey->id.$suffix)->assertForbidden();
    }
    $this->getJson('/api/total-department-ratings/'.$survey->id)->assertForbidden();
    $this->deleteJson('/api/survey/'.$survey->id)->assertForbidden();
});

it('invalidates every search and pagination variant without scanning cache keys', function () {
    $cache = app(SurveyCacheService::class);
    $key = $cache->createSurveyListCacheKey(1, 'feedback', 25, 7);
    Cache::put($key, 'old results', 300);
    $cache->clearUserSurveyCache(1);
    $newKey = $cache->createSurveyListCacheKey(1, 'feedback', 25, 7);
    expect(Cache::get($newKey))->toBeNull();
});

it('lists surveys without one question query per survey', function () {
    $owner = surveyOwner();
    Sanctum::actingAs($owner);
    foreach (range(1, 12) as $number) {
        Survey::create([...surveyPayload(), 'title' => 'Survey '.$number, 'user_id' => $owner->id]);
    }
    DB::enableQueryLog();
    $this->getJson('/api/survey')->assertOk()->assertJsonCount(12, 'data');
    $queries = collect(DB::getQueryLog())->filter(fn ($query) => str_contains($query['query'], 'survey_questions'));
    expect($queries->count())->toBeLessThanOrEqual(1);
    DB::disableQueryLog();
});

it('loads all dashboard endpoints on the supported test database', function () {
    $owner = surveyOwner();
    Sanctum::actingAs($owner);
    $created = $this->postJson('/api/survey', surveyPayload())->assertSuccessful();
    $this->postJson('/api/survey/'.$created->json('data.id').'/answer', [
        'answers' => [$created->json('data.questions.0.id') => '5 - Very satisfied'],
    ])->assertCreated();
    foreach (['dashboard', 'survey-analytics', 'total-ratings', 'topSurvey', 'botSurvey'] as $endpoint) {
        $this->getJson('/api/'.$endpoint)->assertOk();
    }
});

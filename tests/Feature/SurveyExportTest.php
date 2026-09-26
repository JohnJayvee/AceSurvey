<?php

use App\Models\Survey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('exports all responses with escaped Unicode answers and enforces ownership', function () {
    $owner = User::forceCreate(['name' => 'Owner', 'username' => 'owner', 'email' => 'owner@example.test', 'password' => 'Password123!']);
    $survey = Survey::create(['user_id' => $owner->id, 'title' => 'Export', 'status' => true]);
    $question = $survey->questions()->create(['question' => 'Feedback', 'type' => 'short answer', 'data' => '{}']);
    $question2 = $survey->questions()->create(['question' => 'Feedback', 'type' => 'checkboxes', 'data' => '{}']);
    $rows = [];
    for ($i = 0; $i < 1001; $i++) {
        $rows[] = ['survey_id' => $survey->id, 'start_date' => now(), 'end_date' => now()];
    }
    \App\Models\SurveyAnswer::insert($rows);
    $first = $survey->answers()->first();
    $first->answers()->create(['survey_question_id' => $question->id, 'answer' => "José, \"hello\"\nNext line"]);
    $first->answers()->create(['survey_question_id' => $question2->id, 'answer' => '["=1+1","B"]']);
    $url = '/api/survey/'.$survey->id.'/export';
    $this->getJson($url)->assertUnauthorized();
    Sanctum::actingAs($owner);
    $response = $this->get($url)->assertOk()->assertDownload('survey-'.$survey->id.'-responses.csv');
    $csv = $response->streamedContent();
    expect(substr($csv, 0, 3))->toBe("\xEF\xBB\xBF");
    $stream = fopen('php://temp', 'r+');
    fwrite($stream, substr($csv, 3));
    rewind($stream);
    $parsed = [];
    while (($row = fgetcsv($stream, 0, ',', '"', '')) !== false) $parsed[] = $row;
    fclose($stream);
    expect($parsed)->toHaveCount(1002);
    expect($parsed[1][1])->toBe("José, \"hello\"\nNext line");
    expect($parsed[1][2])->toBe("'=1+1, B");
    $other = User::forceCreate(['name' => 'Other', 'username' => 'other', 'email' => 'other@example.test', 'password' => 'Password123!']);
    Sanctum::actingAs($other);
    $this->getJson($url)->assertForbidden();
    $other->is_admin = true;
    $other->save();
    Sanctum::actingAs($other);
    $this->get($url)->assertOk();
    $other->is_active = false;
    $other->save();
    Sanctum::actingAs($other);
    $this->getJson($url)->assertUnauthorized();
});

<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use Illuminate\Http\Request;

class SurveyExportController extends Controller
{
    public function __invoke(Request $request, Survey $survey)
    {
        abort_unless($request->user()->is_admin || (int) $request->user()->id === (int) $survey->user_id, 403);
        $questions = $survey->questions()->orderBy('id')->get();
        return response()->streamDownload(function () use ($survey, $questions) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            $write = function (array $row) use ($output) {
                $row = array_map(function ($value) {
                    $text = (string) ($value ?? '');
                    return preg_match('/^[\s]*[=+@-]/u', $text) ? "'".$text : $text;
                }, $row);
                fputcsv($output, $row, ',', '"', '', "\r\n");
            };
            $write(['Response ID', ...$questions->pluck('question')->all(), 'Submitted at']);
            $survey->answers()->with('answers')->chunkById(250, function ($responses) use ($write, $questions) {
                foreach ($responses as $response) {
                    $answers = $response->answers->groupBy('survey_question_id');
                    $row = [$response->id];
                    foreach ($questions as $question) {
                        $row[] = ($answers->get($question->id) ?? collect())->map(function ($answer) {
                            $decoded = json_decode($answer->answer, true);
                            return is_array($decoded) ? implode(', ', $decoded) : $answer->answer;
                        })->implode(', ');
                    }
                    $row[] = $response->end_date;
                    $write($row);
                }
            });
            fclose($output);
        }, 'survey-'.$survey->id.'-responses.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store']);
    }
}

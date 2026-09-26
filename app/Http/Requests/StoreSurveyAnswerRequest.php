<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreSurveyAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['answers' => 'required|array|min:1|max:50'];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $answers = $this->input('answers');
            if (!is_array($answers)) return;
            $questions = $this->route('survey')->questions()->get()->keyBy('id');
            foreach ($answers as $id => $answer) {
                $question = $questions->get($id);
                if (!$question) {
                    $validator->errors()->add("answers.$id", 'This question does not belong to the survey.');
                    continue;
                }
                $values = is_array($answer) ? $answer : [$answer];
                if (($question->type === 'checkboxes') !== is_array($answer) || count($values) > 100) {
                    $validator->errors()->add("answers.$id", 'Invalid answer format.');
                    continue;
                }
                $options = collect(json_decode($question->data ?? '{}', true)['options'] ?? [])->pluck('text')->all();
                foreach ($values as $value) {
                    if (!is_string($value) || mb_strlen($value) > 10000) {
                        $validator->errors()->add("answers.$id", 'Answers must be text of at most 10000 characters.');
                    } elseif (in_array($question->type, ['checkboxes', 'multiple choice', 'dropdown'], true) &&
                        !in_array($value, $options, true)) {
                        $validator->errors()->add("answers.$id", 'Choose one of the available options.');
                    }
                }
            }
        });
    }
}

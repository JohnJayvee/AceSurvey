<?php

namespace App\Http\Requests;

use App\Enums\QuestionTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SurveyStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:1000',
            'image' => 'nullable|string|max:7000000',
            'status' => 'required|boolean',
            'description' => 'nullable|string|max:60000',
            'expire_date' => 'nullable|date_format:Y-m-d|after:today',
            'questions' => 'required|array|max:50',
            'questions.*.id' => 'nullable',
            'questions.*.question' => 'required|string|max:1000',
            'questions.*.type' => ['required', Rule::enum(QuestionTypeEnum::class)],
            'questions.*.description' => 'nullable|string|max:2000',
            'questions.*.data' => 'present|array',
            'questions.*.data.options' => 'sometimes|array|max:100',
            'questions.*.data.options.*.uuid' => 'required|string|max:100',
            'questions.*.data.options.*.text' => 'required|string|max:1000',
        ];
    }
}

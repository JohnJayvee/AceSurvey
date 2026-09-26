<?php

namespace App\Http\Requests;

class SurveyUpdateRequest extends SurveyStoreRequest
{
    public function authorize(): bool
    {
        return $this->user() && (int) $this->user()->id === (int) $this->route('survey')->user_id;
    }

    public function rules(): array
    {
        return [...parent::rules(),
            // An expired survey can still be edited or disabled.
            'expire_date' => 'nullable|date_format:Y-m-d',
            'questions' => 'sometimes|array|max:50',
        ];
    }
}

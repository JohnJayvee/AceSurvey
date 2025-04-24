<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('survey_question_answers', function (Blueprint $table) {
            $table->id();
            // $table->foreignIdFor(\App\Models\SurveyQuestion::class, 'survey_question_id');
            // $table->foreignIdFor(\App\Models\SurveyAnswer::class, 'survey_answer_id');
            $table->foreignId('survey_question_id')->references('id')->on('survey_questions')->onDelete('cascade');
            $table->foreignId('survey_answer_id')->references('id')->on('survey_answers')->onDelete('cascade');
            $table->text('answer');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_question_answers');
    }
};

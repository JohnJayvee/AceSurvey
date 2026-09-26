import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSurveyCSV, csvCell } from '../src/utils/csvUtils.js';

test('CSV escapes commas, quotes, and spreadsheet formulas', () => {
   assert.equal(csvCell('Hello, "world"'), '"Hello, ""world"""');
   assert.equal(csvCell('=1+1'), '"\'=1+1"');
});

test('CSV matches answers by ID when multiple questions have the same label', () => {
   const survey = { questions: [{ id: 1, question: 'Feedback, please' }, { id: 2, question: 'Feedback, please' }] };
   const responses = { data: [{ id: 3, answers: [
      { survey_question_id: 1, question: 'Feedback, please', answer: '["A","B"]' },
      { survey_question_id: 2, question: 'Feedback, please', answer: 'C' },
   ] }] };
   assert.equal(buildSurveyCSV(survey, responses), '"id","Feedback, please","Feedback, please","Date"\r\n"3","A, B","C",""');
});

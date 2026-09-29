import test from 'node:test';
import assert from 'node:assert/strict';
import { validateImage, validateAnswers, normalizeAnswerErrors, MAX_IMAGE_BYTES, MAX_ANSWER_LENGTH } from '../src/utils/surveyValidation.js';

test('image limits match the API and reject empty or unsupported files', () => {
   for (const type of ['image/jpeg', 'image/png', 'image/gif']) assert.equal(validateImage({ type, size: MAX_IMAGE_BYTES }), '');
   assert.ok(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }));
   assert.ok(validateImage({ type: 'image/png', size: 0 }));
   assert.ok(validateImage({ type: 'image/svg+xml', size: 100 }));
});
test('answers require meaningful input and enforce the server text limit', () => {
   for (const answers of [{}, { 1: '' }, { 1: '   ', 2: [] }]) assert.ok(validateAnswers(answers).answers);
   assert.deepEqual(validateAnswers({ 1: '0', 2: ['Good'] }), {});
   assert.deepEqual(validateAnswers({ 1: 'a'.repeat(MAX_ANSWER_LENGTH) }), {});
   assert.ok(validateAnswers({ 1: 'a'.repeat(MAX_ANSWER_LENGTH + 1) })['answers.1']);
});
test('API validation messages preserve the question IDs', () => {
   assert.deepEqual(normalizeAnswerErrors({ 'answers.11': ['First', 'Second'], answers: 'Required' }), { 'answers.11': 'First Second', answers: 'Required' });
});

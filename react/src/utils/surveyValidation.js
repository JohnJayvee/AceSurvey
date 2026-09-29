export const MAX_ANSWER_LENGTH = 10000;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImage(file) {
    if (!IMAGE_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or GIF image.';
    if (!file.size || file.size > MAX_IMAGE_BYTES) return 'Choose a non-empty image of 5 MB or smaller.';
    return '';
}

export function validateAnswers(answers) {
    const errors = {};
    const entries = Object.entries(answers);
    if (!entries.some(([, value]) => Array.isArray(value) ? value.length : typeof value === 'string' && value.trim())) {
        errors.answers = 'Please answer at least one question before submitting.';
    }
    for (const [id, answer] of entries) {
        if ((Array.isArray(answer) ? answer : [answer]).some(value => typeof value !== 'string' || value.length > MAX_ANSWER_LENGTH)) {
            errors['answers.' + id] = `Answers must be text of at most ${MAX_ANSWER_LENGTH} characters.`;
        }
    }
    return errors;
}

export function normalizeAnswerErrors(errors = {}) {
    return Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value.join(' ') : String(value)]));
}

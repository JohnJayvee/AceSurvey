export function csvCell(value) {
   let text = String(value ?? '');
   // Prevent spreadsheet programs from executing respondent-supplied formulas.
   if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
   return '"' + text.replace(/"/g, '""') + '"';
}

export function buildSurveyCSV(survey, responses) {
   const questions = survey.questions || [];
   const rows = [['id', ...questions.map(question => question.question), 'Date']];
   for (const response of responses.data || []) {
      const answers = response.answers || [];
      rows.push([
         response.id,
         ...questions.map(question => answers.filter(answer =>
            answer.survey_question_id != null
               ? String(answer.survey_question_id) === String(question.id)
               : answer.question === question.question
         ).flatMap(answer => {
            try {
               const decoded = JSON.parse(answer.answer);
               if (Array.isArray(decoded)) return decoded;
            } catch {
               // Plain text is the normal format for non-checkbox answers.
            }
            return [answer.answer ?? ''];
         }).join(', ')),
         answers[0]?.created_at || '',
      ]);
   }
   return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}

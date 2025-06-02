import { useCallback } from "react";
import { debounce } from 'lodash';

export const useCSVDownload = (survey, responses) => {
   const generateCSV = useCallback(() => {
      if (!responses.data.length || !survey.questions) return;

      const allQuestions = survey.questions.map(q => q.question);
      const headers = ['id', ...allQuestions, 'Date'];
      const csvRows = [headers.join(',')];

      responses.data.forEach(response => {
         const rawDate = response.answers[0]?.created_at || '';
         let formattedDate = '';
         if (rawDate) {
            const d = new Date(rawDate);
            formattedDate = d.toLocaleString('en-US', {
               month: '2-digit',
               day: '2-digit',
               year: 'numeric',
               hour: 'numeric',
               minute: '2-digit',
               hour12: true
            });
         }

         const row = [
            `"${response.id}"`,
            ...allQuestions.map(q => {
               const answers = response.answers.filter(ans => ans.question === q);
               const flat = answers.flatMap(ans => {
                  let val = ans.answer;
                  if (typeof val === 'string' && val.trim().startsWith('[') && val.trim().endsWith(']')) {
                     try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                     } catch (e) { }
                  }
                  return val != null ? [val] : [];
               });
               const combined = flat.join(',');
               return `"${combined.replace(/"/g, '""')}"`;
            }),
            `"${formattedDate}"`
         ];

         csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${survey.title}_responses.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
   }, [survey, responses]);

   const downloadCSV = debounce(generateCSV, 300);

   return { downloadCSV };
};

import { useCallback } from "react";
import { buildSurveyCSV } from "../utils/csvUtils";

export const useCSVDownload = (survey, responses) => {
   const downloadCSV = useCallback(() => {
      if (!responses.data?.length || !survey.questions) return;
      const blob = new Blob(['\uFEFF', buildSurveyCSV(survey, responses)], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = (survey.title || 'survey') + '_responses.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 0);
   }, [survey, responses]);
   return { downloadCSV };
};


import { format } from "date-fns";

export const transformResponsesData = (responsesData, survey) => {
   return responsesData.map((response) => {
      const createdAt = new Date(response.end_date || response.answers?.[0]?.created_at);

      let nameAnswer = "No answer";
      if (survey.questions && survey.questions.length > 0) {
         const firstQuestion = survey.questions[0].question;
         const firstQuestionAnswer = (response.answers || []).find(
            ans => ans.question === firstQuestion
         );
         nameAnswer = firstQuestionAnswer?.answer || "No answer";
      }

      return {
         id: response.id,
         answer: nameAnswer,
         date: Number.isNaN(createdAt.getTime()) ? "Date unavailable" : format(createdAt, "MMMM d, yyyy"),
         time: Number.isNaN(createdAt.getTime()) ? "" : format(createdAt, "h:mm a"),
      };
   });
};

export const filterResponses = (rows, searchQuery) => {
   if (!searchQuery) return rows;

   return rows.filter(row =>
      row.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.time.toLowerCase().includes(searchQuery.toLowerCase())
   );
};

export const getChartConfig = (width) => {
   if (width < 640) {
      return {
         outer: 60,
         inner: 30,
         height: 200,
         fontSize: '10px',
         paddingTop: '8px',
         iconSize: 6,
         tooltipPadding: '6px 8px',
         tooltipFontSize: '11px'
      };
   }
   if (width < 768) {
      return {
         outer: 80,
         inner: 40,
         height: 250,
         fontSize: '12px',
         paddingTop: '12px',
         iconSize: 8,
         tooltipPadding: '8px 10px',
         tooltipFontSize: '12px'
      };
   }
   return {
      outer: 100,
      inner: 50,
      height: 300,
      fontSize: '14px',
      paddingTop: '16px',
      iconSize: 10,
      tooltipPadding: '10px 12px',
      tooltipFontSize: '14px'
   };
};

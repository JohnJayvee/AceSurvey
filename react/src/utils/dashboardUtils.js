import { format } from "date-fns";

export const processRatingsData = (ratings) => {
   const defaultData = [
      { name: 'Very Satisfied', value: 0, rating: '5' },
      { name: 'Satisfied', value: 0, rating: '4' },
      { name: 'Undecided', value: 0, rating: '3' },
      { name: 'Unsatisfied', value: 0, rating: '2' },
      { name: 'Very Unsatisfied', value: 0, rating: '1' }
   ];

   if (ratings && Object.keys(ratings).length > 0) {
      Object.entries(ratings).forEach(([rating, data]) => {
         const index = defaultData.findIndex(item => item.rating === rating);
         if (index !== -1) {
            defaultData[index].value = data.count;
         }
      });
   }

   return defaultData;
};

export const generateMonthlyData = (surveyStats) => {
   const currentYear = new Date().getFullYear();
   const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
   ];

   const chartData = months.map(month => ({
      name: month,
      surveys: 0,
      responses: 0
   }));

   surveyStats?.forEach((surveyStat) => {
      const surveyDate = new Date(surveyStat.updated_at);
      if (isNaN(surveyDate.getTime())) return;

      if (surveyDate.getFullYear() === currentYear) {
         const surveyMonth = surveyDate.getMonth();
         chartData[surveyMonth].surveys += 1;
         chartData[surveyMonth].responses += surveyStat.answers;
      }
   });

   return chartData;
};

export const formatDate = (dateString) => {
   return format(new Date(dateString), "MMMM, dd yyyy | hh:mm a");
};

export const isSurveyExpired = (expireDate) => {
   const today = new Date().setHours(0, 0, 0, 0);
   const expiration = new Date(expireDate).setHours(0, 0, 0, 0);
   return expiration <= today;
};

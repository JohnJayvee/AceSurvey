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

const activityMonth = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : null;

export const getActivityYears = (monthlyActivity = [], currentYear = new Date().getFullYear()) => {
   const years = monthlyActivity.map(item => activityMonth(item.month) ? Number(item.month.slice(0, 4)) : NaN)
      .filter(year => Number.isFinite(year) && year > 0 && year <= currentYear);
   const earliestYear = Math.min(currentYear, ...years);
   return Array.from({ length: currentYear - earliestYear + 1 }, (_, index) => currentYear - index);
};

export const generateMonthlyData = (monthlyActivity = [], selectedYear = new Date().getFullYear()) => {
   const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
   ];

   const chartData = months.map(month => ({
      name: month,
      surveys: 0,
      responses: 0
   }));

   monthlyActivity.forEach((activity) => {
      if (!activityMonth(activity.month)) return;
      if (Number(activity.month.slice(0, 4)) === selectedYear) {
         const surveyMonth = Number(activity.month.slice(5, 7)) - 1;
         chartData[surveyMonth].surveys += Number(activity.surveys) || 0;
         chartData[surveyMonth].responses += Number(activity.responses) || 0;
      }
   });

   return chartData;
};

export const formatDate = (dateString) => {
   if (!dateString) return "No expiration";
   const date = new Date(dateString);
   return Number.isNaN(date.getTime()) ? "Invalid date" : format(date, "MMMM, dd yyyy | hh:mm a");
};

export const isSurveyExpired = (expireDate) => {
   if (!expireDate) return false;
   const today = new Date().setHours(0, 0, 0, 0);
   const expiration = new Date(expireDate.length === 10 ? expireDate + "T00:00:00" : expireDate).setHours(0, 0, 0, 0);
   return expiration < today;
};

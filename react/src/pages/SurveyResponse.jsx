import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "@api/axios.js";
import Loader from "@components/Loader";
import { Divider } from "@mui/joy";
import { DataGrid } from "@mui/x-data-grid";
import { gridClasses } from "@mui/x-data-grid";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { FaArrowLeft } from "react-icons/fa6";
import { format } from "date-fns";
import { MdOutlineInfo } from "react-icons/md";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from "framer-motion";
import { HiDownload } from "react-icons/hi";
import { debounce } from 'lodash';

const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#FF9800', '#F44336'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
   // Calculate position for the label
   const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
   const x = cx + radius * Math.cos(-midAngle * RADIAN);
   const y = cy + radius * Math.sin(-midAngle * RADIAN);

   // Calculate font size - smaller for tiny slices
   const fontSize = percent < 0.05 ? '10px' : '14px';

   return (
      <text
         x={x}
         y={y}
         fill="white"
         textAnchor={x > cx ? 'start' : 'end'}
         dominantBaseline="central"
         style={{
            fontSize,
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
         }}
      >
         {`${(percent * 100).toFixed(0)}%`}
      </text>
   );
};

// Your existing variables
const cache = {};
const ongoingRequests = {};
const isFetching = {};

const useWindowSize = () => {
   const [windowSize, setWindowSize] = useState({
      width: typeof window !== 'undefined' ? window.innerWidth : 1024,
      height: typeof window !== 'undefined' ? window.innerHeight : 768,
   });

   useEffect(() => {
      function handleResize() {
         setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
         });
      }

      if (typeof window !== 'undefined') {
         window.addEventListener("resize", handleResize);
         handleResize(); // Set initial size
      }

      return () => {
         if (typeof window !== 'undefined') {
            window.removeEventListener("resize", handleResize);
         }
      };
   }, []);

   return windowSize;
};

export default function SurveyResponse() {
   const { id } = useParams();
   const navigate = useNavigate();
   const [survey, setSurvey] = useState({ title: "", status: true });
   const [responses, setResponses] = useState({ data: [] });
   const [responseCount, setResponseCount] = useState(0);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [ratingsData, setRatingsData] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");

   // Add a ref to track if this component instance has started fetching
   const hasInitiatedFetchRef = useRef(false);
   const { width } = useWindowSize();

   useEffect(() => {
      // Reset component-level flag when ID changes
      hasInitiatedFetchRef.current = false;

      let isMounted = true;
      const controller = new AbortController();

      console.log("Effect triggered for survey ID:", id);

      // Use cache if available (this part is fine)
      if (cache[id]) {
         console.log("Using cached data for survey ID:", id);
         setSurvey(cache[id].survey);
         setResponses(cache[id].responses);
         setResponseCount(cache[id].responseCount);
         setRatingsData(cache[id].ratingsData);
         setLoading(false);
         return;
      }

      // Here's the key change - generate unique request keys
      const requestKeys = [
         `/survey/${id}`,
         `/survey/${id}/responses`,
         `/survey/${id}/responses/count`,
         `/total-department-ratings/${id}`
      ];

      // Check if ANY of these requests are already in progress
      const isAnyRequestInProgress = requestKeys.some(key => isFetching[key]);

      // Skip if this component already started requests OR any request is in progress
      if (hasInitiatedFetchRef.current || isAnyRequestInProgress) {
         console.log("Skipping duplicate fetch for survey ID:", id);
         return;
      }

      hasInitiatedFetchRef.current = true;
      setLoading(true);
      setError(null);

      console.log("Starting API requests for survey ID:", id);

      // Mark all URLs as being fetched
      requestKeys.forEach(key => {
         isFetching[key] = true;
      });

      // Simpler approach - just use Promise.all directly
      Promise.all([
         axiosClient.get(`/survey/${id}`, { signal: controller.signal }),
         axiosClient.get(`/survey/${id}/responses`, { signal: controller.signal }),
         axiosClient.get(`/survey/${id}/responses/count`, { signal: controller.signal }),
         axiosClient.get(`/total-department-ratings/${id}`, { signal: controller.signal })
      ]).then(([surveyRes, responsesRes, countRes, ratingsRes]) => {
         console.log("All API requests completed successfully");

         // Clear fetching flags
         requestKeys.forEach(key => {
            isFetching[key] = false;
         });

         if (!isMounted) {
            console.log("Component unmounted, not updating state");
            return;
         }

         const surveyData = surveyRes.data.data;
         const responsesData = responsesRes.data;
         const countData = countRes.data.count;

         // Process ratings data
         const defaultData = [
            { name: 'Very Satisfied', value: 0, rating: '5' },
            { name: 'Satisfied', value: 0, rating: '4' },
            { name: 'Undecided', value: 0, rating: '3' },
            { name: 'Unsatisfied', value: 0, rating: '2' },
            { name: 'Very Unsatisfied', value: 0, rating: '1' }
         ];

         const ratings = ratingsRes.data.ratings;
         if (ratings && Object.keys(ratings).length > 0) {
            Object.entries(ratings).forEach(([rating, data]) => {
               const index = defaultData.findIndex(item => item.rating === rating);
               if (index !== -1) {
                  defaultData[index].value = data.count;
               }
            });
         }

         // Cache the results
         cache[id] = {
            survey: surveyData,
            responses: responsesData,
            responseCount: countData,
            ratingsData: defaultData
         };

         console.log("Setting states with API response data");
         setSurvey(surveyData);
         setResponses(responsesData);
         setResponseCount(countData);
         setRatingsData(defaultData);
         setLoading(false);
      }).catch(error => {
         // Clear fetching flags on error too
         requestKeys.forEach(key => {
            isFetching[key] = false;
         });

         console.log("API error:", error.name, error.message);

         // Always set loading to false on error, regardless of error type
         if (isMounted) {
            if (error.name !== 'AbortError' && error.name !== 'CanceledError' && error.message !== 'canceled') {
               setError(error.message || "Failed to load data");
            } else {
               console.log("Request was aborted/canceled");
            }
            setLoading(false);
         }
      });

      return () => {
         console.log("Cleanup function called");
         isMounted = false;
         controller.abort();

         // Clean up fetching flags in cleanup function too
         requestKeys.forEach(key => {
            isFetching[key] = false;
         });
      };
   }, [id]);

   const handleGoBack = () => navigate(-1);

   const handleViewDetail = (surveyId, responseId) => {
      navigate(`/surveys/${surveyId}/responses/${responseId}`);
   };

   // Debounce the download function to prevent multiple calls on rapid clicks
   const debouncedDownloadCSV = debounce(() => {
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
   }, 300);

   // Replace your regular download function with the debounced one
   const downloadCSV = () => {
      debouncedDownloadCSV();
   };

   const columns = [
      {
         field: "answer",
         headerName: "Name",
         width: 300,
         flex: 1,
         minWidth: 150,
      },
      {
         field: "date",
         headerName: "Date",
         width: 300,
         flex: 1,
         minWidth: 150,
      },
      {
         field: "time",
         headerName: "Time",
         width: 300,
         flex: 1,
         minWidth: 150,
      },
      {
         field: "action",
         headerAlign: "center",
         headerName: "Action",
         flex: 1,
         minWidth: 120,
         renderCell: (params) => (
            <div className="flex justify-center gap-2">
               <Tooltip
                  arrow
                  title="View Details"
                  placement="right"
                  TransitionComponent={Fade}
               >
                  <div
                     onClick={() => handleViewDetail(id, params.row.id)}
                     className="p-2 my-2 text-black border rounded-lg cursor-pointer"
                  >
                     <MdOutlineInfo size={18} className="text-gray-600" />
                  </div>
               </Tooltip>
            </div>
         ),
      },
   ];

   const rows = responses.data.map((response) => {
      // Get created date from any answer (they should all have the same timestamp)
      const createdAt = new Date(response.answers[0]?.created_at);

      // Find the first question's answer
      let nameAnswer = "No answer";
      if (survey.questions && survey.questions.length > 0) {
         const firstQuestion = survey.questions[0].question;
         const firstQuestionAnswer = response.answers.find(
            ans => ans.question === firstQuestion
         );
         nameAnswer = firstQuestionAnswer?.answer || "No answer";
      }

      return {
         id: response.id,
         answer: nameAnswer,
         date: format(createdAt, "MMMM d, yyyy"),
         time: format(createdAt, "h:mm a"),
      };
   });

   const filteredRows = rows.filter(
      (row) =>
         row.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
         row.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
         row.time.toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (loading) {
      return (
         <div className="w-full mx-auto lg:w-9/12 xl:w-8/12">
            <div className="w-full mb-4">
               <Skeleton height={32} width={300} />
            </div>
            <div className="flex justify-between w-full px-4 mb-4 bg-white rounded-lg">
               <Skeleton circle width={48} height={48} />
            </div>
            <div className="flex flex-col w-full gap-4">
               <div className="w-full p-6 bg-white rounded-lg">
                  <div className="w-full">
                     <Skeleton height={60} width={120} />
                     <Skeleton height={20} width={200} />
                  </div>
               </div>
               <div className="w-full p-4 bg-white rounded-lg">
                  <div className="h-[400px]">
                     {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex justify-between p-4 border-b">
                           <Skeleton width={200} />
                           <Skeleton width={150} />
                           <Skeleton width={150} />
                           <Skeleton width={80} />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      );
   }

   if (error)
      return <div className="text-center text-red-500">Error: {error}</div>;

   if (!responses?.data?.length) {
      return (
         <div className="w-full mx-auto lg:w-9/12 xl:w-8/12">
            <div className="w-full mb-4 text-2xl font-semibold">
               {survey.title} survey responses
            </div>
            <div className="p-8 text-center bg-white rounded-lg">
               <p className="text-lg text-gray-600">
                  No responses found for this survey
               </p>
               <button
                  onClick={handleGoBack}
                  className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
               >
                  Go Back
               </button>
            </div>
         </div>
      );
   }

   // Get responsive values
   const getChartConfig = () => {
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

   const chartConfig = getChartConfig();

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="w-full max-w-full px-4 mx-auto lg:w-9/12 xl:w-8/12 lg:px-0"
      >
         <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between w-full mb-6"
         >
            <h1 className="text-lg font-bold text-gray-900 truncate sm:text-xl md:text-2xl">
               {survey.title} Survey Responses
            </h1>
         </motion.div>

         <div className="flex flex-col w-full gap-3 px-4 py-3 mb-6 bg-white shadow-sm sm:flex-row sm:items-center sm:justify-between rounded-xl">
            <Tooltip title="Go Back" placement="right" TransitionComponent={Fade}>
               <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoBack}
                  className="p-2.5 text-gray-600 transition-colors rounded-lg hover:bg-gray-100 self-start sm:self-center"
               >
                  <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
               </motion.button>
            </Tooltip>

            <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={downloadCSV}
               className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base font-medium text-white transition-all duration-200 bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full sm:w-auto"
            >
               <HiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
               <span className="whitespace-nowrap">Download</span>
            </motion.button>
         </div>

         <div className="grid gap-4 sm:gap-6">
            <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="p-4 bg-white shadow-sm sm:p-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800"
            >
               <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="text-center text-white sm:text-left">
                     <p className="text-3xl font-bold sm:text-4xl md:text-5xl">
                        {responseCount}
                     </p>
                     <p className="mt-2 text-sm text-blue-100 sm:text-base">
                        Total Responses
                     </p>
                  </div>
                  {survey.image_url && (
                     <img
                        src={survey.image_url}
                        loading="lazy"
                        alt={survey.title}
                        className="flex-shrink-0 object-cover w-24 h-24 rounded-lg shadow-lg sm:w-32 sm:h-32 md:w-40 md:h-40"
                     />
                  )}
               </div>
            </motion.div>

            <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.1 }}
               className="p-3 overflow-hidden bg-white shadow-sm sm:p-4 md:p-6 rounded-xl"
            >
               <h2 className="mb-3 text-sm font-semibold text-gray-900 sm:mb-4 md:mb-6 sm:text-base md:text-lg">
                  Rating Distribution
               </h2>
               <div style={{ height: `${chartConfig.height}px`, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={ratingsData}
                           cx="50%"
                           cy="50%"
                           labelLine={false}
                           label={renderCustomizedLabel}
                           outerRadius={chartConfig.outer}
                           innerRadius={chartConfig.inner}
                           paddingAngle={width < 640 ? 2 : 5}
                           fill="#8884d8"
                           dataKey="value"
                        >
                           {ratingsData.map((entry, index) => (
                              <Cell
                                 key={`cell-${index}`}
                                 fill={COLORS[index % COLORS.length]}
                                 stroke="none"
                                 className="transition-all duration-300 hover:opacity-80"
                              />
                           ))}
                        </Pie>

                        <Legend
                           layout="horizontal"
                           verticalAlign="bottom"
                           align="center"
                           wrapperStyle={{
                              paddingTop: chartConfig.paddingTop,
                              fontSize: chartConfig.fontSize,
                              lineHeight: '1.2'
                           }}
                           iconType="circle"
                           iconSize={chartConfig.iconSize}
                        />

                        <RechartsTooltip
                           content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                 const data = payload[0];
                                 return (
                                    <div style={{
                                       backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                       border: 'none',
                                       borderRadius: '6px',
                                       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                       padding: chartConfig.tooltipPadding,
                                       fontSize: chartConfig.tooltipFontSize,
                                       maxWidth: '200px'
                                    }}>
                                       <p style={{
                                          color: data.payload.fill || data.color,
                                          fontWeight: 'bold',
                                          margin: 0,
                                          whiteSpace: 'nowrap'
                                       }}>
                                          {data.name}: {data.value}
                                       </p>
                                    </div>
                                 );
                              }
                              return null;
                           }}
                           wrapperStyle={{
                              zIndex: 1000,
                              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                           }}
                        />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </motion.div>

            <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="p-3 overflow-hidden bg-white shadow-sm sm:p-4 md:p-6 rounded-xl"
            >
               <div className="mb-4 sm:mb-6">
                  <input
                     type="text"
                     placeholder="Search responses..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-200"
                  />
               </div>
               <div className="overflow-x-auto">
                  <DataGrid
                     sx={{
                        border: 'none',
                        minWidth: '300px',
                        '& .MuiDataGrid-cell': {
                           borderColor: '#f1f5f9',
                           fontSize: width < 640 ? '12px' : '14px',
                           padding: width < 640 ? '4px 8px' : '8px 16px',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                           backgroundColor: '#f8fafc',
                           borderRadius: '8px',
                           fontSize: width < 640 ? '12px' : '14px',
                        },
                        '& .MuiDataGrid-footerContainer': {
                           padding: width < 640 ? '0.5rem' : '1rem',
                           borderTop: '1px solid #f1f5f9',
                        },
                        '& .MuiTablePagination-root': {
                           fontSize: width < 640 ? '12px' : '14px',
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                           margin: 0,
                           fontSize: width < 640 ? '11px' : '13px',
                        },
                        [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: {
                           outline: 'none',
                        },
                        [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]: {
                           outline: 'none',
                        },
                     }}
                     initialState={{
                        pagination: { paginationModel: { pageSize: width < 640 ? 5 : 10 } },
                     }}
                     rows={filteredRows}
                     columns={columns.map(col => ({
                        ...col,
                        width: width < 640 ? Math.min(col.width || 150, 120) : col.width,
                        minWidth: width < 640 ? 80 : col.minWidth
                     }))}
                     pageSizeOptions={width < 640 ? [5, 10, 20] : [10, 20, 50, 100]}
                     getRowId={(row) => row.id}
                     className="pb-2 sm:pb-4"
                     autoHeight
                  />
               </div>
            </motion.div>
         </div>
      </motion.div>
   );
}

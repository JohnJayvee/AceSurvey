import React, { useState } from "react";
import { MagnifyingGlassIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const ResponsesTable = ({ rows, searchQuery, onSearchChange, onViewDetail, width }) => {
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = width < 768 ? 5 : 10;

   const totalPages = Math.ceil(rows.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const currentRows = rows.slice(startIndex, endIndex);

   const handlePageChange = (page) => {
      setCurrentPage(page);
   };

   const handlePrevious = () => {
      if (currentPage > 1) {
         setCurrentPage(currentPage - 1);
      }
   };

   const handleNext = () => {
      if (currentPage < totalPages) {
         setCurrentPage(currentPage + 1);
      }
   };

   // Reset to first page when search changes
   React.useEffect(() => {
      setCurrentPage(1);
   }, [searchQuery]);

   const isMobile = width < 768;

   return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
         <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Survey Responses</h2>

            <div className="relative">
               <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
               </div>
               <input
                  type="text"
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="block w-full py-2 pl-10 pr-3 text-sm placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               />
            </div>
         </div>

         {rows.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
               <div className="text-center">
                  <div className="mb-2 text-2xl">🔍</div>
                  <p className="text-sm">No responses found</p>
               </div>
            </div>
         ) : (
            <>
               {isMobile ? (
                  // Mobile Card Layout
                  <div className="space-y-4">
                     {currentRows.map((row) => (
                        <div key={row.id} className="p-4 border border-gray-200 rounded-lg">
                           <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium text-gray-900 truncate">
                                    {row.answer}
                                 </p>
                                 <div className="mt-1 text-xs text-gray-500">
                                    <span className="block">{row.date}</span>
                                    <span className="block">{row.time}</span>
                                 </div>
                              </div>
                              <button
                                 onClick={() => onViewDetail(row.id)}
                                 className="flex items-center justify-center w-8 h-8 ml-3 text-blue-600 rounded-lg bg-blue-50 hover:bg-blue-100"
                                 aria-label="View details"
                              >
                                 <EyeIcon className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  // Desktop Table Layout
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                           <tr>
                              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                 Response
                              </th>
                              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                 Date
                              </th>
                              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                 Time
                              </th>
                              <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                                 Actions
                              </th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {currentRows.map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50">
                                 <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-xs truncate" title={row.answer}>
                                       {row.answer}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-sm text-gray-500">
                                    {row.date}
                                 </td>
                                 <td className="px-6 py-4 text-sm text-gray-500">
                                    {row.time}
                                 </td>
                                 <td className="px-6 py-4 text-sm font-medium text-right">
                                    <button
                                       onClick={() => onViewDetail(row.id)}
                                       className="inline-flex items-center gap-2 px-3 py-1 text-blue-600 rounded-lg bg-blue-50 hover:bg-blue-100"
                                    >
                                       <EyeIcon className="w-4 h-4" />
                                       <span>View</span>
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}

               {/* Pagination */}
               {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                     <div className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(endIndex, rows.length)} of {rows.length} results
                     </div>

                     <div className="flex items-center gap-2">
                        <button
                           onClick={handlePrevious}
                           disabled={currentPage === 1}
                           className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <ChevronLeftIcon className="w-4 h-4 mr-1" />
                           Previous
                        </button>

                        <div className="flex gap-1">
                           {[...Array(totalPages)].map((_, index) => {
                              const page = index + 1;
                              const isCurrentPage = page === currentPage;

                              // Show first page, last page, current page, and pages around current
                              const showPage = page === 1 ||
                                 page === totalPages ||
                                 Math.abs(page - currentPage) <= 1;

                              if (!showPage) {
                                 if (page === currentPage - 2 || page === currentPage + 2) {
                                    return <span key={page} className="px-2 text-gray-400">...</span>;
                                 }
                                 return null;
                              }

                              return (
                                 <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg ${isCurrentPage
                                          ? 'bg-blue-600 text-white'
                                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                       }`}
                                 >
                                    {page}
                                 </button>
                              );
                           })}
                        </div>

                        <button
                           onClick={handleNext}
                           disabled={currentPage === totalPages}
                           className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           Next
                           <ChevronRightIcon className="w-4 h-4 ml-1" />
                        </button>
                     </div>
                  </div>
               )}
            </>
         )}
      </div>
   );
};

export default ResponsesTable;

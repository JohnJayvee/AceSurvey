import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

export default function PaginationLinks({ meta, onPageClick }) {
   function onClick(ev, link) {
      ev.preventDefault();
      if (!link.url) {
         return;
      }
      onPageClick(link);
   }

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center justify-between px-4 py-3 mt-8 transition-shadow duration-200 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md sm:px-6"
      >
         {/* Mobile pagination */}
         <div className="flex justify-between flex-1 sm:hidden">
            <motion.a
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               href="#"
               onClick={(ev) => onClick(ev, meta.links[0])}
               className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
               Previous
            </motion.a>
            <motion.a
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               href="#"
               onClick={(ev) => onClick(ev, meta.links[meta.links.length - 1])}
               className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
               Next
            </motion.a>
         </div>

         {/* Desktop pagination */}
         <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
               <p className="text-sm text-gray-700">
                  Showing <span className="font-medium text-gray-900">{meta.from}</span>{" "}
                  to <span className="font-medium text-gray-900">{meta.to}</span> of{" "}
                  <span className="font-medium text-gray-900">{meta.total}</span>{" "}
                  results
               </p>
            </div>
            <div>
               {meta.total > meta.per_page && (
                  <nav
                     aria-label="Pagination"
                     className="inline-flex space-x-1 rounded-md shadow-sm isolate"
                  >
                     {meta.links && meta.links.map((link, ind) => (
                        <motion.a
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           href="#"
                           onClick={(ev) => onClick(ev, link)}
                           key={ind}
                           aria-current={link.active ? 'page' : undefined}
                           className={`
                                        relative inline-flex items-center py-2 text-sm font-medium
                                        transition-all duration-200
                                        focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                        ${link.label.includes("Previous") || link.label.includes("Next")
                                 ? "px-2 bg-gray-100 rounded-full hover:bg-gray-200"
                                 : "px-4"
                              }
                                        ${ind === 0 ? "rounded-l-lg" : ""}
                                        ${ind === meta.links.length - 1 ? "rounded-r-lg" : ""}
                                        ${link.active
                                 ? "bg-blue-600 text-white hover:bg-blue-700"
                                 : "text-gray-700 hover:bg-gray-100"
                              }
                                        ${!link.url ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}
                                    `}
                        >
                           {link.label.includes("Previous") && (
                              <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
                           )}
                           {link.label.includes("Next") && (
                              <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
                           )}
                           {!link.label.includes("Previous") && !link.label.includes("Next") && (
                              <span dangerouslySetInnerHTML={{ __html: link.label }} />
                           )}
                        </motion.a>
                     ))}
                  </nav>
               )}
            </div>
         </div>
      </motion.div>
   );
}

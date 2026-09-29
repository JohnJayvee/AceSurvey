import PropTypes from 'prop-types';
import { motion } from "framer-motion";

const SimpleProgressBar = ({ current, total }) => {
   const progress = total > 0 ? Math.round((current / total) * 100) : 0;

   return (
      <div className="w-full p-4 mb-6 bg-white shadow-sm rounded-xl">
         <div className="flex justify-between mb-2 text-sm font-medium text-gray-700">
            <span>Progress</span>
            <span>{progress}%</span>
         </div>
         <div className="w-full h-4 overflow-hidden bg-gray-200 rounded-full shadow-inner">
            <motion.div
               className="h-full rounded-full shadow-md bg-gradient-to-r from-blue-500 to-indigo-600"
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               transition={{ duration: 0.8, ease: "easeOut" }}
            />
         </div>
         <div className="mt-1 text-xs text-right text-gray-500">
            {current} of {total} answered
         </div>
      </div>
   );
};
SimpleProgressBar.propTypes = {
   current: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
   total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};


export default SimpleProgressBar;

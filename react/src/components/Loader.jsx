import { Loader as RsuiteLoader } from "rsuite";
import { motion } from "framer-motion";
import "rsuite/Loader/styles/index.css";

const Loader = () => {
   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ duration: 0.3 }}
         className="absolute top-0 left-0 flex items-center justify-center w-full h-full bg-white/50 backdrop-blur-sm"
      >
         <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
               duration: 0.5,
               type: "spring",
               stiffness: 100
            }}
            className="flex flex-col items-center"
         >
            <RsuiteLoader
               size="md"
               speed="normal"
               className="text-blue-600"
            />
            <motion.span
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="mt-3 text-sm font-medium text-gray-600"
            >
               Loading...
            </motion.span>
         </motion.div>
      </motion.div>
   );
};

export default Loader;

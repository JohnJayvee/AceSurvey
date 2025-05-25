import { useStateContext } from "@context/ContextProvider";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

export default function Toast() {
    const { toast } = useStateContext();

    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-600';
            case 'error':
                return 'bg-red-600';
            case 'warning':
                return 'bg-yellow-600';
            default:
                return 'bg-blue-600';
        }
    };

    const getToastIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5" />;
            case 'error':
                return <XCircleIcon className="w-5 h-5" />;
            case 'warning':
                return <ExclamationCircleIcon className="w-5 h-5" />;
            default:
                return <CheckCircleIcon className="w-5 h-5" />;
        }
    };

    return (
        <AnimatePresence>
            {toast.show && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed z-50 right-4 bottom-4"
                >
                    <div className={`flex items-center gap-2 min-w-[280px] p-4 text-white rounded-lg shadow-lg backdrop-blur-sm ${getToastStyles()}`}>
                        <div className="flex-shrink-0">
                            {getToastIcon()}
                        </div>
                        <p className="text-sm font-medium">
                            {toast.message}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

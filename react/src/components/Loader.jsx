import { Loader as RsuiteLoader } from "rsuite";
import "rsuite/Loader/styles/index.css";

const Loader = () => {
    return (
        <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full bg-transparent">
            <RsuiteLoader size="md" content="Loading..." />
        </div>
    );
};

export default Loader;

import { FaLightbulb } from "react-icons/fa";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import AboutPopup from "@components/AboutPopup";
import { useState } from "react";

export default function Bulb() {
    const [openAboutPopup, setOpenAboutPopup] = useState(false);

    const handleOpenAbout = () => {
        setOpenAboutPopup(true);
    };

    return (
        <div>
            <Tooltip
                arrow
                title="About"
                placement="bottom"
                TransitionComponent={Fade}
            >
                <div
                    onClick={handleOpenAbout}
                    className="relative flex items-center justify-center cursor-pointer"
                >
                    {/* Animated background */}
                    <div className="absolute w-10 h-10 bg-yellow-200 rounded-full opacity-75 animate-ping"></div>
                    {/* Icon centered on top */}
                    <FaLightbulb
                        size={25}
                        className="relative text-yellow-400 hover:text-yellow-500"
                    />
                </div>
            </Tooltip>
            <AboutPopup
                openAboutPopup={openAboutPopup}
                setOpenAboutPopup={setOpenAboutPopup}
            />
        </div>
    );
}

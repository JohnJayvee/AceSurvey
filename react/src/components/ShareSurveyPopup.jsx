import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import Modal from "@mui/material/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Divider from "@mui/material/Divider";
import { useMediaQuery } from "@mui/material";
import { useStateContext } from "../contexts/ContextProvider";
import { QRCodeSVG } from "qrcode.react";

const ShareSurveyPopup = ({ openSharePopup, setOpenSharePopup, shareLink }) => {
    const handleClosePopup = () => {
        setOpenSharePopup(false);
    };
    const { showToast } = useStateContext();

    const isMobile = useMediaQuery("(max-width:600px)");

    const dynamicPopupStyle = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        p: 3,
        width: "min(90%, 600px)",
        maxHeight: isMobile ? "95vh" : "calc(100vh - 100px)",
        overflowY: "auto",
    };

    const qrRef = useRef(null);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink).then(() => {
            showToast("Link copied to clipboard!");
            setOpenSharePopup(false);
        });
    };

    const handleDownloadQR = () => {
        const svg = qrRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        const logo = new Image();

        // Set higher resolution
        const scale = 4; // Increase this for even higher quality
        canvas.width = 200 * scale; // Match QRCode size (200) * scale
        canvas.height = 200 * scale;

        // Scale the context to maintain proper rendering
        ctx.scale(scale, scale);

        img.onload = () => {
            ctx.drawImage(img, 0, 0, 200, 200); // Set explicit dimensions

            logo.onload = () => {
                const logoSize = 40;
                const centerX = (200 - logoSize) / 2;
                const centerY = (200 - logoSize) / 2;

                ctx.drawImage(logo, centerX, centerY, logoSize, logoSize);

                // Get high quality PNG
                const pngFile = canvas.toDataURL("image/png", 1.0);
                const downloadLink = document.createElement("a");
                downloadLink.download = "survey-qr-code.png";
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            logo.src = "/AceLogo.png";
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div>
            <Modal open={openSharePopup} onClose={handleClosePopup}>
                <Box className="bg-white rounded-xl" sx={dynamicPopupStyle}>
                    <div className="relative mb-6">
                        <div className="absolute -top-3 right-0">
                            <ModalClose
                                variant="outlined"
                                onClick={handleClosePopup}
                            />
                        </div>
                        <div className="text-lg font-semibold mb-2 text-center">
                            Share this survey
                        </div>
                    </div>
                    <Divider />
                    <div className="mt-8">
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="w-full p-2 border rounded-lg"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="w-20 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Copy
                            </button>
                        </div>

                        <div className="flex flex-col items-center mt-4">
                            <div className="text-gray-600 mb-4">Scan QR Code</div>
                            <div className="p-4 bg-white rounded-lg shadow-md">
                                <QRCodeSVG
                                    ref={qrRef}
                                    value={shareLink}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                    imageSettings={{
                                        src: "/AceLogo.png", // Replace with your logo path
                                        x: undefined,
                                        y: undefined,
                                        height: 40,
                                        width: 40,
                                        excavate: true,
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleDownloadQR}
                                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Download QR Code
                            </button>
                        </div>
                    </div>
                </Box>
            </Modal>
        </div>
    );
};

export default ShareSurveyPopup;

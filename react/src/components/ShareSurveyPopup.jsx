import React, { useRef } from "react";
import { Box } from "@mui/material";
import Modal from "@mui/material/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Divider from "@mui/material/Divider";
import { useMediaQuery } from "@mui/material";
import { useStateContext } from "../contexts/ContextProvider";
import { QRCodeSVG } from "qrcode.react";

const ShareSurveyPopup = ({ openSharePopup, setOpenSharePopup, shareLink }) => {
    const handleClosePopup = () => setOpenSharePopup(false);
    const { showToast } = useStateContext();
    const isMobile = useMediaQuery("(max-width:600px)");
    const inputRef = useRef(null);
    const qrRef = useRef(null);

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

    const copyToClipboard = () => {
        if (inputRef.current) {
            inputRef.current.select();
            inputRef.current.setSelectionRange(0, 99999);
            const success = document.execCommand("copy");
            if (success) {
                showToast("Link copied to clipboard!");
                setOpenSharePopup(false);
            } else {
                showToast("Failed to copy. Please copy manually.");
            }
        }
    };

    const handleDownloadQR = () => {
        const svg = qrRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        const logo = new Image();
        const scale = 4;

        canvas.width = 300 * scale;
        canvas.height = 300 * scale;
        ctx.scale(scale, scale);

        img.onload = () => {
            ctx.drawImage(img, 0, 0, 300, 300);
            logo.onload = () => {
                const logoSize = 60;
                const centerX = (300 - logoSize) / 2;
                const centerY = (300 - logoSize) / 2;
                ctx.drawImage(logo, centerX, centerY, logoSize, logoSize);
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
        <Modal open={openSharePopup} onClose={handleClosePopup}>
            <Box className="bg-white rounded-xl" sx={dynamicPopupStyle}>
                <div className="relative mb-6">
                    <div className="absolute right-0 -top-3">
                        <ModalClose variant="outlined" onClick={handleClosePopup} />
                    </div>
                    <div className="mb-2 text-lg font-semibold text-center">Share this survey</div>
                </div>
                <Divider />
                <div className="mt-8">
                    <div className="flex gap-2 mb-6">
                        <input
                            ref={inputRef}
                            type="text"
                            value={shareLink}
                            readOnly
                            className="w-full p-2 border rounded-lg"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="w-20 p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                        >
                            Copy
                        </button>
                    </div>
                    <div className="flex flex-col items-center mt-4">
                        <div className="mb-4 text-gray-600">Scan QR Code</div>
                        <div className="p-6 bg-white rounded-lg shadow-md">
                            <QRCodeSVG
                                ref={qrRef}
                                value={shareLink}
                                size={300}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                    src: "/AceLogo.png",
                                    height: 60,
                                    width: 60,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <button
                            onClick={handleDownloadQR}
                            className="flex items-center gap-2 px-4 py-2 mt-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                        >
                            Download QR Code
                        </button>
                    </div>
                </div>
            </Box>
        </Modal>
    );
};

export default ShareSurveyPopup;

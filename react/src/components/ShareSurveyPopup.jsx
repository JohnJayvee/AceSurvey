import React, { useRef } from "react";
import { Box } from "@mui/material";
import Modal from "@mui/material/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Divider from "@mui/material/Divider";
import { useMediaQuery } from "@mui/material";
import { useStateContext } from "../contexts/ContextProvider";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardDocumentIcon, QrCodeIcon } from "@heroicons/react/24/outline";

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
        width: "min(90%, 600px)",
        maxHeight: isMobile ? "95vh" : "calc(100vh - 100px)",
        overflowY: "auto",
        bgcolor: 'transparent',
        border: 'none',
        outline: 'none',
        p: 0,
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
            <Box sx={dynamicPopupStyle}>
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-6 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
                    >
                        <div className="relative mb-6">
                            <div className="absolute right-0 -top-2">
                                <ModalClose
                                    variant="outlined"
                                    onClick={handleClosePopup}
                                    className="transition-transform hover:scale-110"
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-center text-gray-900">
                                Share Survey
                            </h2>
                            <p className="mt-2 text-sm text-center text-gray-500">
                                Share this survey with others using the link or QR code
                            </p>
                        </div>

                        <Divider className="mb-6" />

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-6"
                        >
                            <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                                <label className="block mb-2 text-sm font-medium text-gray-700">
                                    Survey Link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={shareLink}
                                        readOnly
                                        className="w-full px-4 py-2.5 text-gray-900 transition-all duration-200 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center gap-2 px-4 py-2.5 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                        <span className="hidden sm:inline">Copy</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="mb-4 text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <QrCodeIcon className="w-5 h-5" />
                                        <span>Scan QR Code</span>
                                    </div>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="p-6 bg-white border border-gray-100 shadow-lg rounded-xl"
                                >
                                    <QRCodeSVG
                                        ref={qrRef}
                                        value={shareLink}
                                        size={250}
                                        level="H"
                                        includeMargin={true}
                                        imageSettings={{
                                            src: "/AceLogo.png",
                                            height: 50,
                                            width: 50,
                                            excavate: true,
                                        }}
                                    />
                                </motion.div>
                                <button
                                    onClick={handleDownloadQR}
                                    className="flex items-center gap-2 px-6 py-2.5 mt-6 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download QR Code
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </Box>
        </Modal>
    );
};

export default ShareSurveyPopup;

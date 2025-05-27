import React, { useRef, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import Modal from "@mui/material/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Divider from "@mui/material/Divider";
import { useMediaQuery } from "@mui/material";
import { useStateContext } from "@context/ContextProvider";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardDocumentIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import acelogo from "@images/AceLogo.png"; // Make sure this file exists

console.log("Acelogo path:", acelogo); // Add this to verify the import

const ShareSurveyPopup = ({ openSharePopup, setOpenSharePopup, shareLink }) => {
    const handleClosePopup = () => setOpenSharePopup(false);
    const { showToast } = useStateContext();
    const isMobile = useMediaQuery("(max-width:600px)");
    const inputRef = useRef(null);
    const qrRef = useRef(null);
    const previousOpenState = useRef(false);



    // Memoize the style to prevent recalculation
    const dynamicPopupStyle = useMemo(() => ({
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: isMobile ? "95%" : "min(90%, 600px)",
        maxWidth: isMobile ? "95vw" : "600px",
        maxHeight: isMobile ? "90vh" : "calc(100vh - 100px)",
        overflowY: "auto",
        bgcolor: 'transparent',
        border: 'none',
        outline: 'none',
        p: 0,
        zIndex: 9999, // Ensure it's above other elements
    }), [isMobile]);

    const copyToClipboard = async () => {
        if (!inputRef.current) return;

        // Select the text
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, 99999);

        // Check if clipboard API is available and we're in a secure context
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(shareLink);
                showToast("Link copied to clipboard!");
                setOpenSharePopup(false);
                return;
            } catch (err) {
                console.warn("Clipboard API failed:", err);
                // Fall through to legacy method
            }
        }

        // Fallback for older browsers or non-secure contexts
        try {
            const success = document.execCommand("copy");
            if (success) {
                showToast("Link copied to clipboard!");
                setOpenSharePopup(false);
            } else {
                // Final fallback - show the text for manual copying
                showFallbackCopyDialog();
            }
        } catch (err) {
            console.warn("execCommand failed:", err);
            showFallbackCopyDialog();
        }
    };

    // Add this new function for the final fallback
    const showFallbackCopyDialog = () => {
        // Create a temporary element to show the link
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            max-width: 90%;
            word-break: break-all;
        `;

        tempDiv.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold;">Please copy manually:</div>
            <div style="background: #f3f4f6; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-family: monospace;">${shareLink}</div>
            <button onclick="this.parentElement.remove()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
        `;

        document.body.appendChild(tempDiv);

        // Auto remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
        }, 10000);

        showToast("Please copy the link manually");
    };

    const handleDownloadQR = () => {
        setTimeout(() => {
            const svg = qrRef.current;
            if (!svg) return;

            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            const logo = new Image();
            const scale = 4;

            canvas.width = 300 * scale;
            canvas.height = 300 * scale;
            ctx.scale(scale, scale);

            let imagesLoaded = 0;
            const totalImages = 2;

            function checkAllImagesLoaded() {
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    ctx.drawImage(img, 0, 0, 300, 300);

                    const logoSize = 60;
                    const centerX = (300 - logoSize) / 2;
                    const centerY = (300 - logoSize) / 2;
                    ctx.drawImage(logo, centerX, centerY, logoSize, logoSize);

                    const pngFile = canvas.toDataURL("image/png", 1.0);
                    const downloadLink = document.createElement("a");
                    downloadLink.download = "survey-qr-code.png";
                    downloadLink.href = pngFile;
                    downloadLink.click();
                }
            }

            img.onload = checkAllImagesLoaded;
            logo.onload = checkAllImagesLoaded;

            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
            logo.src = acelogo;
        }, 100);
    };

    // More stable animation variants with less bounce
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                damping: 30, // Increased damping to reduce bounce
                stiffness: 200, // Reduced stiffness for smoother motion
                mass: 0.8, // Increased mass for stability
                restDelta: 0.001 // More precise resting position
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.2,
                ease: "easeOut" // Explicit easing function
            }
        }
    };

    // Memoize QR code component
    const qrCodeComponent = useMemo(() => (
        <QRCodeSVG
            ref={qrRef}
            value={shareLink}
            size={250}
            level="H"
            includeMargin={true}
            imageSettings={{
                src: acelogo,
                height: 50,
                width: 50,
                excavate: true,
            }}
        />
    ), [shareLink]);

    return (
        <Modal
            open={openSharePopup}
            onClose={handleClosePopup}
            closeAfterTransition
            keepMounted={false}
            sx={{
                zIndex: 10000, // Higher than any sidebar
                '& .MuiBackdrop-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh'
                }
            }}
            BackdropProps={{
                sx: {
                    zIndex: 9999,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh'
                }
            }}
        >
            <Box sx={{
                ...dynamicPopupStyle,
                zIndex: 10001 // Even higher than backdrop
            }}>
                <AnimatePresence mode="wait">
                    {openSharePopup && (
                        <motion.div
                            key="modal-content"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout="position"
                            className="p-4 mx-2 bg-white border-0 shadow-xl sm:p-6 rounded-2xl backdrop-blur-xl sm:mx-0"
                            style={{
                                willChange: 'transform, opacity',
                                transformOrigin: 'center',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'translateZ(0)',
                                WebkitTransform: 'translateZ(0)',
                                position: 'relative',
                                margin: '0 auto',
                                maxWidth: '100%',
                                height: 'auto',
                                overflow: 'hidden',
                                width: '100%', // Ensure full width usage
                                boxSizing: 'border-box', // Include padding in width calculation
                                zIndex: 10002 // Highest z-index
                            }}
                        >
                            <div className="relative mb-4 sm:mb-6">
                                <div className="absolute right-0 -top-2">
                                    <ModalClose
                                        variant="outlined"
                                        onClick={handleClosePopup}
                                        className="transition-transform hover:scale-110"
                                        sx={{
                                            zIndex: 10,
                                            backgroundColor: 'white',
                                            '&:hover': {
                                                backgroundColor: '#f3f4f6'
                                            }
                                        }}
                                    />
                                </div>
                                <h2 className="pr-8 text-xl font-bold text-center text-gray-900 sm:text-2xl">
                                    Share Survey
                                </h2>
                                <p className="px-2 mt-2 text-xs text-center text-gray-500 sm:text-sm">
                                    Share this survey with others using the link or QR code
                                </p>
                            </div>

                            <Divider className="mb-4 sm:mb-6" />

                            <div className="space-y-4 sm:space-y-6">
                                <div className="p-3 border border-gray-100 sm:p-4 rounded-xl bg-gray-50">
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        Survey Link
                                    </label>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={shareLink}
                                            readOnly
                                            className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base text-gray-900 transition-all duration-200 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
                                        >
                                            <ClipboardDocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>Copy</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="mb-3 text-sm font-medium text-gray-700 sm:mb-4">
                                        <div className="flex items-center gap-2">
                                            <QrCodeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>Scan QR Code</span>
                                        </div>
                                    </div>
                                    <div
                                        className="p-3 bg-white border border-gray-100 shadow-lg sm:p-6 rounded-xl"
                                        style={{
                                            height: isMobile ? '220px' : '262px',
                                            width: isMobile ? '220px' : '262px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <QRCodeSVG
                                            ref={qrRef}
                                            value={shareLink}
                                            size={isMobile ? 200 : 250}
                                            level="H"
                                            includeMargin={true}
                                            imageSettings={{
                                                src: acelogo,
                                                height: isMobile ? 40 : 50,
                                                width: isMobile ? 40 : 50,
                                                excavate: true,
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleDownloadQR}
                                        className="flex items-center gap-2 px-4 sm:px-6 py-2.5 mt-4 sm:mt-6 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base"
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download QR Code
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
        </Modal>
    );
};

export default React.memo(ShareSurveyPopup);

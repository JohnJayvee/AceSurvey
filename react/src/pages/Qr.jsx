import { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStateContext } from '@context/ContextProvider';
import { ClipboardDocumentIcon, QrCodeIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import acelogo from '@images/AceLogo.png';

const QRPage = () => {
   const { showToast } = useStateContext();
   const qrRef = useRef(null);
   const url = window.location.origin + '/survey-selection';

   const copyToClipboard = useCallback(async () => {
      try {
         await navigator.clipboard.writeText(url);
         showToast('URL copied to clipboard!');
      } catch (err) {
         showToast('Failed to copy URL');
      }
   }, [url, showToast]);

   const handleDownloadQR = useCallback(() => {
      const svg = qrRef.current;
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const logo = new Image();
      const scale = 4;

      canvas.width = 300 * scale;
      canvas.height = 300 * scale;
      ctx.scale(scale, scale);

      let imagesLoaded = 0;
      const totalImages = 2;

      const checkAllImagesLoaded = () => {
         imagesLoaded++;
         if (imagesLoaded === totalImages) {
            ctx.drawImage(img, 0, 0, 300, 300);
            const logoSize = 60;
            const centerX = (300 - logoSize) / 2;
            const centerY = (300 - logoSize) / 2;
            ctx.drawImage(logo, centerX, centerY, logoSize, logoSize);

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = 'acesurvey-hub-qr.png';
            downloadLink.href = pngFile;
            downloadLink.click();
            showToast('QR Code downloaded!');
         }
      };

      img.onload = checkAllImagesLoaded;
      logo.onload = checkAllImagesLoaded;
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      logo.src = acelogo;
   }, [showToast]);

   return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-50 via-white to-blue-50 md:p-8">
         {/* Header */}
         <div className="mb-12 text-center md:mb-16">
            <img
               src="/AceLogo.png"
               alt="AceSurvey Logo"
               className="w-24 h-24 mx-auto mb-6 shadow-2xl md:w-32 md:h-32 rounded-2xl drop-shadow-2xl animate-bounce-slow"
            />
            <h1 className="mb-4 text-4xl font-black text-transparent md:text-6xl bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text drop-shadow-2xl">
               AceSurvey Hub QR
            </h1>
            <p className="max-w-2xl mx-auto text-xl font-light leading-relaxed text-gray-600 md:text-2xl">
               Scan this QR code with your phone to access the survey selection hub
            </p>
         </div>

         {/* QR Container */}
         <div className="w-full max-w-md p-8 mb-12 border shadow-2xl bg-white/80 backdrop-blur-xl border-white/50 rounded-3xl md:p-12 md:mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
               <QrCodeIcon className="w-6 h-6 text-blue-600" />
               <span className="font-semibold text-gray-700">Scan QR Code</span>
            </div>
            <div className="flex items-center justify-center p-6 mb-8 border-4 border-gray-100 shadow-inner bg-gradient-to-b from-white to-gray-50 rounded-2xl">
               <QRCodeSVG
                  ref={qrRef}
                  value={url}
                  size={256}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                     src: acelogo,
                     height: 56,
                     width: 56,
                     excavate: true,
                  }}
               />
            </div>
         </div>

         {/* Actions */}
         <div className="flex flex-col w-full max-w-md gap-4 sm:flex-row">
            <button
               onClick={copyToClipboard}
               className="flex items-center justify-center flex-1 gap-3 px-6 py-4 font-semibold text-gray-700 transition-all duration-300 border-2 border-gray-200 bg-white/70 hover:bg-white hover:border-blue-300 hover:shadow-xl rounded-2xl backdrop-blur-sm hover:scale-105"
            >
               <ClipboardDocumentIcon className="w-5 h-5" />
               Copy URL
            </button>
            <button
               onClick={handleDownloadQR}
               className="flex items-center justify-center flex-1 gap-3 px-6 py-4 font-semibold text-white transition-all duration-300 shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-2xl rounded-2xl backdrop-blur-sm hover:scale-105"
            >
               <ArrowDownTrayIcon className="w-5 h-5" />
               Download QR
            </button>
         </div>

         {/* Phone Preview */}
         <div className="mt-16 opacity-75">
            <DevicePhoneMobileIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-center text-gray-500">Open camera app on your phone and point at QR code</p>
         </div>

         <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
      </div>
   );
};

export default QRPage;


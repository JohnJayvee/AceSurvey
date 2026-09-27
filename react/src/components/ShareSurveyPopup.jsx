import { useEffect, useId, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { QRCodeSVG } from 'qrcode.react';
import logo from '@images/AceLogo.png';
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, CheckIcon, ClipboardDocumentIcon, ShareIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ShareSurveyPopup({ openSharePopup, setOpenSharePopup, shareLink }) {
   const id = useId();
   const inputRef = useRef(null);
   const qrRef = useRef(null);
   const [copied, setCopied] = useState(false);
   const [message, setMessage] = useState('');
   const [downloading, setDownloading] = useState(false);
   const [copying, setCopying] = useState(false);
   useEffect(() => { setCopied(false); setMessage(''); }, [openSharePopup, shareLink]);
   const close = () => setOpenSharePopup(false);

   const copy = async () => {
      if (copying || !shareLink) return;
      setCopying(true);
      setMessage('');
      let success = false;
      try {
         if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareLink);
            success = true;
         }
      } catch { /* Use the selected input if clipboard permissions are unavailable. */ }
      if (!success) {
         inputRef.current?.focus();
         inputRef.current?.select();
         try { success = document.execCommand('copy'); } catch { success = false; }
      }
      setCopied(success);
      setMessage(success ? 'Survey link copied. Ready to share!' : 'Copy is unavailable. Select the link above and copy it manually.');
      setCopying(false);
   };

   const downloadQR = async () => {
      if (!qrRef.current || downloading) return;
      setDownloading(true);
      setMessage('');
      let source;
      try {
         // Embed the logo so the downloaded SVG rasterizes without external assets.
         const logoResponse = await fetch(logo);
         if (!logoResponse.ok) throw new Error('Logo unavailable');
         const logoBlob = await logoResponse.blob();
         const logoData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(logoBlob);
         });
         const qr = qrRef.current.cloneNode(true);
         const logoElement = qr.querySelector('image');
         if (!logoElement) throw new Error('QR logo unavailable');
         logoElement.setAttribute('href', logoData);
         logoElement.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', logoData);
         const svg = new XMLSerializer().serializeToString(qr);
         source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
         const image = new Image();
         await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = source; });
         const canvas = document.createElement('canvas');
         canvas.width = canvas.height = 1200;
         const context = canvas.getContext('2d');
         if (!context) throw new Error('Canvas unavailable');
         context.fillStyle = '#ffffff';
         context.fillRect(0, 0, 1200, 1200);
         context.drawImage(image, 0, 0, 1200, 1200);
         const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
         if (!blob) throw new Error('Image unavailable');
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = 'survey-qr-code.png';
         document.body.appendChild(link);
         link.click();
         link.remove();
         setTimeout(() => URL.revokeObjectURL(url), 60000);
         setMessage('QR code download started.');
      } catch {
         setMessage('Could not download the QR code. Please try again.');
      } finally {
         if (source) URL.revokeObjectURL(source);
         setDownloading(false);
      }
   };

   return <Dialog open={Boolean(openSharePopup)} onClose={close} aria-labelledby={id + '-title'} aria-describedby={id + '-description'} maxWidth="sm" fullWidth PaperProps={{ className: 'share-dialog', sx: { borderRadius: '20px', margin: '16px', width: 'calc(100% - 32px)', maxHeight: 'calc(100dvh - 32px)' } }}>
      <div className="share-dialog-heading"><div className="share-dialog-symbol"><ShareIcon /></div><button type="button" className="share-dialog-close" aria-label="Close share survey" onClick={close}><XMarkIcon /></button><span className="ace-eyebrow">INVITE A LITTLE PERSPECTIVE</span><h2 id={id + '-title'}>Share your survey</h2><p id={id + '-description'}>Send a link or let people scan the code.<br />Every response starts a conversation.</p></div>
      <div className="share-dialog-body">
         <label htmlFor={id + '-link'} className="share-field-label">Survey link</label>
         <div className="share-link-field"><input id={id + '-link'} ref={inputRef} value={shareLink || ''} readOnly onFocus={event => event.target.select()} /><button type="button" onClick={copy} disabled={!shareLink || copying}>{copied ? <CheckIcon /> : <ClipboardDocumentIcon />}{copying ? 'Copying...' : copied ? 'Copied' : 'Copy link'}</button></div>
         <div className="share-divider"><span />or share with a scan<span /></div>
         <div className="share-qr-section"><div className="share-qr-frame">{shareLink && <QRCodeSVG ref={qrRef} value={shareLink} size={200} imageSettings={{ src: logo, width: 40, height: 40, excavate: true }} level="H" marginSize={4} bgColor="#ffffff" fgColor="#172c22" title="Scan to open this survey" />}</div><h3>A quick scan. A meaningful response.</h3><p>Download the QR code for posters, handouts, or presentations.</p><button className="ace-button ace-button-secondary" type="button" onClick={downloadQR} disabled={downloading || !shareLink}><ArrowDownTrayIcon />{downloading ? 'Preparing image...' : 'Download QR code'}</button></div>
         <p className="share-feedback" role="status" aria-live="polite">{message}</p>
      </div>
      <footer className="share-dialog-footer">{shareLink && <a href={shareLink} target="_blank" rel="noopener noreferrer">Open survey<ArrowTopRightOnSquareIcon /></a>}<button type="button" onClick={close}>Done</button></footer>
   </Dialog>;
}

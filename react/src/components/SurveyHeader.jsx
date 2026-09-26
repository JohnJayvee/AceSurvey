import { ArrowLeftIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
export default function SurveyHeader({ title, id, onGoBack, onDownload }) {
   return <div className="ace-page-heading"><div>{onGoBack && <button className="ace-back-link" onClick={onGoBack} type="button"><ArrowLeftIcon />Back to surveys</button>}<span className="ace-eyebrow">{title ? 'RESPONSE EXPLORER' : 'SURVEY BUILDER'}</span><h1>{title || (id ? 'A fresh perspective starts here.' : 'Create something worth asking.')}</h1><p>{title ? 'Explore what people have shared with you.' : 'Shape your questions, then share them with your community.'}</p></div>{onDownload && <button className="ace-button ace-button-secondary" onClick={onDownload}><ArrowDownTrayIcon />Export CSV</button>}</div>;
}

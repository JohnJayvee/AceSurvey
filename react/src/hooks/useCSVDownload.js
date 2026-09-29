import { useCallback, useRef, useState } from 'react';
import axiosClient from '@api/axios';

export const useCSVDownload = (survey) => {
   const [exporting, setExporting] = useState(false);
   const [exportError, setExportError] = useState('');
   const pending = useRef(false);
   const downloadCSV = useCallback(async () => {
      if (!survey?.id || pending.current) return;
      pending.current = true;
      setExporting(true);
      setExportError('');
      try {
         const { data } = await axiosClient.get('/survey/' + survey.id + '/export', { responseType: 'blob', cache: false, timeout: 120000 });
         const url = URL.createObjectURL(data);
         const link = document.createElement('a');
         link.href = url;
         // Control characters are deliberately excluded from downloaded filenames.
         // eslint-disable-next-line no-control-regex
         link.download = (survey.title || 'survey').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 120) + '_responses.csv';
         document.body.appendChild(link);
         link.click();
         link.remove();
         setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (error) {
         setExportError(error.response?.status === 403 ? 'You do not have permission to export this survey.' : 'Export failed. Please try again.');
      } finally {
         pending.current = false;
         setExporting(false);
      }
   }, [survey]);
   return { downloadCSV, exporting, exportError };
};

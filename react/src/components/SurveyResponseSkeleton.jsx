import PropTypes from 'prop-types';
const Bar = ({ className = '' }) => <div className={'response-placeholder ' + className} />;
Bar.propTypes = {
   className: PropTypes.string,
};


export default function SurveyResponseSkeleton() {
   return <div className="ace-responses-page" role="status" aria-busy="true" aria-label="Loading survey responses">
      <span className="sr-only">Loading survey responses...</span>
      <div aria-hidden="true">
         <div className="ace-page-heading"><div className="response-skeleton-heading"><Bar className="w-28 h-3 mb-5" /><Bar className="w-36 h-3 mb-3" /><Bar className="w-80 max-w-full h-8 mb-3" /><Bar className="w-64 max-w-full h-3" /></div><Bar className="w-36 h-11" /></div>
         <div className="grid gap-4 sm:gap-6">
            <div className="response-metrics">{Array.from({ length: 4 }, (_, index) => <article key={index}><Bar className="w-24 max-w-full h-3" /><Bar className="w-16 h-10" /><Bar className="w-32 max-w-full h-3" /></article>)}</div>
            <div className="response-overview">
               <section className="response-panel"><div className="response-panel-heading"><div><Bar className="w-32 h-3 mb-3" /><Bar className="w-40 h-5" /></div><Bar className="w-20 h-6" /></div><div className="response-bars">{Array.from({ length: 5 }, (_, index) => <div key={index} className="response-bar-row"><Bar className="w-full h-3" /><Bar className="w-full h-2" /><Bar className="w-full h-3" /><Bar className="w-full h-3" /></div>)}</div></section>
               <section className="response-panel response-about"><Bar className="w-28 h-3 mb-3" /><Bar className="w-40 h-5 mb-5" /><Bar className="w-full h-3 mb-3" /><Bar className="w-3/4 h-3 mb-6" /><div className="border-t pt-4 space-y-3"><Bar className="w-full h-3" /><Bar className="w-full h-3" /></div></section>
            </div>
            <section className="response-panel response-inbox">
               <div className="response-panel-heading"><div><Bar className="w-40 h-5 mb-3" /><Bar className="w-52 max-w-full h-3" /></div><Bar className="response-skeleton-search h-10" /></div>
               <div className="response-table-wrap"><table><thead><tr><th><Bar className="w-20 h-3" /></th><th><Bar className="w-20 h-3" /></th><th><Bar className="w-14 h-3 ml-auto" /></th></tr></thead><tbody>{Array.from({ length: 5 }, (_, index) => <tr key={index}><td><div className="response-identity"><Bar className="response-avatar" /><div><Bar className="w-28 sm:w-44 h-3 mb-2" /><Bar className="w-20 h-2" /></div></div></td><td><Bar className="w-24 h-3 mb-2" /><Bar className="w-14 h-2" /></td><td><Bar className="w-20 h-3 ml-auto" /></td></tr>)}</tbody></table></div>
               <div className="response-pagination"><Bar className="w-36 h-3" /><Bar className="w-44 h-8" /></div>
            </section>
         </div>
      </div>
   </div>;
}

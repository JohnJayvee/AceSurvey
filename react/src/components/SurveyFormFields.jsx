import { PhotoIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default function SurveyFormFields({ survey, setSurvey, updateSurveyField, onImageChange, logo }) {
   const change = (key, value) => updateSurveyField ? updateSurveyField(key, value) : setSurvey(previous => ({ ...previous, [key]: value }));
   const expires = survey.expire_date !== null && survey.expire_date !== undefined;
   const defaultDate = () => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
   };
   return <section className="builder-settings">
      <div className="builder-section-title"><span>01</span><div><h2>The essentials</h2><p>Give your survey a clear purpose and a welcoming introduction.</p></div></div>
      <div className="builder-settings-grid">
         <div className="builder-cover"><div className="builder-cover-preview"><img src={survey.image_url || logo} alt="Survey cover" /></div><label className="builder-upload"><PhotoIcon />Choose cover image<input type="file" accept="image/*" onChange={onImageChange} aria-label="Choose survey cover image" /></label><p>This image appears at the top of your public survey.</p>{survey.slug && <a href={'/survey/public/' + survey.slug} target="_blank" rel="noopener noreferrer">Preview survey<ArrowTopRightOnSquareIcon /></a>}</div>
         <div className="builder-fields">
            <div><label htmlFor="survey-title">Survey title <span>*</span></label><input id="survey-title" type="text" required maxLength={255} placeholder="Give your survey a name" value={survey.title || ''} onChange={event => change('title', event.target.value)} /></div>
            <div><label htmlFor="survey-description">Description <small>Optional</small></label><textarea id="survey-description" rows={4} placeholder="Tell people what this survey is about and why their feedback matters." value={survey.description || ''} onChange={event => change('description', event.target.value)} /></div>
            <div className="builder-settings-pair">
               <div className="builder-setting"><label className="builder-check"><input type="checkbox" checked={Boolean(survey.status)} onChange={event => change('status', event.target.checked)} /><span>Accept responses</span></label><p>{survey.status ? 'Open to respondents while the survey is not expired.' : 'Respondents cannot submit answers while this is off.'}</p></div>
               <div className="builder-setting"><label className="builder-check"><input type="checkbox" checked={expires} onChange={event => change('expire_date', event.target.checked ? defaultDate() : null)} /><span>Set an expiration</span></label>{expires ? <><label className="sr-only" htmlFor="survey-expiration">Expiration date</label><input id="survey-expiration" type="date" required value={survey.expire_date || ''} onChange={event => change('expire_date', event.target.value)} /><p>Open through the end of this date.</p></> : <p>No expiration. Close the survey whenever you are ready.</p>}</div>
            </div>
         </div>
      </div>
   </section>;
}
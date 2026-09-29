import { useEffect, useState } from 'react';
import { useAppearance } from '@context/AppearanceProvider';
import { useStateContext } from '@context/ContextProvider';
import { DEFAULT_COLOR, validColor } from '../utils/palette';

const presets = [['Teal', '#107e72'], ['Sage', '#658b50'], ['Ocean', '#2563eb'], ['Violet', '#7c3aed'], ['Rose', '#be185d'], ['Amber', '#b45309'], ['Slate', '#475569']];
export default function Settings() {
   const { color, changeColor, saveError } = useAppearance();
   const { showToast } = useStateContext();
   const [custom, setCustom] = useState(color);
   useEffect(() => setCustom(color), [color]);
   const [error, setError] = useState('');
   const choose = (value, notify = true) => {
      const saved = changeColor(value);
      setCustom(value);
      setError('');
      if (notify) {
         showToast(saved ? 'Color palette saved successfully.' : 'Color applied, but could not be saved in this browser.', saved ? 'success' : 'warning');
      }
   };
   return <section className="max-w-4xl">
      <div className="ace-page-heading"><div><span className="ace-eyebrow">MAKE IT YOURS</span><h1>Appearance settings</h1><p>Choose the colors you want to see across AceSurvey.</p></div></div>
      <div className="response-panel space-y-6"><div><h2>Color palette</h2><p className="mt-2 text-sm text-gray-500">Changes apply immediately to every page in this browser, including public surveys. This personal preference does not change what other people see.</p></div>
         <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{presets.map(([name, value]) => <button key={name} type="button" aria-pressed={color.toLowerCase() === value} onClick={() => choose(value)} className="flex items-center gap-3 p-3 border rounded-lg" style={{ borderColor: color.toLowerCase() === value ? 'var(--ace-accent)' : undefined }}><span className="w-7 h-7 rounded-full shrink-0" style={{ background: value }} /><span>{name}</span></button>)}</div>
         <form onSubmit={event => { event.preventDefault(); if (validColor(custom)) choose(custom); else setError('Enter a six-digit hex color, such as #107e72.'); }}>
            <label htmlFor="custom-palette" className="block mb-2 text-sm font-medium">Custom color</label><div className="flex flex-wrap items-center gap-3"><input type="color" aria-label="Choose a custom color" value={color} onChange={event => choose(event.target.value, false)} className="w-12 h-11 p-1 bg-white border rounded-lg" /><input id="custom-palette" value={custom} onChange={event => setCustom(event.target.value)} spellCheck={false} maxLength={7} placeholder="#107e72" className="w-36 p-3 border rounded-lg" aria-invalid={Boolean(error)} aria-describedby={error ? 'palette-error' : undefined} /><button className="ace-button" type="submit">Apply color</button></div>{error && <p id="palette-error" role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
         </form>
         <p className="text-sm text-gray-500">Backgrounds, buttons, charts, and highlights use matching shades. Your exact hex color is used for primary controls, with light or dark text for readability.</p>
         {saveError && <p role="alert">{saveError}</p>}
         <div className="flex items-center justify-between gap-4 pt-4 border-t"><span className="ace-status active">Live preview</span><button type="button" className="ace-button ace-button-secondary" onClick={() => choose(DEFAULT_COLOR)}>Reset to default</button></div>
      </div>
   </section>;
}

import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DEFAULT_COLOR, PALETTE_KEY, paletteFromColor, validColor } from '../utils/palette';

const AppearanceContext = createContext(null);
// The consumer hook shares this module's private context.
// eslint-disable-next-line react-refresh/only-export-components
export const useAppearance = () => useContext(AppearanceContext);

export default function AppearanceProvider({ children }) {
   const [color, setColor] = useState(() => {
      try { const saved = localStorage.getItem(PALETTE_KEY); return validColor(saved) ? saved : DEFAULT_COLOR; }
      catch { return DEFAULT_COLOR; }
   });
   const [saveError, setSaveError] = useState('');
   const palette = useMemo(() => paletteFromColor(color), [color]);
   useEffect(() => {
      const sync = event => {
         if (event.key === PALETTE_KEY) setColor(validColor(event.newValue) ? event.newValue : DEFAULT_COLOR);
      };
      window.addEventListener('storage', sync);
      return () => window.removeEventListener('storage', sync);
   }, []);
   useLayoutEffect(() => {
      const style = document.documentElement.style;
      style.setProperty('--palette-hue', palette.hue);
      style.setProperty('--palette-saturation', palette.saturation + '%');
      style.setProperty('--ace-accent', palette.primary);
      for (const [shade, light] of Object.entries({ 50: 97, 100: 93, 200: 85, 300: 74, 400: 59, 500: 43, 600: 34, 700: 28, 800: 22, 900: 16 })) {
         style.setProperty('--palette-' + shade, `${palette.hue} ${palette.saturation}% ${light}%`);
      }
      style.setProperty('--palette-600', palette.primary.slice(4, -1).replaceAll(',', ''));
   }, [palette]);
   const theme = useMemo(() => createTheme({
      palette: { primary: { main: palette.primary }, background: { default: `hsl(${palette.hue}, 15%, 97%)` }, text: { primary: `hsl(${palette.hue}, 22%, 20%)`, secondary: '#65736c' } },
      typography: { fontFamily: '"Segoe UI", ui-sans-serif, system-ui, sans-serif', fontSize: 13 },
      shape: { borderRadius: 10 },
      components: { MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, boxShadow: 'none' } } }, MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } } },
   }), [palette]);
   const changeColor = value => {
      if (!validColor(value)) return false;
      setColor(value);
      try { localStorage.setItem(PALETTE_KEY, value); setSaveError(''); return true; }
      catch { setSaveError('Color applied, but this browser could not save it for your next visit.'); return false; }
   };
   return <AppearanceContext.Provider value={{ color, changeColor, saveError }}><ThemeProvider theme={theme}>{children}</ThemeProvider></AppearanceContext.Provider>;
}
AppearanceProvider.propTypes = {
   children: PropTypes.node,
};

export const DEFAULT_COLOR = '#107e72';
export const PALETTE_KEY = 'acesurvey-appearance';
export const validColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export function paletteFromColor(value) {
   const color = validColor(value) ? value : DEFAULT_COLOR;
   const [r, g, b] = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16) / 255);
   const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
   const light = (max + min) / 2;
   let hue = 0;
   if (delta) hue = max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
   const saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) * 100 : 0;
   // Preserve the selected RGB color; choose the label color instead of altering it.
   const linear = [r, g, b].map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
   const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
   const contrastText = (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff';
   return { color, hue: hue * 60, saturation, primary: color, channels: `${hue * 60} ${saturation}% ${light * 100}%`, contrastText };
}

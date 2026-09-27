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
   // Keep primary controls dark enough for their white labels, even with a very light custom color.
   let primaryLight = Math.min(38, Math.max(24, light * 100));
   const luminance = percentage => {
      const l = percentage / 100;
      const a = saturation / 100 * Math.min(l, 1 - l);
      const channel = n => {
         const k = (n + hue * 2) % 12;
         const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
         return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4);
   };
   while (primaryLight > 1 && (1.05 / (luminance(primaryLight) + 0.05)) < 4.5) primaryLight--;
   const primary = `hsl(${Math.round(hue * 60)}, ${Math.round(saturation)}%, ${primaryLight}%)`;
   return { color, hue: Math.round(hue * 60), saturation: Math.round(saturation), primary };
}

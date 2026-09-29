import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paletteFromColor, validColor, DEFAULT_COLOR } from '../src/utils/palette.js';

test('palette validates custom colors and safely falls back for invalid saved preferences', () => {
   assert.equal(validColor('#AABBCC'), true);
   for (const value of ['red', '#123', 'url(test)', null, {}]) {
      assert.equal(validColor(value), false);
      assert.equal(paletteFromColor(value).color, DEFAULT_COLOR);
   }
});


test('primary colors preserve exact custom and preset hex values', () => {
   for (const color of ['#ffffff', '#000000', '#00ff00', '#ff0000', '#123abc', '#658b50', '#2563eb', '#AABBCC']) {
      assert.equal(paletteFromColor(color).primary, color);
   }
   assert.equal(paletteFromColor('#00ff00').hue, 120);
   assert.equal(paletteFromColor('#0000ff').hue, 240);
   assert.equal(paletteFromColor('#ffffff').saturation, 0);
});

test('labels have at least 4.5:1 contrast without changing the primary color', () => {
   for (const color of ['#ffffff', '#000000', '#00ff00', '#ff0000', '#123abc', '#658b50', '#2563eb', '#ffff00', '#777777']) {
      const channels = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255)
         .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      const l = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      const contrast = paletteFromColor(color).contrastText === '#000000' ? (l + 0.05) / 0.05 : 1.05 / (l + 0.05);
      assert.ok(contrast >= 4.5, color);
   }
});

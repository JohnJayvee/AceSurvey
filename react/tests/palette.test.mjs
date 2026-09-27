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

test('palette supports different hues and neutral colors with readable primary shades', () => {
   assert.equal(paletteFromColor('#ff0000').hue, 0);
   assert.equal(paletteFromColor('#00ff00').hue, 120);
   assert.equal(paletteFromColor('#0000ff').hue, 240);
   assert.equal(paletteFromColor('#ffffff').saturation, 0);
   assert.equal(paletteFromColor('#ffffff').primary, 'hsl(0, 0%, 38%)');
   assert.equal(paletteFromColor('#000000').primary, 'hsl(0, 0%, 24%)');
   assert.ok(Number(paletteFromColor('#00ff00').primary.match(/, ([\d.]+)%\)/)[1]) < 34);
});

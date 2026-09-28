import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMonthlyData, getActivityYears } from '../src/utils/dashboardUtils.js';

const stats = [
   { month: '2024-03', surveys: 1, responses: 3 },
   { month: '2026-03', surveys: 1, responses: '7' },
   { month: '2026-03', surveys: 1, responses: 2 },
   { month: 'invalid', surveys: 1, responses: 99 },
];

test('activity years include the current year and empty years back to earliest activity', () => {
   assert.deepEqual(getActivityYears(stats, 2026), [2026, 2025, 2024]);
   assert.deepEqual(getActivityYears([], 2027), [2027]);
});

test('activity filters years independently, sums numeric counts, and fills missing months', () => {
   const current = generateMonthlyData(stats, 2026);
   assert.equal(current.length, 12);
   assert.deepEqual(current[2], { name: 'March', surveys: 2, responses: 9 });
   assert.equal(generateMonthlyData(stats, 2024)[2].responses, 3);
   assert.ok(generateMonthlyData(stats, 2025).every(item => item.surveys === 0 && item.responses === 0));
});

test('activity defaults to the calendar year without a hardcoded year', () => {
   const year = new Date().getFullYear();
   const data = generateMonthlyData([
      { month: `${year}-06`, responses: 5 },
      { month: `${year - 1}-06`, responses: 20 },
   ]);
   assert.equal(data[5].responses, 5);
});

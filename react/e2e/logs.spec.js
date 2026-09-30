import { test, expect } from '@playwright/test';

const user = { id: 1, name: 'Alex Morgan', email: 'alex@example.com', is_admin: true };
const events = [
   { id: 106, level: 'error', action: 'survey_update_error', message: 'A survey update could not be completed.', created_at: '2026-09-30T09:42:18Z', user, ip_address: '127.0.0.1', context: { survey_id: 7 } },
   { id: 105, level: 'info', action: 'login_success', message: 'User signed in successfully.', created_at: '2026-09-30T09:41:02Z', user },
   { id: 104, level: 'warning', action: 'login_failed', message: 'Sign-in attempt rejected: invalid credentials.', created_at: '2026-09-30T09:40:14Z', user: null },
   { id: 103, level: 'info', action: 'survey_created', message: 'Customer experience survey created.', created_at: '2026-09-30T09:38:24Z', user },
];

async function setup(page) {
   const state = { requests: [], fail: false };
   await page.addInitScript(user => { sessionStorage.setItem('TOKEN', 'test-token'); sessionStorage.setItem('CURRENT_USER', JSON.stringify(user)); }, user);
   await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      if (!url.pathname.startsWith('/api/')) return route.fallback();
      if (url.pathname === '/api/me') return route.fulfill({ json: user });
      if (url.pathname === '/api/logs') {
         state.requests.push(url);
         if (state.fail) return route.fulfill({ status: 500, json: { message: 'Unavailable' } });
         const level = url.searchParams.get('level');
         const data = level ? events.filter(event => event.level === level) : events;
         return route.fulfill({ json: { data, total: 124, from: 1, to: data.length, current_page: Number(url.searchParams.get('page') || 1), last_page: 3 } });
      }
      return route.fulfill({ json: {} });
   });
   await page.goto('/logs');
   await expect(page.getByRole('heading', { name: /Activity monitor/ })).toBeVisible();
   await expect(page.getByText('Auto-refresh on', { exact: true })).toBeVisible();
   return state;
}

test('monitor shows scoped counts, event details and responsive layouts', async ({ page }) => {
   await page.setViewportSize({ width: 1440, height: 1080 });
   await setup(page);
   await expect(page.locator('.logs-summary-card').first()).toContainText('124');
   await expect(page.locator('.logs-summary-card.error')).toContainText('1');
   await expect(page.locator('.logs-summary-card.warning')).toContainText('Events on this page');
   await page.screenshot({ path: 'test-results/logs-desktop.png', fullPage: true });
   await page.locator('summary').first().click();
   await expect(page.getByText('127.0.0.1', { exact: true })).toBeVisible();
   await expect(page.getByLabel('Event context')).toContainText('survey_id');
   await page.setViewportSize({ width: 375, height: 812 });
   await page.screenshot({ path: 'test-results/logs-mobile.png', fullPage: true });
   expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('automatic refresh can pause and failed refresh preserves the last sync', async ({ page }) => {
   await page.clock.install();
   const state = await setup(page);
   const before = state.requests.length;
   await page.clock.fastForward(31000);
   await expect.poll(() => state.requests.length).toBeGreaterThan(before);
   await expect(page.getByText('Auto-refresh on', { exact: true })).toBeVisible();
   await page.getByRole('button', { name: 'Pause auto-refresh' }).click();
   const paused = state.requests.length;
   await page.clock.fastForward(61000);
   expect(state.requests.length).toBe(paused);
   state.fail = true;
   await page.getByRole('button', { name: 'Refresh', exact: true }).click();
   await expect(page.getByRole('alert')).toContainText('Displaying the last successful sync');
   await expect(page.getByRole('cell', { name: /login_success/ })).toBeVisible();
});

test('severity and date filters reach the API and historical pages pause polling', async ({ page }) => {
   const state = await setup(page);
   await page.getByRole('button', { name: 'Errors', exact: true }).click();
   await expect.poll(() => state.requests.at(-1).searchParams.get('level')).toBe('error');
   await page.getByLabel('Event type', { exact: true }).fill('survey_update_error');
   await page.getByLabel('From date').fill('2026-09-01');
   await page.getByLabel('To date').fill('2026-09-30');
   await page.getByRole('button', { name: 'Apply filters' }).click();
   await expect.poll(() => state.requests.at(-1).searchParams.get('action')).toBe('survey_update_error');
   expect(state.requests.at(-1).searchParams.get('from')).toBe('2026-09-01');
   await page.getByRole('button', { name: 'Next page' }).click();
   await expect(page.getByText('Auto-refresh paused', { exact: true })).toBeVisible();
   expect(state.requests.at(-1).searchParams.get('page')).toBe('2');
   await page.getByRole('button', { name: 'Clear', exact: true }).click();
   await expect.poll(() => state.requests.at(-1).searchParams.get('level')).toBeNull();
   expect(state.requests.at(-1).searchParams.get('page')).toBe('1');
});

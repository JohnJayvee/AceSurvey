import { test, expect } from '@playwright/test';

const surveys = [
   { id: 7, title: 'Customer experience', description: 'Help us understand the moments that made a difference in your experience.', slug: 'customer', status: true, expire_date: null, answers_count: 128, questions: [{ id: 1 }], can_manage: true },
   { id: 8, title: 'Team pulse check', description: 'A little time to reflect on how we work, connect, and grow together.', slug: 'team', status: false, expire_date: null, answers_count: 42, questions: [{ id: 2 }], can_manage: false },
   { id: 9, title: 'Your campus, your voice', description: 'Share your thoughts on campus life and the spaces that matter to you.', slug: 'campus', status: true, expire_date: '2020-01-01', answers_count: 86, questions: [{ id: 3 }], can_manage: true },
];
async function setup(page) {
   const queries = [];
   await page.addInitScript(() => {
      sessionStorage.setItem('TOKEN', 'test');
      sessionStorage.setItem('CURRENT_USER', JSON.stringify({ id: 1, name: 'Alex Morgan', is_admin: true }));
   });
   await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      if (!url.pathname.startsWith('/api/')) return route.fallback();
      if (url.pathname === '/api/me') return route.fulfill({ json: { id: 1, name: 'Alex Morgan', is_admin: true } });
      if (url.pathname === '/api/survey') {
         queries.push(url);
         const current = Number(url.searchParams.get('page') || 1);
         const data = url.searchParams.get('search') ? [{ ...surveys[0], title: 'Remote result', id: 10 }] : surveys;
         return route.fulfill({ json: { data, meta: { total: 18, current_page: current, last_page: 2, links: [{ label: 'Previous', url: current === 1 ? null : '/api/survey?page=1' }, { label: '1', url: '/api/survey?page=1', active: current === 1 }, { label: '2', url: '/api/survey?page=2', active: current === 2 }, { label: 'Next', url: current === 2 ? null : '/api/survey?page=2' }] } } });
      }
      return route.fulfill({ json: {} });
   });
   await page.goto('/surveys');
   await expect(page.getByRole('heading', { name: 'Customer experience' })).toBeVisible();
   return queries;
}

test('redesigned survey collection is responsive and preserves actions and permissions', async ({ page }) => {
   await page.setViewportSize({ width: 1440, height: 1040 });
   await setup(page);
   await expect(page.getByRole('link', { name: 'Create survey', exact: true })).toHaveAttribute('href', '/surveys/create');
   await expect(page.getByRole('button', { name: 'Delete Team pulse check' })).toHaveCount(0);
   await expect(page.getByRole('link', { name: 'Responses for Customer experience' })).toHaveAttribute('href', '/surveys/7/responses');
   await page.screenshot({ path: 'test-results/surveys-desktop.png', fullPage: true });
   await page.setViewportSize({ width: 375, height: 812 });
   await page.screenshot({ path: 'test-results/surveys-mobile.png', fullPage: true });
   expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
   await page.getByRole('button', { name: 'Share Customer experience' }).click();
   await expect(page.getByRole('dialog')).toBeVisible();
});

test('search queries the API and remains applied through pagination', async ({ page }) => {
   const queries = await setup(page);
   await page.getByRole('searchbox', { name: 'Search surveys' }).fill('remote');
   await expect(page.getByRole('heading', { name: 'Remote result' })).toBeVisible();
   expect(queries.at(-1).searchParams.get('search')).toBe('remote');
   await page.getByRole('button', { name: 'Next', exact: true }).click();
   await expect.poll(() => queries.at(-1).searchParams.get('page')).toBe('2');
   expect(queries.at(-1).searchParams.get('search')).toBe('remote');
   await page.getByRole('button', { name: 'Clear search' }).click();
   await expect(page.getByRole('heading', { name: 'Customer experience' })).toBeVisible();
   expect(queries.at(-1).searchParams.get('page')).toBe('1');
   expect(queries.at(-1).searchParams.get('search')).toBeNull();
});

test('pagination stays reachable when a page status filter has no matches', async ({ page }) => {
   await setup(page);
   await page.getByRole('searchbox', { name: 'Search surveys' }).fill('remote');
   await expect(page.getByRole('heading', { name: 'Remote result' })).toBeVisible();
   await page.getByRole('button', { name: /^Expired/ }).click();
   await expect(page.getByRole('heading', { name: 'No surveys in this view' })).toBeVisible();
   await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
   await page.getByRole('button', { name: 'Clear search and filters' }).click();
   await expect(page.getByRole('heading', { name: 'Customer experience' })).toBeVisible();
});

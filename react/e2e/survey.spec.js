import { test, expect } from '@playwright/test';

const user = { id: 1, name: 'Test User', email: 'test@example.com', is_admin: false };
const survey = { id: 7, title: 'Experience survey', slug: 'experience', status: true, expire_date: null, can_manage: true, questions: [{ id: 11, type: 'short answer', question: 'What worked well?', data: {} }] };

async function mockApi(page, account = user) {
   await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      if (!url.pathname.startsWith('/api/')) return route.fallback();
      const path = url.pathname.replace('/api', '');
      const data = path === '/login' ? { token: 'test-token', user: account }
         : path === '/me' ? account
         : path === '/survey/7' || path === '/survey/get-by-slug/experience' ? { data: survey }
         : path === '/survey' ? { data: [survey], meta: {} }
         : path === '/survey/links' ? { data: [] }
         : ['/topSurvey', '/botSurvey'].includes(path) ? []
         : path === '/admin/users' ? { data: [account], current_page: 1, last_page: 1 }
         : path === '/logs' ? { data: [], current_page: 1, last_page: 1 }
         : {};
      await route.fulfill({ json: data });
   });
}

async function authenticate(page, account = user) {
   await mockApi(page, account);
   await page.addInitScript(account => {
      sessionStorage.setItem('TOKEN', 'test-token');
      sessionStorage.setItem('CURRENT_USER', JSON.stringify(account));
   }, account);
}

async function login(page, persistent = false) {
   await mockApi(page);
   await page.goto('/login');
   await page.getByLabel('Email or username').fill(user.email);
   await page.getByLabel('Password', { exact: true }).fill('Password123!');
   if (persistent) await page.getByLabel('Keep me signed in').check();
   await page.getByRole('button', { name: /sign in|log in|login/i }).click();
   await expect(page).toHaveURL(/dashboard/);
}

test('session-only login survives reload but does not persist in a new tab', async ({ page, context }) => {
   await login(page);
   expect(await page.evaluate(() => localStorage.getItem('TOKEN'))).toBeNull();
   expect(await page.evaluate(() => localStorage.getItem('SHARED_TOKEN'))).toBeNull();
   await page.reload();
   await expect(page.getByRole('link', { name: 'Create a survey', exact: true })).toBeVisible();
   const freshTab = await context.newPage();
   await mockApi(freshTab);
   await freshTab.goto('/surveys');
   await expect(freshTab).toHaveURL(/login/);
});

test('remembered login restores in another tab and logout clears both tabs', async ({ page, context }) => {
   await login(page, true);
   expect(await page.evaluate(() => localStorage.getItem('TOKEN'))).toBe('test-token');
   const tab = await context.newPage();
   await mockApi(tab);
   await tab.goto('/surveys');
   await expect(tab.getByRole('link', { name: 'Create a survey', exact: true })).toBeVisible();
   await page.getByRole('button', { name: 'Account settings' }).click();
   await page.getByRole('button', { name: /log\s*out|sign out/i }).click();
   await expect(page).toHaveURL(/login/);
   await expect(tab).toHaveURL(/login/);
});

test('legacy shared tokens cannot restore a session', async ({ page }) => {
   await mockApi(page);
   await page.addInitScript(() => {
      localStorage.setItem('SHARED_TOKEN', 'old-token');
      localStorage.setItem('LAST_AUTH_TIMESTAMP', String(Date.now()));
   });
   await page.goto('/surveys');
   await expect(page).toHaveURL(/login/);
   expect(await page.evaluate(() => localStorage.getItem('SHARED_TOKEN'))).toBeNull();
});

test('survey edits warn before leaving and save without a warning', async ({ page }) => {
   await authenticate(page);
   await page.goto('/surveys/create');
   await page.getByLabel('Survey title').fill('New survey');
   const warning = new Promise(resolve => page.once('dialog', async dialog => { await dialog.dismiss(); resolve(dialog.message()); }));
   await page.getByRole('button', { name: /Back to surveys/ }).click();
   expect(await warning).toContain('unsaved changes');
   await expect(page).toHaveURL(/surveys\/create/);
   await expect(page.getByLabel('Survey title')).toHaveValue('New survey');
   await page.getByRole('button', { name: 'Add Question', exact: true }).click();
   await page.getByPlaceholder('Question', { exact: true }).fill('How was it?');
   let payload;
   await page.route('**/api/survey', async route => {
      if (route.request().method() !== 'POST') return route.fallback();
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { data: { ...survey, ...payload } } });
   });
   const dialogs = [];
   page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
   await page.getByRole('button', { name: 'Create survey', exact: true }).click();
   await expect(page).toHaveURL(/\/surveys$/);
   expect(payload.title).toBe('New survey');
   expect(payload.questions[0].question).toBe('How was it?');
   expect(dialogs).toEqual([]);
});

test('unsaved answers warn on navigation and reload', async ({ page }) => {
   await mockApi(page);
   await page.goto('/survey/public/experience');
   await page.getByRole('textbox', { name: 'What worked well?' }).fill('Helpful staff');
   page.once('dialog', dialog => dialog.dismiss());
   await page.getByRole('link', { name: 'AceSurvey' }).click();
   await expect(page).toHaveURL(/public\/experience/);
   await expect(page.getByRole('textbox', { name: 'What worked well?' })).toHaveValue('Helpful staff');
   const dialogPromise = page.waitForEvent('dialog');
   // A canceled reload has no load event; bound this navigation independently.
   const reload = page.reload({ timeout: 3000 }).catch(() => {});
   const dialog = await dialogPromise;
   expect(dialog.type()).toBe('beforeunload');
   await dialog.dismiss();
   await reload;
   await expect(page.getByRole('textbox', { name: 'What worked well?' })).toHaveValue('Helpful staff');
});

test('empty answers are blocked and API field errors focus the invalid question', async ({ page }) => {
   await mockApi(page);
   let writes = 0;
   await page.route('**/api/survey/7/answer', async route => {
      writes++;
      if (writes === 1) return route.fulfill({ status: 422, json: { message: 'Invalid response', errors: { 'answers.11': ['Please clarify your answer.'] } } });
      await route.fulfill({ json: { success: true } });
   });
   await page.goto('/survey/public/experience');
   await page.getByRole('button', { name: 'Submit response' }).click();
   await expect(page.getByText('Please answer at least one question before submitting.')).toBeVisible();
   expect(writes).toBe(0);
   const answer = page.getByRole('textbox', { name: 'What worked well?' });
   await expect(answer).toHaveAttribute('maxlength', '10000');
   await answer.fill('Good');
   await page.getByRole('button', { name: 'Submit response' }).click();
   await expect(page.getByText('Please clarify your answer.')).toBeVisible();
   await expect(answer).toBeFocused();
   await expect(answer).toHaveAttribute('aria-invalid', 'true');
   await answer.fill('The staff were helpful.');
   await expect(answer).toBeFocused();
   await page.getByRole('button', { name: 'Submit response' }).click();
   await expect(page.getByRole('heading', { name: 'Thank you for sharing.' })).toBeVisible();
   expect(writes).toBe(2);
});

test('invalid image type and oversize image are rejected before previewing', async ({ page }) => {
   await authenticate(page);
   await page.goto('/surveys/create');
   const input = page.getByLabel('Choose survey cover image');
   await input.setInputFiles({ name: 'test.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
   await expect(page.getByText('Choose a JPEG, PNG or GIF image.', { exact: true })).toBeVisible();
   await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
   await expect(page.getByText('Choose a non-empty image of 5 MB or smaller.')).toBeVisible();
});

test('a readable image previews, and a later file-read failure preserves it', async ({ page }) => {
   await authenticate(page);
   await page.goto('/surveys/create');
   const image = { name: 'cover.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDVcAAAAASUVORK5CYII=', 'base64') };
   await page.getByLabel('Choose survey cover image').setInputFiles(image);
   await expect(page.getByRole('img', { name: 'Survey cover' })).toHaveAttribute('src', /^data:image\/png;base64,/);
   const preview = await page.getByRole('img', { name: 'Survey cover' }).getAttribute('src');
   await page.evaluate(() => {
      window.FileReader = class {
         readAsDataURL() { queueMicrotask(() => this.onerror()); }
         abort() {}
      };
   });
   await page.getByLabel('Choose survey cover image').setInputFiles(image);
   await expect(page.getByText('Could not read this image. Please select it again.')).toBeVisible();
   await expect(page.getByRole('img', { name: 'Survey cover' })).toHaveAttribute('src', preview);
   await expect(page.getByRole('button', { name: 'Create survey', exact: true })).toBeEnabled();
});

test('failed survey saves preserve edits and keep the navigation warning', async ({ page }) => {
   await authenticate(page);
   await page.route('**/api/survey/7', route => route.request().method() === 'PUT'
      ? route.fulfill({ status: 422, json: { errors: { title: ['Please choose another title.'] } } }) : route.fallback());
   await page.goto('/surveys/7');
   await page.getByLabel('Survey title').fill('Changed title');
   await page.getByRole('button', { name: 'Save changes', exact: true }).click();
   await expect(page.getByText('Please choose another title.')).toBeVisible();
   await expect(page.getByLabel('Survey title')).toHaveValue('Changed title');
   page.once('dialog', dialog => dialog.accept());
   await page.getByRole('button', { name: /Back to surveys/ }).click();
   await expect(page).toHaveURL(/\/surveys$/);
});

test('answers remain editable after a network failure and can be resubmitted', async ({ page }) => {
   await mockApi(page);
   let attempts = 0;
   await page.route('**/api/survey/7/answer', route => ++attempts === 1 ? route.abort('failed') : route.fulfill({ json: { success: true } }));
   await page.goto('/survey/public/experience');
   const answer = page.getByRole('textbox', { name: 'What worked well?' });
   await answer.fill('Friendly staff');
   await page.getByRole('button', { name: 'Submit response' }).click();
   await expect(page.getByText('There was a problem submitting your response. Please try again.')).toBeVisible();
   await expect(answer).toHaveValue('Friendly staff');
   await expect(answer).toBeEnabled();
   expect(attempts).toBe(1);
   await page.getByRole('button', { name: 'Submit response' }).click();
   await expect(page.getByRole('heading', { name: 'Thank you for sharing.' })).toBeVisible();
});

test('delete dialog traps focus, closes with Escape and restores its trigger', async ({ page }) => {
   await authenticate(page);
   await page.goto('/surveys/7');
   const trigger = page.getByRole('button', { name: 'Delete', exact: true });
   await trigger.click();
   const dialog = page.getByRole('dialog', { name: 'Delete Survey' });
   await expect(dialog).toBeVisible();
   await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
   await page.keyboard.press('Tab');
   await expect(dialog.getByRole('button', { name: 'Close delete confirmation' })).toBeFocused();
   await page.keyboard.press('Shift+Tab');
   await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
   await page.keyboard.press('Escape');
   await expect(dialog).toBeHidden();
   await expect(trigger).toBeFocused();
});

test('non-admin users cannot open admin screens or send admin reads', async ({ page }) => {
   await authenticate(page);
   const adminRequests = [];
   page.on('request', request => { if (/\/api\/(admin|logs)/.test(request.url())) adminRequests.push(request.url()); });
   await page.goto('/users');
   await expect(page).toHaveURL(/dashboard/);
   await page.goto('/logs');
   await expect(page).toHaveURL(/dashboard/);
   expect(adminRequests).toEqual([]);
});

test('admins can open user management', async ({ page }) => {
   await authenticate(page, { ...user, is_admin: true });
   await page.goto('/users');
   await expect(page.getByRole('heading', { name: /users|accounts/i }).first()).toBeVisible();
   await expect(page.getByRole('cell', { name: /test@example.com/ })).toBeVisible();
});

test('render failures show recovery actions', async ({ page }) => {
   await mockApi(page);
   await page.route('**/api/survey/get-by-slug/experience', route => route.fulfill({ json: { data: { ...survey, questions: {} } } }));
   await page.goto('/survey/public/experience');
   await expect(page.getByRole('heading', { name: 'We couldn’t open this page.' })).toBeVisible();
   await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
   await expect(page.getByRole('link', { name: 'Go to survey hub' })).toHaveAttribute('href', '/survey-selection');
});

test('failed lazy imports show the recovery page', async ({ page }) => {
   await mockApi(page);
   await page.route('**/src/pages/SurveyPublicView.jsx', route => route.abort('failed'));
   await page.goto('/survey/public/experience');
   await expect(page.getByRole('heading', { name: 'We couldn’t open this page.' })).toBeVisible();
});

# React checks

From `react/`, install dependencies with `npm ci --legacy-peer-deps`, then run:

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

On PowerShell systems that block `npm.ps1`, use `npm.cmd` and `npx.cmd`.
To keep browser downloads inside the project, set
`$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.playwright"` before both the browser install and test commands.

The browser suite starts its own Vite server on port 4173. API responses are mocked, so it requires no Laravel server, database, real account, or email service. It covers login persistence and logout, admin screen access, survey creation and failed saves, unsaved-work warnings, respondent validation and network recovery, image uploads, delete-dialog keyboard behavior, and rendering/import recovery.

These tests check frontend behavior. Backend authorization and API contracts remain covered by the PHP feature tests; run those separately when changing the backend.

Session-only sign-in uses session storage. Reloading the same tab preserves it, while independent new tabs require login. “Keep me signed in” uses persistent storage and restores across tabs. Browsers may themselves restore session storage when restoring a previous browsing session; the application no longer restores session-only credentials from local storage.

Unsaved-work protection warns before leaving or refreshing. It does not save a recoverable draft; closing after accepting the warning discards the form.

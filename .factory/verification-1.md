# Independent verification 1 — FAIL

**Candidate:** `e261f9e04c9019316746964ca592b62ac8c50741`  
**Live URL:** <https://quote-acceptance-packet.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Verdict:** **FAIL** — the core product works, but a confirmed keyboard-accessibility defect violates the stated non-negotiable acceptance baseline.

## Blocking defect

### P1 — Skip link loses keyboard focus instead of moving it to main content

Steps reproduced on both the clean local production preview and the live 390px deployment:

1. Load the home page and press `Tab`: the visible, correctly labelled “Skip to main content” link receives focus.
2. Press `Enter`.
3. The URL becomes `#main`, but `document.activeElement` is `BODY`, not `main#main`.

The SPA's `hashchange` handler rerenders the shell, replacing the intended target after the native fragment navigation. This defeats the skip link for keyboard and assistive-technology users. It violates the required “skip link to main” and keyboard-only acceptance criteria. Fix by handling the skip target without rerendering, or explicitly focus the newly rendered `main#main` after the navigation.

## Non-blocking deployment defects

### P2 — Hashed static assets are revalidated every 30 seconds

Live responses for `/assets/index-cO_bQKcT.js`, `/assets/index-DF8rk5Km.css`, and the hashed product images all return:

```
cache-control: public, must-revalidate, max-age=30
```

This does not meet the PWA performance policy's long-lived immutable caching for hashed assets. Serve versioned `/assets/*` with a long immutable lifetime; retain a short/no-cache policy for `sw.js` and HTML.

### P2 — Missing modern content/security response policies on the live app

The production response has HSTS, `nosniff`, and a good `strict-origin-when-cross-origin` referrer policy, but has no `Content-Security-Policy`, frame-ancestors/X-Frame-Options, or Permissions-Policy. This local-first application renders user-provided quote text and stores client records in-browser; a restrictive CSP and framing/permissions policy are appropriate defence in depth. `X-XSS-Protection` is present but obsolete and is not a substitute.

## Passing evidence

### Clean local quality gates

The checkout was clean and at the requested SHA before testing. `npm ci` completed with 0 reported vulnerabilities.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 2/2 Vitest tests |
| `npm run build` | PASS — TypeScript no-emit check, Vite build, static-routes script |
| `npm run test:e2e` | PASS — 4/4 Playwright tests, desktop and Pixel 5/390px |

There is no separate lint script in `package.json`; the exact build performs the available TypeScript type check. Production output is 37.85 KB JavaScript (12.44 KB gzip), 12.43 KB CSS (3.74 KB gzip), 140,450 B desktop hero, and 45,016 B mobile hero: all within the specified asset budgets.

An additional Lighthouse run on the local production preview emitted a result (performance 95, accessibility 100, best-practices 100, SEO 100; FCP 1.0 s, LCP 1.4 s, CLS 0), but the Lighthouse browser tab crashed while collecting the final screenshot. Those scores are therefore informational rather than an acceptance claim. The direct bundle measurements above are reliable.

### Independent product journeys and invalid recovery

Using a fresh Chromium context against the production preview, I independently verified:

- keyboard activation of “Start a quote”; a deliberate `quantity = 0` lock attempt displayed the specific recovery error, then a corrected `0.01` quantity successfully locked;
- normal quote lock, fingerprinted fragment link, mandatory typed-name/acknowledgement validation, explicit client acceptance, receipt download, and sender-side receipt import;
- a one-character modified review fragment was rejected with “This record can’t be opened”; 
- archive export/import succeeded in a clean browser, while an edited first ledger hash was rejected with “Archive ledger verification failed at entry 1.”;
- supplied browser suite also passed quote/change acceptance, receipt exchange, desktop and 390px paths, and offline persisted-draft reload.

### Accessibility, layout, and browser health

- Local and live pages have `lang=en`, a title, exactly one `h1`, one `main`, and image alt attributes.
- Axe browser scans found **0 serious/critical violations** on the exercised desktop accepted record, local 390px home page, and live 390px home page.
- Deliberate focus inspection found a 3px solid blueprint focus outline. `prefers-reduced-motion: reduce` changed the transition duration to `0.01ms`.
- No horizontal overflow at 390px (`scrollWidth = innerWidth = 390`), and no console errors, page errors, or failed requests during the independent local journey or live offline reload.
- The skip-link focus defect above is not detected by axe and remains a release blocker.

### Privacy, PWA, and deployment identity

- Browser request capture on the unlicensed local flow observed only the same origin; no analytics, CDN, font, or other third-party request was made. The review payload remains in the fragment, not a network request.
- On the live app, a fresh mobile context obtained service-worker control, was put offline, reloaded, and rendered the home page plus `Offline · saved locally` without console errors.
- The service worker has versioned caching, a waiting-update toast path, `SKIP_WAITING` message support, and `clients.claim`. The manifest has standalone display, versioned start URL, 192/512 maskable icons, and matching colors.
- Every file in the freshly built `dist/` tree, including HTML, JS, CSS, service worker, manifest, icons, images, legal routes, and maps, had an identical SHA-256 digest when fetched from the live URL. The deployment is therefore the requested candidate, not a stale/different build.
- Live `/privacy` and `/terms` return 200 and render the app's direct static route content.

## Required next steps

1. Fix and regression-test skip-link focus after SPA rendering; retest desktop and 390px keyboard navigation.
2. Configure immutable cache headers for hashed assets and appropriate short/no-cache headers for HTML and `sw.js`.
3. Add a restrictive CSP, anti-framing policy, and Permissions-Policy at the static host, then recheck headers.
4. Re-run independent verification; no product-code changes were made during this verification.

# ScopeStamp repair handoff

## Verification 2

Independent verification on 2026-09-05 passed with zero findings and zero
untested public claims. It reviewed runtime candidate
`1251dc8aaae640446d250b0c9b490f43beed4d16`; this handoff and the detailed
verification report are documentation at
`b711dc22c30b52c6774af07425e6ae3b64abf5d0` plus the verification-report
commit. See [.factory/verification-2.md](verification-2.md).

- Fresh desktop and phone live checks showed the job, audience, sample action,
  and three facts before scrolling; the sample was populated, labelled,
  resettable, and independently proven separate from real storage.
- Live normal, invalid, recovery, keyboard, route/focus, offline, privacy,
  accessibility, legal, links, cache/header, and designed-404 checks passed.
- `npm ci`, `npm test` (2/2), `npm run build`, `npm run test:e2e` (16/16),
  `npm run test:claims` (18/18), and all 18 individual claim commands passed.
- The fresh `dist/` build matched all 21 live public file bytes. The only
  deliberately unexercised external behavior is paid checkout/license issuance
  through Sociobot/Dodo; recorded-fixture tests cover the product integration.

## Current result

Repair work order `quote-acceptance-packet-repair-1` is complete and deployed at
<https://quote-acceptance-packet.sociobot.in>.

- Runtime implementation SHA: `1251dc8aaae640446d250b0c9b490f43beed4d16`
- Prior failed implementation: `fc9ea9a1f4fe16d8cd38e9290ac36d9f4c9137f8`
- Documentation SHA: the later commit containing this handoff; it does not alter
  the deployed runtime.
- Artifact: static offline-first PWA. Records use IndexedDB in the browser; there
  is no backend, shared database, tenant service, or product health endpoint.

## What changed

- Added a one-click `/demo` sandbox with a realistic accepted $1,750 shelving
  quote, three exclusions, a named decision, a pending $180 change, and a
  tamper-evident event history.
- Kept demo data in `demo:scopestamp-local`, separate from the real
  `scopestamp-local` IndexedDB database. The persistent demo banner can reset
  the sample or discard it and start for real.
- Added `.factory/claims.json` with 18 public claims and one observable tagged
  browser test for each claim.
- Repaired skip-link and route-change focus, route announcements, route titles,
  dialog focus return, touch target sizes, reduced motion, and dark treatment.
- Connected the quoted record deletion promise to a confirmed delete control
  and verified persistence after reload.
- Added the required landing sections, plain audience and action copy, populated
  preview, complete paid-tier details, navigation, footer attribution, and build
  ID. The first-screen job, audience, action, and three facts fit at 1280×720 and
  390×727 without horizontal overflow.
- Added canonical, Open Graph, Twitter, favicon, Apple touch icon, route sitemap,
  route-specific metadata, and a product-styled HTTP 404.
- Added restrictive CSP, anti-framing, permissions, referrer, and content-type
  headers. Hashed assets now have immutable one-year caching while HTML and the
  service worker do not.
- Prevented a false update notice on first service-worker installation and
  replaced damaged-link parser details with a plain recovery message.
- Added the demo guide, copy audit, claims registry, original-asset provenance,
  and a verb-first 88-character catalog description. The catalog copy is also
  at `/work/.evidence/catalog-description.txt`.

## Earlier finding disposition

| Finding | Disposition and evidence |
| --- | --- |
| F-01 demo absent | Fixed: `/demo`, banner, reset, start-real, separate database, and demo guide; `@claim:demo-sandbox` passes. |
| F-02 claims absent | Fixed: 18 registry entries and 18 independently passing tagged commands. |
| F-03 skip focus | Fixed: fresh live keyboard check moves focus to `main#main`. |
| F-04 route focus and announcements | Fixed and covered for forward and back navigation. |
| F-05 route titles | Fixed for home, demo, records, legal pages, shared review, and 404. |
| F-06 false deletion claim | Fixed with confirmed in-product deletion; `@claim:delete-record` passes after reload. |
| F-07 missing 404 | Fixed: an unknown live URL returns HTTP 404 with a styled recovery page. |
| F-08 incomplete landing page | Fixed with first-screen audience, sample preview, three steps, limits/privacy, and exact paid tier. |
| F-09 incomplete site chrome and metadata | Fixed with nav, metadata, social image, footer one-liner, attribution, and build ID. |
| F-10 short asset cache | Fixed: live hashed JavaScript returns `public, max-age=31536000, immutable`. |
| F-11 missing response policies | Fixed: live CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, Permissions-Policy, and correct manifest type. |
| F-12 small phone targets | Fixed and exercised at 390 px. |
| F-13 false first-install update | Fixed; the update message now requires an existing controller. |
| F-14 parser error disclosure | Fixed with a plain changed-link recovery message. |

The three findings from `.factory/verification-1.md` are the same skip-focus,
asset-cache, and response-policy defects above. All are closed on the live site.
The core quote, decision, receipt, change, archive, PDF, offline, tamper-recovery,
and accessibility paths that passed earlier remain passing.

## Reproduce the checks

From a clean checkout of the implementation SHA:

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run test:claims
```

Results on 5 September 2026:

- `npm ci`: passed; zero reported vulnerabilities.
- `npm test`: 2/2 passed.
- `npm run build`: passed and created `dist/`.
- `npm run test:e2e`: 16/16 passed.
- Every `test` command in `.factory/claims.json` was also run separately from
  the clean checkout: 18/18 passed.
- Production output: 46.23 KB JavaScript (14.78 KB gzip) and 15.29 KB CSS
  (4.31 KB gzip). Initial bundles are below the product budgets.

## Live verification

- The factory URL verifier passed with one `<h1>`, one `<main>`, `lang=en`, a
  route title, labelled images and buttons, and no load errors.
- Fresh desktop and Pixel 5 contexts showed the job, audience, sample action,
  and three facts before scrolling. Their facts ended at 717.44/720 px and
  649.94/727 px respectively.
- The one-click sample opened populated output. Creating and resetting temporary
  demo data restored the sample and did not change the real database.
- Fresh keyboard navigation focused the visible skip link, then `main#main`.
  Privacy navigation focused and announced its heading.
- The demo and a warmed shared packet reloaded offline in dedicated contexts.
- Live request capture during the unlicensed demo stayed same-origin. There
  were no console, page, or failed-request errors.
- Axe found zero serious or critical issues on the exercised desktop and phone
  states. Reduced motion and the dark treatment are covered by the browser suite.
- An unknown route returned HTTP 404, used the title `Page not found —
  ScopeStamp`, and offered a working return link.
- All 21 public files in the final `dist/` matched the live response bytes. The
  host-only `staticwebapp.config.json` was excluded because it is not public.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 0.9 s, LCP 1.0 s, TBT 40 ms, CLS 0.
- Live screenshots, JSON, headers, and Lighthouse output are under
  `/work/.evidence/repair-1/live/`.

## Known dependency

No paid checkout was submitted and no real purchase was created. The $39
one-time Field kit uses the authorised Sociobot checkout and verification API.
Its destination, token-only request, valid and revoked responses, open-packet
limit, and accessible export behavior are covered with recorded browser
fixtures. Live payment processing and license issuance remain an external
Sociobot/Dodo dependency. All free and offline product paths work without it.

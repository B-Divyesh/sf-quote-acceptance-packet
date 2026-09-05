# Verify quote acceptance records — PASS

**Verified:** 2026-09-05 UTC  
**Live URL:** <https://quote-acceptance-packet.sociobot.in>  
**Implementation candidate:** `1251dc8aaae640446d250b0c9b490f43beed4d16`  
**Documentation SHA:** `b711dc22c30b52c6774af07425e6ae3b64abf5d0`  
**Verdict:** **PASS**  
**Finding count:** **0**  
**Untested public claim count:** **0**

ScopeStamp lets a solo consultant or trade business record a quote's scope,
exclusions, price, client decision, and later changes before work starts. The
first action is **Try it with sample data**. It opens the isolated sample
without changing the user's records.

## Live browser check

Fresh Chromium desktop (1280 x 720) and Pixel 5 (393 x 727) contexts both
loaded successfully. Before scrolling, each showed the job heading, audience,
sample action, and these three facts: works offline after the first visit,
records stay in this browser, and free for three open packets. There was no
horizontal overflow on the phone.

The sample opened a populated accepted `Oak studio shelving` packet with a
$1,750 total, exclusions, decision, and later change. The persistent label
read `Demo — sample data, nothing is saved to your records`. Reset restored the
sample. The separately run `demo-sandbox` claim test created a real draft,
entered and reset demo mode, then confirmed the real draft still existed after
leaving the demo. This proves the separate storage path without touching any
existing user data.

An independent disposable live journey also passed: a quote with quantity zero
gave the specific recovery message; correcting it to two locked the quote;
the fragment-only link verified its fingerprint; the client accepted and
downloaded a receipt; the owner imported it; and a changed link showed the
plain recovery message. No browser console or page errors occurred.

Keyboard checks moved focus from the visible skip link to `main#main`. Privacy
navigation focused its `h1`, announced `Privacy`, and changed the title to
`Privacy — ScopeStamp`. Live Axe scans found zero serious or critical issues
on both desktop and phone. The phone had no visible link or button under
44 x 44 CSS pixels. The reduced-motion, dark treatment, dialog focus-return,
and 200% text checks passed in the 16 browser-test suite.

A fresh service-worker-controlled phone context reloaded `/demo` offline with
the sample and persistent demo label intact. Requests made while using the
unlicensed demo were all same-origin. This supports the local storage and
no-tracking claims; it does not test a purchase.

`/privacy`, `/terms`, `/demo`, manifest, service worker, robots, and sitemap
returned 200. Each legal/demo route had its own expected title. The deliberate
unknown route returned HTTP 404, rendered `This page does not exist`, used
`Page not found — ScopeStamp`, and offered `Return home`; this is expected
behavior, not a finding. The external Param Factory link returned 200.

Live headers include the restrictive CSP, `frame-ancestors 'none'`,
`X-Frame-Options: DENY`, Permissions-Policy, and `nosniff`. Hashed JavaScript
and CSS use one-year immutable caching; `sw.js` and the manifest use no-cache.
The manifest has `application/manifest+json` content type. All 21 public files
from a fresh `dist/` build had the same SHA-256 bytes at the live URL. The
host-only `staticwebapp.config.json` was correctly excluded from that byte
comparison.

## Clean checkout and claims

`npm ci` completed with zero reported vulnerabilities. The following commands
all passed from this checkout:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 2/2 Vitest tests |
| `npm run build` | PASS — creates `dist/` |
| `npm run test:e2e` | PASS — 16/16 Playwright tests |
| `npm run test:claims` | PASS — 18/18 declared browser claims |
| Every individual command in `.factory/claims.json` | PASS — 18/18 commands, one test each |

The individual claim commands cover demo isolation, quote scope and fingerprint,
accept/decline receipts, changes, owner/client offline reloads, local storage,
fragment sharing, no tracking, PDF print, archive roundtrip, tamper recovery,
free limits, paid fixture behavior, ungated export/accessibility, license
privacy/revocation, and record deletion. No public claim on the live landing
page, README, privacy page, or terms page lacked an entry and tagged test.

The repository does not ship a `verify-url.sh` command. Equivalent live checks
were run directly: title, language, one `h1`, `main`, image alt text, console
errors, keyboard focus, and Axe scans.

The built initial JavaScript is 46.23 kB (14.78 kB gzip) and CSS is 15.29 kB
(4.31 kB gzip), within the static budget. The prior handoff records a mobile
Lighthouse run of 100 in all four categories; this verification did not repeat
that informational measurement because the live functional, accessibility, and
asset-budget checks above are direct evidence.

## Earlier finding disposition

| Earlier finding | Current disposition and fresh evidence |
| --- | --- |
| F-01 demo absent | Closed: live `/demo`, populated sample, persistent label, reset/start-real controls; isolated-storage claim passed. |
| F-02 claims absent | Closed: 18 registry entries and 18 separately passing commands. |
| F-03 skip focus | Closed: live keyboard focus reached `main#main`. |
| F-04 route focus/announcement | Closed: live Privacy route focused its heading and announced it. |
| F-05 route titles | Closed: live home, demo, privacy, terms, review, and 404 route titles are specific. |
| F-06 deletion promise | Closed: the delete-record claim passed and reload confirmed removal. |
| F-07 missing 404 | Closed: unknown URL returns HTTP 404 with a styled recovery page. |
| F-08 landing structure | Closed: first screen, populated preview, three steps, limits/privacy, and price are present. |
| F-09 chrome/metadata | Closed: navigation, footer, metadata, social asset, and build ID are present. |
| F-10 immutable assets | Closed: live hashed assets are `max-age=31536000, immutable`. |
| F-11 response policies | Closed: live CSP, anti-framing, permissions policy, and manifest MIME type are present. |
| F-12 small phone targets | Closed: live visible links/buttons measured at least 44 x 44 px. |
| F-13 false update notice | Closed: first-install check passed in the browser suite. |
| F-14 parser detail in recovery | Closed: changed live packet link showed only the plain recovery message. |

## Scope notes

This is a static local-first PWA with IndexedDB, not a backend product. Tenant
isolation, server restart persistence, health endpoints, and `429`/`Retry-After`
checks do not apply. No payment was submitted and no real license was issued.
The live checkout/license issuer is an external Sociobot/Dodo dependency; the
documented fixture tests verify the in-product integration without creating a
purchase.

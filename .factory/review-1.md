# Review quote acceptance and scope records — FAIL

**Work order:** `quote-acceptance-packet-review-1`  
**Reviewed:** 2026-09-05 UTC  
**Live URL:** <https://quote-acceptance-packet.sociobot.in>  
**Implementation candidate:** `fc9ea9a1f4fe16d8cd38e9290ac36d9f4c9137f8`  
**Documentation SHA reviewed:** `062a3c4af8e7a50c06dccc55bc0cf0c96142dab0`  
**Verdict:** **FAIL**  
**Finding count:** **14**  
**Untested public claim count:** **17**

The live product performs the main quote, decision, receipt, archive, and change-card workflow. It does not meet the acceptance contract. The required sample sandbox and claims registry are absent, the earlier keyboard defect remains, and all 17 public claim groups lack the required tagged claim tests.

## First screen before scrolling

- **Job shown:** Put the exact job in writing by recording scope, exclusions, price, the client decision, and later changes.
- **Audience shown:** Not stated. The repository describes solo consultants and trade businesses, but the first screen does not.
- **First action shown:** “Start a quote.” The required “Try it with sample data” action is absent.

This was checked in fresh 1440×900 desktop and 390×844 phone contexts. The headline, primary action, and three short facts are visible without scrolling. The phone layout has no normal-scale horizontal overflow.

## Findings

### F-01 — P1 — The required one-click sample sandbox does not exist

There is no “Try it with sample data” action. Both `/demo` and `/?demo=1` return the same empty home page. There is no realistic populated sample, persistent “Demo — sample data, nothing is saved” label, “Reset demo,” “Start for real,” separate demo storage namespace, or `.factory/demo.md`.

The requested sample, reset, persistent label, and proof that sample actions cannot affect real data therefore cannot be exercised. The manual review used fresh browser contexts and fake data, so it did not read or change any existing user data.

### F-02 — P1 — Every public claim is outside the required claims system

`.factory/claims.json` is missing and `rg '@claim:' .` finds zero tagged tests. There are no declared claim commands to run from the clean checkout. Seventeen distinct public claim groups appear on the live site, README, privacy page, or terms page; every one is untested under the claims contract. Manual observations do not replace the required clean-demo test command.

### F-03 — P1 — The skip link still loses focus

The earlier finding remains open on desktop and phone. `Tab` focuses “Skip to main content.” After `Enter`, the URL becomes `#main`, but `document.activeElement` is `BODY`, not `main#main`. The hash-change render replaces the focus target.

### F-04 — P1 — SPA route changes do not move or announce focus

Activating the Privacy link changes the visible page, but focus becomes `BODY` and the polite live region is empty. Back navigation also leaves focus on `BODY`. The required route-change focus on the new `<h1>` and screen-reader announcement are absent.

### F-05 — P2 — Routes do not set their own titles

Home, `/privacy`, `/terms`, `/demo`, review links, and unknown routes all retain `ScopeStamp — quote acceptance records`. Required titles such as `Privacy — ScopeStamp`, `Terms — ScopeStamp`, and `Demo — ScopeStamp` are not set.

### F-06 — P1 — The privacy page promises deletion that the interface does not provide

The public privacy page says, “Export or delete your records at any time.” The live record list and record page have no delete or clear action. Source inspection finds `db.deleteQuote` and `db.clear`, but neither is connected to a user control. Clearing all browser site data is mentioned separately and is not the promised in-product delete action.

### F-07 — P2 — Unknown URLs do not return or render a designed 404

`/not-a-real-route-review-1` and `/404.html` both return HTTP 200 and render the normal home page. This is not a deliberate HTTP 404 and provides no not-found message or way back. The required product-styled 404 route is absent.

### F-08 — P2 — The landing page is missing required information and structure

The first-screen sentence does not name the audience. After the hero, the page goes directly to the footer. It has no live sample/product preview, “How it works” section, plain limits/privacy section, or complete paid-tier section with exact inclusions. `.factory/copy-audit.md` is also missing.

### F-09 — P2 — Required site metadata, navigation, and footer details are incomplete

The page has a useful title, description, language, theme color, favicon, one `<h1>`, and one `<main>`. It lacks a canonical link, Open Graph metadata, Twitter card metadata, and an Apple touch icon link. The header has no `<nav>`. The footer lacks the required product one-line description, “Built by Param Factory,” and version/build ID.

### F-10 — P2 — The earlier immutable-cache finding remains open

Live hashed JavaScript, CSS, and image assets return `cache-control: public, must-revalidate, max-age=30`. Versioned assets are not served with a long immutable lifetime. HTML and `sw.js` receive the same 30-second policy.

### F-11 — P2 — The earlier response-policy finding remains open

Live responses include HSTS, `nosniff`, and `strict-origin-when-cross-origin`, but still have no Content-Security-Policy, anti-framing policy, or Permissions-Policy. The repository has no `staticwebapp.config.json`. The manifest is also served as `application/octet-stream` rather than a manifest JSON type.

### F-12 — P2 — Some phone touch targets are below 44 px

At 390 px, the ScopeStamp home link is 36 px high and the Privacy and Terms footer links are 22 px high. These interactive targets do not meet the required 44×44 CSS-pixel minimum.

### F-13 — P2 — A false update notice obscures the first visit

Fresh desktop and phone contexts show “An update is ready. Reload to use it.” during the first installation of the service worker. There is no prior installed version to update. On phone, the notice overlays the first actions and facts. The service worker’s initial `updatefound` state is being presented as an available update.

### F-14 — P2 — Damaged-link recovery exposes a technical parser error

A one-character-damaged review fragment produces “Expected ',' or '}' after property value in JSON at position 989…” before the useful recovery instruction. This does not meet the plain-word error contract. The user should only be told that the link is incomplete or changed and to request a fresh link.

## Public claim audit

All rows below count as untested because there is no claims registry and no `@claim:<id>` command. “Manual evidence” records only what this review observed.

| # | Public claim group | Where | Manual evidence | Contract status |
| --- | --- | --- | --- | --- |
| 1 | Creates a quote with scope, exclusions, line prices, and total | Home, README | Passed with a realistic $1,750 quote | Untested |
| 2 | Locks the exact revision into a shareable fingerprinted link | Home, README | Link opened with “Fingerprint verified” | Untested |
| 3 | Records named accept and decline receipts with time provenance | Home, README | Accept and decline passed; receipt contained actor, UTC time, and hashes | Untested |
| 4 | Keeps scoped change approvals in the same event chain | Home, README | $825 change accepted; ledger reached four entries | Untested |
| 5 | Works offline after first load and keeps local drafts | Home, README | Fresh controlled context reloaded offline | Untested |
| 6 | A client can review a shared packet offline after first load | Locked-record page | Verified quote and offline label survived an offline reload | Untested |
| 7 | Uses no account and stores records on the current device | Home, README, privacy | Fresh context used IndexedDB and no sign-in | Untested |
| 8 | Shared quote content stays in the URL fragment and is not sent to the server | README, privacy | Share request used a fragment; no cross-origin request was observed | Untested |
| 9 | Uses no analytics, ads, tracking, external fonts, or runtime CDN | README, privacy | No cross-origin request was observed in the unlicensed flow | Untested |
| 10 | Prints or saves a packet as PDF | README, record action | Generated a 58 KB accepted-record PDF with app chrome hidden | Untested |
| 11 | Exports and imports complete JSON archives | README | Exported then imported an awaiting quote in a fresh context | Untested |
| 12 | Detects changes to packets, receipts, archives, and the event chain | Home, README | Damaged link and edited first archive hash were rejected | Untested |
| 13 | Free use permits three simultaneously open packets | README, paid dialog | Fourth draft opened the license dialog | Untested |
| 14 | Completed records are unlimited | README, paid dialog | Not measured; “unlimited” has no bounded proof | Untested |
| 15 | A one-time $39 license enables unlimited active packets through hosted checkout and restore | README, terms, paid dialog | Checkout and a valid license were not exercised | Untested |
| 16 | Core export and accessibility features are never gated | README, terms, paid dialog | Archive export worked without a license; all license states were not exercised | Untested |
| 17 | License verification sends only the token; payment data never enters the app; refunds revoke licenses | Privacy, terms | Not exercised; no test license or claim fixture exists | Untested |

## Live workflow evidence

All live data below was created in disposable fresh browser contexts with fictional names and addresses.

- Empty required fields focused the first invalid input and showed the browser validation message.
- Quantity `0` produced the specific alert: “Each line item needs … a quantity above zero.” Correcting it to `2` allowed locking.
- The populated output showed `Oak studio shelving`, three exclusions, `$1,750.00`, an awaiting status, a SHA-256 fingerprint, and UTC timestamp provenance.
- The client review required a full name and explicit acknowledgement. Accept and decline both produced the correct receipt state.
- The accepted receipt downloaded as JSON and imported into the sender record. Reload preserved the accepted record.
- An $825 change with a two-day schedule impact opened from its share link, was accepted, imported, and appeared in a four-entry ledger.
- Archive export and fresh-context import passed. Editing the first ledger hash was rejected at entry 1.
- A damaged review link was rejected, though its error wording is finding F-14.
- Print media hid app chrome and produced a readable 58 KB PDF containing the accepted state.
- The dialog focused its first field and returned focus to “Add change card” after Cancel.
- No console errors, page errors, or failed requests occurred in the live journeys.

## Accessibility, keyboard, motion, and layout

- The worker `verify-url.sh` passed: title and language present, one `<h1>`, `<main>` present, no missing image alt text, and no console errors.
- Playwright Axe found no violations on the light home page, dark home page, paid dialog, or populated phone client-review page.
- Reduced motion matched and reduced transition/animation durations to `0.01ms`.
- Normal phone layout had `scrollWidth = innerWidth = 390`.
- The skip-link and route-focus failures remain blocking findings. The small link targets are F-12.

## Offline, privacy, links, and update behavior

- A fresh service-worker-controlled home page reloaded offline with “Offline · saved locally.”
- A shared client review also reloaded offline with its verified packet intact.
- The unlicensed workflow made only same-origin requests. No analytics, font CDN, or runtime third-party script request appeared.
- `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`, the manifest, service worker, icons, and app assets returned 200.
- The false first-install update notice is F-13. Unknown-route behavior is F-07.
- The checkout and valid-license path were not exercised because the repository provides no claim fixture or test license. This remains included in the untested claim count.
- There is no backend, tenant store, health endpoint, or rate-limited product API in this static PWA, so backend isolation, restart persistence, and `429/Retry-After` checks do not apply.

## Clean-checkout commands

The remote repository was cloned fresh at `062a3c4af8e7a50c06dccc55bc0cf0c96142dab0`. `npm ci` completed with zero reported vulnerabilities.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 2/2 Vitest tests |
| `npm run build` | PASS — TypeScript and Vite; `dist/` created |
| `npm run test:e2e` | PASS — 4/4 Playwright runs across desktop and Pixel 5 projects |
| Declared claim commands | None exist because `.factory/claims.json` is missing |

Production output was 37.85 KB JavaScript (12.40 KB gzip), 12.43 KB CSS (3.75 KB gzip), 140,450-byte desktop art, and 45,016-byte phone art. It is within the stated static budgets.

Lighthouse against the live phone profile completed with Performance 100, Accessibility 100, Best Practices 100, and SEO 100. FCP and LCP were 1.08 s, TBT 0 ms, and CLS 0.

## Candidate and deployment identity

`fc9ea9a1f4fe16d8cd38e9290ac36d9f4c9137f8` is the last implementation commit. `e261f9e04c9019316746964ca592b62ac8c50741` only adds tests and handoff text. `062a3c4af8e7a50c06dccc55bc0cf0c96142dab0` only adds the earlier verification report and handoff update.

All 16 files in a clean `dist/` build from the current documentation SHA matched the live files byte for byte by SHA-256. Because runtime source did not change after `fc9ea9a`, the live runtime is the implementation candidate named above.

## Earlier finding disposition

| Earlier finding | Current result |
| --- | --- |
| Skip link leaves focus on `BODY` | **Open** — reproduced as F-03 on desktop and phone |
| Hashed assets use 30-second revalidation | **Open** — reproduced as F-10 |
| CSP, anti-framing, and Permissions-Policy absent | **Open** — reproduced as F-11 |
| Core quote, receipt, change, archive, and offline paths passed | **Still passing** in independent live and clean-checkout checks |
| Axe serious/critical count was zero | **Still passing**; current Axe scans found zero violations |
| Bundle and Lighthouse budgets passed | **Still passing** with current measurements |

## Missed leverage check

No AI feature is an obvious missing step for this local quote-record job. Adding generated legal text or automated scope wording would increase risk and is outside the brief. The useful missing capability is the required safe sample/import path, already covered by F-01.

## Required next steps

1. Add the isolated one-click sample, reset/start-real controls, demo URL, storage namespace, and `.factory/demo.md`.
2. Add `.factory/claims.json` and one tagged observable test for every retained public claim. Remove or narrow claims that cannot be proved.
3. Fix skip and SPA route focus, route announcements, route titles, deletion controls or copy, 404 behavior, and phone target sizes.
4. Complete the required landing structure and metadata.
5. Configure immutable asset caching and the missing response security policies.
6. Fix the false first-install update notice and replace raw parser errors with plain recovery text.
7. Re-run independent review. PASS requires zero findings and zero untested claims.

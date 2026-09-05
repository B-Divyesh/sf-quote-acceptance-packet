# Verify quote acceptance and scope records — FAIL

**Work order:** `quote-acceptance-packet-verify-3`  
**Verified:** 5 September 2026 UTC  
**Live URL:** <https://quote-acceptance-packet.sociobot.in>  
**Implementation candidate:** `7eed7a241bddf0f669171c8fb7e0d41b5d32d690`  
**Live application source:** `1251dc8aaae640446d250b0c9b490f43beed4d16`  
**Documentation baseline:** `de163432c9fda3cc14230f3116af3f43fe5668db`  
**Verdict:** **FAIL**  
**Finding count:** **2**  
**Untested public claim count:** **0**

ScopeStamp records a quote's scope, exclusions, price, client decision, and
later changes for solo consultants and trade businesses. Before scrolling,
fresh desktop and phone browsers showed that job, the audience, and the first
action: **Try it with sample data**.

The free quote-record workflow works. The product cannot pass because its
advertised paid checkout returns 404, and several live links remain smaller
than the required 44 px touch target.

## Findings

### F-01 — P1 — The advertised $39 checkout is unavailable

The live Field kit dialog links **Buy once for $39** to the declared Sociobot
checkout URL. A fresh request to that exact URL returned HTTP 404 with an
`application/json` response:

`https://api.sociobot.in/api/v1/products/quote-acceptance-packet/checkout`

This is an unexpected error on the purchase path, not the product's deliberate
404 page. A visitor cannot buy the advertised one-time license.

The `@claim:paid-field-kit` command passes, but it only checks the checkout
destination and uses a recorded valid-license response for the unlock. That is
useful product-side coverage, but it cannot make the missing live product
registration true. The billing operator must register this product and the
live checkout must complete before the paid claim passes end to end.

### F-02 — P2 — Several links are smaller than the 44 px touch target

A fresh 393 × 727 browser measured every visible link and button across the
home, demo list, demo record, editor, client review, legal pages, purchase
dialog, and 404 page. These live links were below the required 44 px height:

| Route or state | Link | Measured box |
| --- | --- | ---: |
| Demo record list and record view | `Oak studio shelving` | 182.4 × 24 px |
| `/privacy` | `privacy@sociobot.in` | 161.8 × 19 px |
| `/terms` | `support@sociobot.in` | 164.5 × 19 px |
| Field kit dialog | `privacy` | 49.3 × 15 px |
| Field kit dialog | `terms` | 38.9 × 15 px |

The home page has no short visible target, so the current automated touch-target
test passes while missing these later states. Axe reported no violations; this
contract check is a separate measurement.

## Live browser evidence

Fresh 1280 × 720 desktop and 393 × 727 phone contexts showed the complete first
screen without scrolling. The heading was **Record a quote and client
decision**. The audience sentence named consultants and trade businesses. The
three facts ended at 717.44 px on desktop and 649.94 px on phone, within each
viewport. The phone had no horizontal overflow.

The one-click sample opened the accepted **Oak studio shelving** packet. Its
record view showed Northline Joinery, Maya Chen, the $1,750 total, three
exclusions, the named accepted decision, and the pending $180 cable-panel
change. The persistent label said **Demo — sample data, nothing is saved to
your records**. Reset restored the sample.

In a separate clean context, a fictional real draft was saved before entering
the demo. Resetting the demo and choosing **Start for real** preserved that
draft, removed the sample, and removed the demo label. This confirms the live
sample uses separate storage. No existing browser profile or real user record
was opened or changed.

A separate live journey covered normal, invalid, and recovery paths. Quantity
zero produced the specific line-item error. Correcting it to two locked a
$1,750 quote. Its fragment link showed **Fingerprint verified**; a fictional
client accepted it, downloaded a receipt, and the owner imported the recorded
decision. A changed link showed only the plain recovery message. No console or
page errors occurred.

Keyboard activation moved the skip link to `main#main`. Privacy navigation
focused and announced its heading; back navigation restored the home heading
and title. The purchase dialog focused its buy link and returned focus to its
opener. At 200% text size, the 393 px view did not overflow. Reduced motion set
the tested transition to `0.01ms`.

Live Axe scans of desktop home, phone demo, and the dark purchase dialog found
zero violations. The worker `verify-url.sh` also passed with HTTPS 200,
`lang=en`, one `h1`, one `main`, complete image alternatives, labelled buttons,
and no console errors. F-02 remains because the explicit 44 px contract is
stricter than the Axe result.

A fresh phone service-worker context controlled `/demo`, reloaded offline, and
kept the sample, demo label, and **Offline · saved locally** status. The first
service-worker installation showed no false update message. During the live
unlicensed demo journey, all five observed requests stayed on the product
origin and no request contained the shared fragment.

## Routes, policies, and files

Home, Demo, Privacy, and Terms returned 200 with their expected titles, one
`h1`, one `main`, and `lang=en`. A made-up path returned deliberate HTTP 404,
rendered **This page does not exist**, used `Page not found — ScopeStamp`, and
offered **Return home**. That response is expected and is not a defect.

The manifest, service worker, robots file, and sitemap returned 200. The
manifest uses standalone display, versioned start URL, matching theme colors,
and 192/512 maskable icons. Live responses include CSP, `frame-ancestors
'none'`, `X-Frame-Options: DENY`, Permissions-Policy, Referrer-Policy, HSTS,
and `nosniff`. Hashed JavaScript uses one-year immutable caching; HTML and the
service worker do not.

All 21 public build files, including the deliberate 404 body, matched the clean
build byte for byte by SHA-256. `staticwebapp.config.json` is host configuration
and was not fetched as a public file. The external Param Factory attribution
URL was not requested because the work order forbids connecting to other
Sociobot services; all in-scope product links were checked.

Fresh mobile Lighthouse results were Performance 100, Accessibility 100, Best
Practices 100, and SEO 100. FCP was 0.9 s, LCP 1.1 s, TBT 0 ms, and CLS 0. The
clean build produced 46.23 kB JavaScript (14.78 kB gzip) and 15.29 kB CSS (4.31
kB gzip), within the product budgets.

## Clean checkout and claim results

The repository was freshly cloned at the documentation baseline. `npm ci`
installed 61 packages and reported zero vulnerabilities.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 2/2 unit tests |
| `npm run build` | PASS — `dist/` created |
| `npm run test:e2e` | PASS — 16/16 desktop and phone tests |
| `npm run test:claims` | PASS — 18/18 tagged tests |
| Every command in `.factory/claims.json`, run separately | PASS — 18/18 commands |

Every public claim has a declared command and every command was run, so the
untested claim count is zero. The commands and live disposition are:

| Claim | Command | Current disposition |
| --- | --- | --- |
| `demo-sandbox` | Pass | Pass live |
| `quote-packet` | Pass | Pass live |
| `decision-receipts` | Pass | Pass live |
| `change-history` | Pass | Pass in clean browser test; sample is present live |
| `owner-offline` | Pass | Pass live |
| `client-offline` | Pass | Pass in dedicated browser test |
| `local-storage` | Pass | Pass live |
| `fragment-sharing` | Pass | Pass live |
| `no-tracking` | Pass | Pass live |
| `print-pdf` | Pass | Pass in clean browser test |
| `archive-roundtrip` | Pass | Pass in clean browser test |
| `tamper-detection` | Pass | Pass in clean browser test and changed-link live check |
| `free-open-limit` | Pass | Pass in clean browser test |
| `completed-not-counted` | Pass | Pass for accepted and declined receipts |
| `paid-field-kit` | Pass with fixture | **Fail live: checkout returns 404** |
| `ungated-export-accessibility` | Pass | Pass in clean browser test |
| `license-privacy-revocation` | Pass with fixture | Pass product-side fixture behavior |
| `delete-record` | Pass | Pass in clean browser test |

## Earlier finding disposition

| Earlier finding | Verification 3 disposition |
| --- | --- |
| Review 2: declined records were not covered | Closed. The repaired tagged test creates, declines, downloads, imports, and retains a declined record beside three open drafts. |
| Review 1 F-01: demo absent | Closed by the live sample, persistent label, reset, start-real, and isolation checks. |
| Review 1 F-02: claims absent | Closed structurally; all 18 commands ran. The separate false live paid outcome is F-01 above. |
| Review 1 F-03: skip focus | Closed on desktop and phone. |
| Review 1 F-04: route focus and announcement | Closed on forward and back navigation. |
| Review 1 F-05: route titles | Closed for Home, Demo, Privacy, Terms, record, review, and 404 states. |
| Review 1 F-06: deletion promise | Closed by the deletion and reload claim test. |
| Review 1 F-07: missing 404 | Closed. The designed product 404 is correct; the checkout 404 is the unrelated failure in F-01. |
| Review 1 F-08: landing structure | Closed. The preview, steps, privacy/limits, and paid section are present. |
| Review 1 F-09: chrome and metadata | Closed. Navigation, footer, canonical/social metadata, art attribution, and build ID are present. |
| Review 1 F-10 / Verification 1 cache policy | Closed by live immutable asset caching. |
| Review 1 F-11 / Verification 1 response policy | Closed by current live security headers and manifest type. |
| Review 1 F-12: phone targets | **Reopened as F-02.** Home targets pass, but record and legal/dialog links do not. |
| Review 1 F-13: false first-install update | Closed in a fresh live service-worker context. |
| Review 1 F-14: parser detail disclosure | Closed. Changed links show plain recovery text only. |

This product is a static local-first PWA. It has no product backend, tenant
API, server database, health route, or rate limiter, so tenant isolation,
restart persistence, health, and `429`/`Retry-After` checks do not apply.

## Required next steps

1. Register the product in the Sociobot billing engine and prove the live
   checkout no longer returns 404.
2. Give every listed link a 44 × 44 px minimum target without reducing text
   readability or obscuring adjacent controls.
3. Extend the touch-target browser check beyond the empty home page, then run
   independent verification again.

Evidence is stored under `/work/.evidence/verification-3/live/`, including
desktop and phone screenshots, `verify-url.sh` output files, and Lighthouse
JSON.

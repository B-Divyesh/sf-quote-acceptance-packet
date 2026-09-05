# Review 2 — quote acceptance records — FAIL

**Reviewed:** 2026-09-05 UTC  
**Live URL:** <https://quote-acceptance-packet.sociobot.in>  
**Implementation candidate:** `1251dc8aaae640446d250b0c9b490f43beed4d16`  
**Documentation baseline:** `35971c031dda072f02a7b5a9c61631a7eb2bb74b`  
**Verdict:** **FAIL**  
**Finding count:** **1**  
**Untested public claim count:** **1**

ScopeStamp is for a solo consultant or trade business that needs a client to
accept a quote's specific scope before work starts. The first action is **Try
it with sample data**. It opens an isolated populated record.

## Finding

### F-01 — P1 — The completed-record limit claim is only partly tested

The public claim `completed-not-counted` says: “**Accepted and declined**
records do not count toward the three-open-packet limit.” Its required command

```sh
npm run test:claims -- --grep @claim:completed-not-counted
```

passes, but the tagged test seeds only the accepted demo quote, creates three
open drafts, and observes the fourth-draft license dialog. It never creates or
imports a declined quote, then proves that three open drafts are still allowed.
The exact public promise has two states, so the declined half has no observable
clean-sandbox proof. Source behaviour is not a substitute for the required
claim test.

This is an incomplete public claim test, not a failure of the observed product
path. Until the test covers both states (or the copy is narrowed), the product
cannot receive PASS under the claims contract.

## Fresh live review

Fresh Chromium desktop (1280 × 720) and Pixel 5 (393 × 727) contexts opened the
live home page without scrolling. Both showed the job heading **Record a quote
and client decision**, the audience sentence, **Try it with sample data**, and
the three facts: offline after first visit, browser-local records, and three
free open packets. The facts ended at 717.44/720 px on desktop and 649.94/727
px on phone; neither page had horizontal overflow or browser/page-console
errors.

In fresh contexts, the one-click sample opened the realistic Oak studio
shelving record with the $1,750 total. The persistent label was **Demo — sample
data, nothing is saved to your records**. Reset restored the sample. Starting
for real left the real record store at zero records before and after the demo,
which confirms the sample did not write real data.

Fresh desktop and phone keyboard checks focused the skip link and then
`main#main`. Privacy navigation focused its `h1`, announced the route, and set
`Privacy — ScopeStamp`. Demo set `Demo — ScopeStamp`. Axe found zero serious or
critical issues on the live demo in both contexts. A fresh phone service-worker
context controlled `/demo`, reloaded it offline with the sample and demo label
intact, and did not show an update message on first install.

A separate fresh live sample journey opened a verified fingerprinted change
link, accepted it with a fictional client name, and showed the receipt. A
one-character damaged link rendered **This record can’t be opened** and the
plain recovery text, with no parser detail. A fictional live quote with zero
quantity showed the specific invalid-quantity recovery; correcting the quantity
then locked the quote. No payment was submitted and no license was issued.

`/demo`, `/privacy`, `/terms`, the manifest, service worker, robots, and sitemap
returned 200. An unknown route returned deliberate HTTP 404 and the designed
recovery page; this is expected behavior, not a finding. The live home headers
include CSP, anti-framing, permissions policy, referrer policy, and `nosniff`.

## Clean checkout and claims

From this clean checkout, `npm ci` completed with zero reported vulnerabilities.
All declared commands passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 2/2 |
| `npm run build` | PASS — produces `dist/` |
| `npm run test:e2e` | PASS — 16/16 |
| `npm run test:claims` | PASS — 18/18 tagged tests |
| Each of the 18 commands in `.factory/claims.json` | PASS — one tagged test per command |

The passing command result does not close F-01 because the one tagged test for
that claim does not cover its declined-record wording. The other 17 declared
claims have a matching tagged command and exercised observable sandbox outcome.

The fresh build's 20 deployable public files (excluding the source map and
host-only `staticwebapp.config.json`) matched the live response bytes by
SHA-256. `git diff` from the implementation candidate to the documentation
baseline contains only `.factory/handoff.md` and `.factory/verification-2.md`;
the live runtime is therefore candidate `1251dc8`.

The built initial JavaScript is 46.23 kB (14.78 kB gzip) and CSS is 15.29 kB
(4.31 kB gzip), within the static budgets. This is a static local-first PWA;
there is no product backend, tenant database, server restart, health endpoint,
or `429`/`Retry-After` behavior to review.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| F-01 demo sandbox | Closed: fresh `/demo`, persistent label, reset, and real-store isolation passed. |
| F-02 claims registry | Closed structurally: 18 declared commands run; review 2 identifies the separate partial-coverage defect above. |
| F-03 skip focus | Closed: live focus reached `main#main` on desktop and phone. |
| F-04 route focus and announcement | Closed: live Privacy route focused and announced its heading. |
| F-05 route titles | Closed: home, demo, Privacy, Terms, and 404 titles are route-specific. |
| F-06 deletion | Closed: tagged deletion test passes after reload. |
| F-07 designed 404 | Closed: unknown live route is HTTP 404 with return links. |
| F-08 landing structure | Closed: first screen, sample preview, steps, limits/privacy, and price are present. |
| F-09 chrome and metadata | Closed: navigation, footer, canonical/social metadata, and build ID are present. |
| F-10 asset caching | Closed: hashed assets use one-year immutable caching. |
| F-11 response policies | Closed: live CSP, anti-framing, permissions policy, and manifest MIME type are present. |
| F-12 phone targets | Closed: desktop/phone test suite passes the 44 px target check. |
| F-13 false update notice | Closed: fresh service-worker install showed no update notice. |
| F-14 parser detail | Closed: damaged link showed only plain recovery language. |

## Required next step

Extend `@claim:completed-not-counted` to create or import a **declined** record
and prove it also leaves room for three open packets, then repeat this review.
No product code was changed in this review.

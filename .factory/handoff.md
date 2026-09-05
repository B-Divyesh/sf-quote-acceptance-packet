# ScopeStamp repair 2 handoff

## Result

Repair work order `quote-acceptance-packet-repair-2` is complete and deployed at
<https://quote-acceptance-packet.sociobot.in>.

- Runtime implementation SHA: `1251dc8aaae640446d250b0c9b490f43beed4d16`.
- Claim-test repair SHA: `7eed7a241bddf0f669171c8fb7e0d41b5d32d690`.
- Documentation SHA: the later commit containing this handoff.
- Deployment source: clean tracked tree at `7eed7a2`; its application bundle is
  byte-identical to the runtime implementation because the repair changes only
  the claim registry and browser regression test.
- Artifact: static offline-first PWA with separate real and demo IndexedDB
  databases. There is no backend, shared database, tenant API, or health route.

## Repair

The Review 2 finding is closed. The single tagged
`@claim:completed-not-counted` test now proves both halves of its public claim:

1. The accepted demo record leaves room for three open drafts. A fourth open
   draft request shows the license limit.
2. A separate clean scenario locks a quote, records a client decline, downloads
   and imports that receipt, and verifies the declined record remains beside
   three new open drafts. A fourth open draft request shows the license limit.

The check observes the complete browser workflow and resulting records. It
does not mirror the implementation with a source-string assertion.
`.factory/claims.json` now describes both tested states.

No product behavior or public copy changed.

## Clean verification

The documented setup and all gates passed on 5 September 2026:

| Command | Result |
| --- | --- |
| `npm ci` | Pass; 61 packages installed, 0 vulnerabilities |
| `npm test` | Pass; 2/2 unit tests |
| `npm run build` | Pass; `dist/` created |
| `npm run test:e2e` | Pass; 16/16 desktop and phone checks |
| `npm run test:claims` | Pass; 18/18 claims |
| Every `test` command in `.factory/claims.json`, run separately | Pass; 18/18 |

The focused repaired claim passed in 8.8 seconds. Initial production output is
46.23 kB JavaScript (14.78 kB gzip) and 15.29 kB CSS (4.31 kB gzip), below the
static product budgets.

The browser checks cover normal quote, decision, receipt, change, archive,
delete, and print paths. They also cover invalid quantities, changed links,
edited ledgers, the three-open boundary, license verification fixtures, dialog
focus return, keyboard routing, 200% text, dark mode, reduced motion, service
worker installation, and owner/client offline recovery.

## Live verification

The static deploy completed successfully. A post-deploy check found:

- `verify-url.sh` passed with HTTPS 200, `lang=en`, one `h1`, one `main`, image
  alternatives, labelled buttons, and no console errors.
- Fresh 1280×720 desktop and 393×727 phone contexts showed the job, audience,
  sample action, and three facts before scrolling. Their lowest fact ended at
  717.44 px and 649.94 px respectively. Neither layout overflowed horizontally.
- The first action opened the populated accepted $1,750 shelving packet with
  three exclusions, Maya Chen's decision, and the $180 cable-panel change.
- The demo label remained visible on the record. Reset restored the sample.
  Starting for real left the real database at zero records before and after.
- Keyboard activation moved the skip link to `main`. Privacy navigation focused
  and announced its heading. Home, Demo, Privacy, Terms, and 404 titles passed.
- Live Axe checks found zero serious or critical issues on desktop and phone.
- A fresh phone service-worker context reloaded the demo offline. The observed
  unlicensed demo requests stayed on the product origin.
- An unknown route returned deliberate HTTP 404 with the designed recovery.
- CSP, anti-framing, permissions, referrer, and `nosniff` headers are present.
  Hashed JavaScript has one-year immutable caching; HTML and the manifest do not.
- All 20 public build files checked against HTTPS matched by SHA-256.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0.

Screenshots, verifier output, and Lighthouse JSON are in
`/work/.evidence/repair-2/live/`. The catalog description was copied unchanged
to `/work/.evidence/catalog-description.txt`.

## Earlier finding disposition

| Finding | Current disposition |
| --- | --- |
| Review 2: accepted and declined limit claim only half tested | Closed by the accepted and declined receipt scenarios in `@claim:completed-not-counted`. |
| Review 1 F-01: demo absent | Closed; live `/demo`, sample label, reset, start-real, and separate storage passed. |
| Review 1 F-02: claims absent | Closed; 18 declared tagged claims passed as a suite and separately. |
| Review 1 F-03: skip focus | Closed; local suite and fresh live desktop/phone checks reached `main#main`. |
| Review 1 F-04: route focus and announcement | Closed; forward/back suite and live Privacy navigation passed. |
| Review 1 F-05: route titles | Closed; live Home, Demo, Privacy, Terms, and 404 titles passed; record titles pass locally. |
| Review 1 F-06: false deletion claim | Closed; confirmed deletion persists after reload. |
| Review 1 F-07: missing 404 | Closed; unknown live URL returns HTTP 404 with a styled return path. |
| Review 1 F-08: incomplete landing structure | Closed; first screen, preview, three steps, limits/privacy, and paid option are present. |
| Review 1 F-09: incomplete chrome and metadata | Closed; navigation, footer, canonical/social metadata, attribution, and build ID are present. |
| Review 1 F-10 / Verification 1 cache finding | Closed; live hashed assets use `max-age=31536000, immutable`. |
| Review 1 F-11 / Verification 1 response-policy finding | Closed; live CSP, anti-framing, permissions policy, and manifest MIME type passed. |
| Review 1 F-12: phone targets | Closed; both browser projects enforce the 44 px minimum. |
| Review 1 F-13: false first-install update | Closed; first service-worker install does not show an update message. |
| Review 1 F-14: parser detail disclosure | Closed; changed links show only the plain recovery message. |

No earlier minor finding remains open.

## Paid offer and remaining dependency

The advertised Field kit remains a $39 one-time purchase that removes only the
three-open-packet limit after license verification. Free export, accessibility,
and safety behavior remain available. Public registration metadata is at
`/work/.evidence/billing-offer.json`.

The live Sociobot checkout endpoint currently returns HTTP 404, so a real
purchase and entitlement issuance could not be completed. The separate billing
operator must register the offer. No price, credential, or checkout outcome was
invented, and no payment was submitted. Recorded fixtures continue to verify
the product-side checkout destination, token-only verification request, valid
unlock, revoked-license lock, and ungated free features.

This static product has no backend, so tenant isolation, server restart
persistence, health probes, and `429`/`Retry-After` checks do not apply.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run test:claims
```

For the repaired claim alone:

```sh
npm run test:claims -- --grep @claim:completed-not-counted
```

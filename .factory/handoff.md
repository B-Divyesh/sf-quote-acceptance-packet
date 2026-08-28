# ScopeStamp v1 handoff

## Shipped

- A Vite + vanilla TypeScript offline PWA with install manifest, maskable icons,
  versioned service-worker shell caching, explicit offline state and an update
  notice.
- IndexedDB-backed quote drafts with autosave, line items, currency totals,
  exclusions, validity, scope and working terms.
- Immutable quote locking and URL-fragment sharing. Clients can review the
  precise snapshot, explicitly accept or decline under a typed name, add a
  note, print/save PDF, and download a portable receipt.
- Receipt import verifies SHA-256 content integrity, matches the originating
  packet and appends a linked ledger event. Full job archives export/import as
  readable JSON and reject edited or broken event chains.
- Accepted jobs support locked change cards with price and schedule impact,
  their own client review link, acceptance receipt and ledger event.
- Free use supports three open packets and unlimited completed records. The
  $39 one-time Field kit uses the Sociobot hosted checkout/license contract,
  daily cached verification, URL-token capture and paste-to-restore. Core data
  export, safety and accessibility are never gated.
- `/privacy` and `/terms` work as app routes and direct static entry points.
  There is no analytics, runtime CDN, account system or data sync.
- A product-specific field-notebook system, dark treatment and generated hero
  provenance are documented in `.factory/design.md`.

## Verification (2026-08-28, local production preview)

- `npm test`: 2/2 unit tests passed (packet round-trip, totals, packet and
  receipt tamper detection).
- `npm run build`: passed; output at `dist/index.html`. Main production assets:
  37.85 KB JS (12.44 KB gzip), 12.43 KB CSS (3.74 KB gzip), 140 KB desktop hero
  and 44 KB mobile hero.
- `npm run test:e2e`: 4/4 Playwright tests passed across desktop Chromium and
  Pixel 5 / 390px mobile. Covered quote lock/share/accept/receipt import, scoped
  change lock/share/accept/import, print-visible record structure, and offline
  reload with the IndexedDB draft intact.
- Axe browser integration: zero serious or critical violations on the accepted
  record in both viewport projects.
- Browser console assertion: zero errors through the online end-to-end flows.
- Lighthouse 12.8.2 mobile defaults: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100. FCP 0.9s, LCP 1.4s, TBT 0ms, CLS 0, TTI 1.4s.
- The generated notebook hero was visually inspected for artifacts, brands,
  readable pseudo-text and misleading UI. Responsive WebP variants are under
  the 300 KB requirement.

## Run and deploy

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Deploy the contents of `dist/` as a static site. Keep `sw.js` short-cache or
no-cache. The factory still needs to register/switch the paid product in its
billing environment; no product ID or provider secret is stored here.

## Known limits / next steps

- Shared packets are embedded in URL fragments to keep all quote data off the
  server. Very long scopes can produce links that messaging tools truncate;
  the v1 UI is best for compact quotes. A future encrypted file handoff could
  cover unusually large attachments without adding a hosted datastore.
- Identity is intentionally self-asserted (typed name plus explicit checkbox).
  ScopeStamp makes no e-signature legal-effect or identity-verification claim.
- There is no automatic email, cloud sync or multi-device reconciliation; these
  are deliberate privacy/scope boundaries, not hidden paid dependencies.
- This worker image had no working AVIF encoder, so the production uses small,
  responsive WebP sources with fixed dimensions rather than mislabeled or
  invalid AVIF files.

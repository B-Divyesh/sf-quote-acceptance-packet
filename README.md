# ScopeStamp

ScopeStamp is a private, offline-first quote acceptance notebook for solo
consultants and trade businesses. It locks the exact scope, exclusions and
price into a shareable review link; records a named accept/decline receipt; and
keeps later change approvals in one tamper-evident event chain.

It is intentionally not a CRM, payment tool, identity service or legal-terms
generator. A ScopeStamp receipt records stated intent and timestamp provenance;
it does not claim any particular legal effect.

Live: <https://quote-acceptance-packet.sociobot.in>

## How it works

1. Create a quote and state both included work and exclusions.
2. Lock the revision. ScopeStamp creates a SHA-256 fingerprint and an immutable
   URL-encoded snapshot.
3. Send the decision link. The client reviews it, types their name, explicitly
   accepts or declines, and downloads a JSON receipt.
4. Import that receipt into the original quote. The validated decision joins
   the chained local ledger.
5. For accepted jobs, repeat the same round trip with scoped change cards.
6. Print any packet to PDF and export/import complete JSON archives at any time.

Quote data is held in IndexedDB on the current device. Shared content lives in
the URL fragment, which is not sent to the web server. There are no accounts,
analytics, external fonts or runtime CDNs.

The free notebook supports three simultaneously open packets and unlimited
completed archives. A one-time $39 Field kit license unlocks unlimited active
packets through the Sociobot hosted checkout; export and accessibility are
never gated.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

`npm run build` is the exact production build command. It creates `dist/` with
`dist/index.html` plus direct static entry points for `/privacy` and `/terms`.
The browser suite uses Playwright 1.58.2 and covers desktop, a 390px mobile
viewport, axe serious/critical checks, receipt exchange, change acceptance and
an offline reload.

## Deploy

Upload the contents of `dist/` to the static host. Serve `sw.js` with no-cache
or a short cache lifetime; hashed `/assets/` files can be immutable. No backend,
environment variable or secret is needed. Billing redirects to the Sociobot
API and product registration is handled outside this repository.

See [.factory/brief.json](.factory/brief.json) for product scope and
[.factory/design.md](.factory/design.md) for the original visual system and
image provenance.

## License

MIT — see [LICENSE](LICENSE).

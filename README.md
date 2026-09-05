# ScopeStamp

ScopeStamp records quote scope, exclusions, prices, client decisions, and later
changes. It is for solo consultants and trade businesses that need one clear
record before work starts.

Try the isolated sample at
<https://quote-acceptance-packet.sociobot.in/demo>. The sample uses a separate
IndexedDB database and never reads or changes real records. See
[.factory/demo.md](.factory/demo.md) for its contents and reset behavior.

ScopeStamp is not a CRM, payment tool, identity service, or legal-terms
generator. A receipt records the stated choice and device timestamp. It does
not promise a particular legal effect.

## What it does

1. Write a quote with included work, line prices, exclusions, and terms.
2. Lock the revision and copy its fingerprinted review link.
3. Let the client accept or decline and download a named receipt.
4. Import the receipt into the quote's event chain.
5. Record later changes through the same review and receipt flow.
6. Print a packet or export and import its complete JSON archive.
7. Delete a quote from the current browser when it is no longer needed.

The app and warmed shared packets reload offline after the first visit. Quote
records stay in IndexedDB in the current browser without an account. Shared
packet content stays in the URL fragment and is not sent in web requests. The
unlicensed app loads no analytics, ads, external fonts, tracking scripts, or
runtime CDN resources.

The free version allows three open packets. Accepted and declined records do
not count toward that limit. Field kit costs $39 once and removes the limit
after license verification. Checkout is hosted by Sociobot. License checks send
only the token. A revoked license no longer removes the limit. Archive export
and accessible controls remain available without a license.

Every statement above has an observable browser check in
[.factory/claims.json](.factory/claims.json).

## Develop and verify

Use Node.js 20 or newer.

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run test:claims
```

`npm run build` creates `dist/`. The browser checks use Playwright 1.58.2.
The claim registry lists the exact command for each public claim.

## Deploy

Upload the contents of `dist/` to Azure Static Web Apps. The included
`staticwebapp.config.json` sets response policies, cache rules, the manifest
type, and the designed 404 response. No product backend or product secret is
required.

See [.factory/brief.json](.factory/brief.json) for scope and
[.factory/design.md](.factory/design.md) for the visual system and asset
provenance.

## License

MIT — see [LICENSE](LICENSE).

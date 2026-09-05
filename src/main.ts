import './style.css';
import { db, isDemoMode } from './db';
import { BUY_URL, cachedLicense, captureLicense, saveLicense, verifyLicense } from './license';
import { decodePacket, encodePacket, makeChangePacket, makeLedgerEvent, makeQuotePacket, makeReceipt, money, quoteTotal, sha256, shortHash, verifyPacket, verifyReceipt } from './record';
import { seedDemo } from './sample';
import type { Archive, ChangeCard, LedgerEvent, Packet, Quote, Receipt } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
let toastTimer = 0;
let autosaveTimer = 0;
let editorError = '';
let focusAfterRender = false;

const escape = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]!);
const id = () => crypto.randomUUID();
const isoDate = (value: string) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)) : 'Not set';
const dateTime = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const statusLabel = (status: Quote['status']) => ({ draft: 'Draft', awaiting: 'Awaiting decision', accepted: 'Accepted', declined: 'Declined' })[status];
const statusSymbol = (status: Quote['status']) => ({ draft: '○', awaiting: '◷', accepted: '✓', declined: '×' })[status];
const currentLicense = (): ReturnType<typeof cachedLicense> => isDemoMode() ? { token: '', unlocked: false } : cachedLicense();

if (!isDemoMode()) captureLicense();

function shell(content: string, review = false): string {
  return `<div class="shell">
    ${isDemoMode() ? `<aside class="demo-bar" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved to your records</strong><span><button class="demo-control" data-action="reset-demo">Reset demo</button><button class="demo-control" data-action="start-real">Start for real</button></span></aside>` : ''}
    <header class="topbar">
      <a class="brand" href="${isDemoMode() ? '/demo' : '/'}" data-route><img src="/icon.svg" alt="" width="36" height="36"><span>ScopeStamp</span></a>
      <nav aria-label="Main navigation"><a href="/demo" data-route>Demo</a><a href="/privacy" data-route>Privacy</a></nav>
      <div class="top-actions">
        <span class="offline-flag" role="status">Offline · saved locally</span>
        ${review ? '' : `${isDemoMode() ? '' : `<button class="button quiet small" data-action="license">${currentLicense().unlocked ? 'Field kit active' : currentLicense().reason ? 'License inactive' : 'View Field kit'}</button>`}<button class="button primary small" data-action="new-quote">New quote</button>`}
      </div>
    </header>
    <main id="main" class="workbench" tabindex="-1">${content}</main>
    <footer class="app-footer">
      <span>ScopeStamp records quote decisions and scope changes.</span>
      <span class="footer-links"><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a><a href="https://sociobot.in" rel="external">Built by Param Factory</a><span>Version 1.1.0</span><span>Original generated notebook artwork</span></span>
    </footer>
    <div id="toast-live" aria-live="polite" aria-atomic="true"></div>
    <div id="route-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>
  </div>`;
}

function toast(message: string): void {
  const live = document.querySelector('#toast-live');
  if (!live) return;
  live.innerHTML = `<div class="toast">${escape(message)}</div>`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { if (live) live.innerHTML = ''; }, 4200);
}

function route(path: string): void {
  history.pushState({}, '', path);
  focusAfterRender = true;
  void render();
}

function newQuote(): Quote {
  const createdAt = new Date().toISOString();
  const valid = new Date(); valid.setDate(valid.getDate() + 30);
  return {
    id: id(), reference: `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    businessName: '', businessEmail: '', clientName: '', clientEmail: '', projectTitle: '', summary: '',
    currency: 'USD', validUntil: valid.toISOString().slice(0, 10),
    items: [{ id: id(), description: '', quantity: 1, unitPrice: 0 }], exclusions: [''], terms: '',
    createdAt, updatedAt: createdAt, status: 'draft', revision: 1, events: [], changes: [],
  };
}

function hero(): string {
  return `<section class="hero" aria-labelledby="home-title">
    <div class="hero-copy">
      <span class="eyebrow">Quote acceptance records</span>
      <h1 id="home-title">Record a quote and client decision</h1>
      <p>For consultants and trade businesses who need the agreed scope, exclusions, price, and later changes in one record.</p>
      <div class="hero-actions"><a class="button primary" href="/demo" data-route>Try it with sample data</a><button class="button" data-action="new-quote">Start your first quote</button><button class="button quiet" data-action="import">Import a record</button></div>
      <p class="action-note">The sample opens a completed quote without changing your records.</p>
      <ul class="proof-line"><li>Works offline after your first visit</li><li>Records stay in this browser</li><li>Free for three open packets</li></ul>
    </div>
    <figure class="hero-figure">
      <picture><source media="(max-width: 760px)" srcset="/assets/scopestamp-notebook-768.webp"><img src="/assets/scopestamp-notebook.webp" width="1280" height="853" alt="An open graph-paper field notebook with measured drawings, a date stamp and an unlabelled red approval mark" fetchpriority="high" decoding="async"></picture>
      <figcaption>A dated record keeps the agreed work together.</figcaption>
    </figure>
  </section>
  <section class="landing-section preview-section" aria-labelledby="preview-title">
    <div><span class="eyebrow">Example record</span><h2 id="preview-title">See the accepted work at a glance</h2><p>The sample shows a $1,750 shelving quote, three exclusions, a named decision, and one later change.</p><a class="text-link" href="/demo" data-route>Open the full sample</a></div>
    <div class="preview-record"><span class="status accepted">✓ Accepted</span><h3>Oak studio shelving</h3><dl><div><dt>Client</dt><dd>Maya Chen</dd></div><div><dt>Quoted total</dt><dd>$1,750.00</dd></div><div><dt>Change</dt><dd>+$180.00 awaiting decision</dd></div></dl></div>
  </section>
  <section class="landing-section" aria-labelledby="how-title"><span class="eyebrow">How it works</span><h2 id="how-title">Create, share, and keep the record</h2><ol class="steps"><li><strong>Write the quote.</strong><span>List the work, prices, exclusions, and terms.</span></li><li><strong>Send the locked link.</strong><span>Your client accepts or declines the exact packet.</span></li><li><strong>Keep later changes together.</strong><span>Add each change and import its decision receipt.</span></li></ol></section>
  <section class="landing-section split-section" aria-labelledby="limits-title"><div><span class="eyebrow">Limits and privacy</span><h2 id="limits-title">A record tool, not a contract service</h2><p>ScopeStamp does not verify identity, write legal terms, send email, take payment, or promise legal effect.</p><p>Quote records stay in this browser. Shared links can be read by anyone who receives them.</p></div><div><span class="eyebrow">One-time option</span><h2>Field kit costs $39 once</h2><p>The free version allows three open packets. Field kit removes that open-packet limit after license verification.</p><button class="button" data-action="license">View the Field kit</button></div></section>`;
}

async function home(): Promise<string> {
  if (isDemoMode()) await seedDemo();
  const quotes = await db.quotes();
  if (!quotes.length) return hero();
  const accepted = quotes.filter(q => q.status === 'accepted').length;
  return `<section>
    <div class="page-head"><div><span class="eyebrow">Local job index</span><h1>Your scope records</h1><p class="index-meta">${quotes.length} packet${quotes.length === 1 ? '' : 's'} · ${accepted} accepted · stored only in this browser</p></div><div class="page-actions"><button class="button" data-action="import">Import record</button><button class="button primary" data-action="new-quote">New quote</button></div></div>
    <ul class="quote-list">${quotes.map(q => `<li class="quote-row ${q.status}">
      <div><span class="status ${q.status}">${statusSymbol(q.status)} ${statusLabel(q.status)}</span><h2><a href="#quote/${q.id}" data-route>${escape(q.projectTitle || 'Untitled quote')}</a></h2><div class="row-meta"><span>${escape(q.reference)}</span><span>${escape(q.clientName || 'Client not set')}</span><span>${money(quoteTotal(q), q.currency)}</span><span>Updated ${dateTime(q.updatedAt)}</span></div></div>
      <a class="button" href="#quote/${q.id}" data-route>${q.status === 'draft' ? 'Continue draft' : 'Open record'}</a>
    </li>`).join('')}</ul>
    ${isDemoMode() ? '' : `<div class="license-note"><strong>${currentLicense().unlocked ? 'Field kit active.' : currentLicense().reason ? 'License no longer active.' : 'Free version: three open packets.'}</strong> ${currentLicense().unlocked ? 'The open-packet limit is removed in this browser.' : 'Accepted and declined records do not count toward the limit. Field kit costs $39 once.'} <button class="button quiet small" data-action="license">${currentLicense().unlocked ? 'Manage license' : currentLicense().reason ? 'Check or replace license' : 'View the Field kit'}</button></div>`}
  </section>`;
}

function editor(quote: Quote): string {
  return `<section>
    <div class="page-head"><div><span class="eyebrow">Draft · revision ${quote.revision}</span><h1>${escape(quote.projectTitle || 'New quote')}</h1><p class="index-meta">Nothing is shared until you lock this revision.</p></div><a class="button" href="/" data-route>Back to records</a></div>
    ${editorError ? `<div class="error-box" role="alert"><strong>Couldn’t lock this quote.</strong><br>${escape(editorError)}</div>` : ''}
    <form id="quote-form" class="sheet" novalidate><p class="required-note"><span aria-hidden="true">*</span> Required fields</p>
      <section class="form-section"><span class="section-kicker">01 · Record heading</span><h2>Who and what</h2><div class="field-grid">
        ${field('businessName','Your business name',quote.businessName,true)}${field('businessEmail','Your email',quote.businessEmail,true,'email')}
        ${field('clientName','Client name',quote.clientName,true)}${field('clientEmail','Client email',quote.clientEmail,false,'email')}
        ${field('projectTitle','Project / job title',quote.projectTitle,true,'text','full')}${field('reference','Quote reference',quote.reference,true)}
        <div class="field"><label for="currency">Currency</label><select id="currency" name="currency">${['USD','GBP','EUR','CAD','AUD','NZD','INR'].map(c => `<option ${quote.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        ${field('validUntil','Valid until',quote.validUntil,true,'date')}
        <div class="field full"><label for="summary">Scope summary</label><textarea id="summary" name="summary" required>${escape(quote.summary)}</textarea><small>Describe the outcome and boundaries in plain language.</small></div>
      </div></section>
      <section class="form-section"><span class="section-kicker">02 · Included work</span><h2>Line items</h2>
        <table class="line-items"><thead><tr><th>Work / deliverable</th><th>Qty</th><th>Unit price</th><th class="amount">Amount</th><th><span class="sr-only">Remove</span></th></tr></thead><tbody>
        ${quote.items.map((item, index) => `<tr><td data-label="Work / deliverable"><input aria-label="Item ${index + 1} description" name="item-description" value="${escape(item.description)}" required></td><td data-label="Quantity"><input aria-label="Item ${index + 1} quantity" name="item-quantity" type="number" min="0" step="0.01" value="${item.quantity}" required></td><td data-label="Unit price"><input aria-label="Item ${index + 1} unit price" name="item-price" type="number" min="0" step="0.01" value="${item.unitPrice}" required></td><td class="amount" data-label="Amount">${money(item.quantity * item.unitPrice, quote.currency)}</td><td><button type="button" class="button quiet icon-button" data-action="remove-item" data-index="${index}" aria-label="Remove item ${index + 1}">×</button></td></tr>`).join('')}
        </tbody></table><button type="button" class="button small" data-action="add-item">+ Add line item</button><p class="form-total">Draft total: ${money(quoteTotal(quote), quote.currency)}</p>
      </section>
      <section class="form-section"><span class="section-kicker">03 · Outside the line</span><h2>Exclusions and working terms</h2><div class="field-grid"><div class="field full"><label for="exclusions">Not included</label><textarea id="exclusions" name="exclusions" required>${escape(quote.exclusions.join('\n'))}</textarea><small>Put each exclusion on its own line. Make assumptions explicit.</small></div><div class="field full"><label for="terms">Payment / schedule notes</label><textarea id="terms" name="terms">${escape(quote.terms)}</textarea><small>Use your own plain terms. ScopeStamp does not generate legal language.</small></div></div></section>
      <div class="form-bar"><span class="autosave" id="autosave">Draft saved on this device</span><div><button type="button" class="button quiet" data-action="save-draft">Save draft</button><button class="button primary" type="submit">Lock &amp; prepare to share</button></div></div>
    </form>
  </section>`;
}

function field(name: string, label: string, value: string, required = false, type = 'text', extra = ''): string {
  return `<div class="field ${extra}"><label for="${name}">${label}${required ? ' <span aria-hidden="true">*</span>' : ''}</label><input id="${name}" name="${name}" type="${type}" value="${escape(value)}" ${required ? 'required' : ''}></div>`;
}

function packetBody(packet: Packet): string {
  if (packet.kind === 'change') {
    return `<header class="packet-head"><div><span class="eyebrow">Scoped change · ${escape(packet.quoteReference)}</span><h1>${escape(packet.change.title)}</h1><p>${escape(packet.projectTitle)} · for ${escape(packet.clientName)}</p></div><div class="packet-total">${money(packet.change.priceDelta, packet.currency)}</div></header>
      <section class="packet-section"><h2>What changes</h2><p>${escape(packet.change.description)}</p><h3>Schedule impact</h3><p>${escape(packet.change.scheduleImpact || 'No schedule impact stated.')}</p></section>`;
  }
  const q = packet.quote;
  const total = q.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return `<header class="packet-head"><div><span class="eyebrow">Quote for ${escape(q.clientName)}</span><h1>${escape(q.projectTitle)}</h1><p>${escape(q.businessName)} · valid until ${isoDate(q.validUntil)}</p><span class="reference">${escape(q.reference)} · revision ${q.revision}</span></div><div class="packet-total">${money(total, q.currency)}</div></header>
    <section class="packet-section"><h2>Scope</h2><p>${escape(q.summary)}</p><table class="scope-table"><thead><tr><th>Included work</th><th class="detail-column">Qty × rate</th><th>Amount</th></tr></thead><tbody>${q.items.map(item => `<tr><td>${escape(item.description)}</td><td class="detail-column">${item.quantity} × ${money(item.unitPrice,q.currency)}</td><td>${money(item.quantity * item.unitPrice,q.currency)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2">Quoted total</td><td>${money(total,q.currency)}</td></tr></tfoot></table></section>
    <section class="packet-section"><h2>Not included</h2><ul>${q.exclusions.filter(Boolean).map(x => `<li>${escape(x)}</li>`).join('') || '<li>No exclusions were stated.</li>'}</ul></section>
    ${q.terms ? `<section class="packet-section"><h2>Working terms</h2><p>${escape(q.terms)}</p></section>` : ''}`;
}

async function reviewPage(encoded: string): Promise<string> {
  try {
    const packet = decodePacket(encoded);
    if (!await verifyPacket(packet)) throw new Error('The packet contents no longer match its fingerprint. Ask the sender for a fresh link.');
    const receipt = await db.receipt(packet.packetHash);
    return `<article class="packet sheet">${packetBody(packet)}
      <aside class="marginalia"><strong>Fingerprint verified</strong><div class="hash">SHA-256 ${escape(packet.packetHash)}</div><p>This checks whether this shared packet changed after it was locked. It is a practical evidence record, not a claim about electronic-signature law.</p></aside>
      ${receipt ? receiptPanel(receipt) : decisionForm(packet)}
      <div class="decision-buttons no-print"><button class="button" data-action="print">Print / save PDF</button></div>
    </article>`;
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith('The packet contents')
      ? error.message
      : 'The shared link is incomplete or has changed.';
    return `<section class="empty-note"><span class="eyebrow">Packet error</span><h1>This record can’t be opened</h1><p>${escape(message)}</p><p>Ask the sender to copy a fresh ScopeStamp link.</p></section>`;
  }
}

function decisionForm(packet: Packet): string {
  const label = packet.kind === 'quote' ? 'quote, scope, exclusions and stated terms' : 'scoped change and its price and schedule impact';
  return `<section class="decision-panel"><span class="section-kicker">Your recorded decision</span><h2>Accept or decline this ${packet.kind}</h2><p>Your typed name, choice, device time and timezone are recorded in a downloadable receipt. This is not legal advice or a promise of legal effect.</p>
    <form id="decision-form"><input type="hidden" name="packet" value="${escape(encodePacket(packet))}"><p class="required-note"><span aria-hidden="true">*</span> Required fields</p><div class="field"><label for="actorName">Your full name *</label><input id="actorName" name="actorName" autocomplete="name" required></div><div class="field"><label for="decisionNote">Note (optional)</label><textarea id="decisionNote" name="note"></textarea></div><label class="check-line"><input type="checkbox" name="acknowledge" required><span>I have reviewed this ${label} and intend the decision I choose below.</span></label><div class="decision-buttons"><button class="button primary" name="decision" value="accepted">✓ Accept ${packet.kind}</button><button class="button danger" name="decision" value="declined">× Decline ${packet.kind}</button></div></form>
  </section>`;
}

function receiptPanel(receipt: Receipt): string {
  return `<section class="decision-panel"><span class="section-kicker">Decision receipt</span><div class="decision-stamp ${receipt.decision}">${receipt.decision === 'accepted' ? '✓ Accepted' : '× Declined'}</div><p>Recorded for <strong>${escape(receipt.actorName)}</strong> on ${dateTime(receipt.occurredAt)} (${escape(receipt.timezone)}).</p>${receipt.note ? `<p>Note: ${escape(receipt.note)}</p>` : ''}<div class="hash">Receipt SHA-256 ${escape(receipt.hash)}</div><div class="decision-buttons no-print"><button class="button primary" data-action="download-receipt" data-hash="${escape(receipt.packetHash)}">Download receipt</button></div></section>`;
}

async function quoteDetail(quote: Quote): Promise<string> {
  if (quote.status === 'draft') return editor(quote);
  if (!quote.encodedPacket) return `<h1>Record unavailable</h1><p>This quote is missing its locked packet.</p>`;
  const packet = decodePacket(quote.encodedPacket);
  return `<article class="packet sheet">
    <div class="page-actions no-print"><a class="button quiet" href="${isDemoMode() ? '/demo' : '/'}" data-route>← Records</a><button class="button" data-action="print">Print / PDF</button><button class="button" data-action="export" data-id="${quote.id}">Export archive</button><button class="button" data-action="share" data-id="${quote.id}">Share decision link</button><button class="button danger" data-action="delete" data-id="${quote.id}">Delete record</button></div>
    ${packetBody(packet)}
    <aside class="marginalia"><span class="status ${quote.status}">${statusSymbol(quote.status)} ${statusLabel(quote.status)}</span><p><strong>Locked fingerprint</strong></p><div class="hash">SHA-256 ${escape(quote.packetHash)}</div><p>Locked ${dateTime(packet.kind === 'quote' ? packet.lockedAt : quote.updatedAt)}. Device timezone: ${escape(quote.events[0]?.timezone || 'not recorded')}.</p></aside>
    ${quote.status === 'awaiting' ? `<section class="packet-section no-print"><h2>Waiting for the client</h2><p>Send the decision link. The client can review offline after first load, choose accept or decline, and return the downloaded receipt.</p><div class="decision-buttons"><button class="button primary" data-action="share" data-id="${quote.id}">Copy / share link</button><button class="button" data-action="import" data-id="${quote.id}">Import client receipt</button></div></section>` : `<section class="packet-section"><h2>Recorded decision</h2>${quote.events.filter(e => e.type === 'quote_accepted' || e.type === 'quote_declined').map(event => `<div class="decision-stamp ${quote.status}">${quote.status === 'accepted' ? '✓ Accepted' : '× Declined'}</div><p>Recorded for <strong>${escape(event.actor)}</strong> on ${dateTime(event.occurredAt)}.</p>`).join('')}</section>`}
    ${quote.status === 'accepted' ? changesSection(quote) : ''}
    ${ledgerSection(quote.events)}
  </article>`;
}

function changesSection(quote: Quote): string {
  return `<section class="packet-section"><div class="page-head"><div><span class="section-kicker">After acceptance</span><h2>Scoped changes</h2></div><button class="button no-print" data-action="add-change" data-id="${quote.id}">Add change card</button></div>
    ${quote.changes.length ? `<div class="change-list">${quote.changes.map(c => `<article class="change-card"><div class="change-head"><div><span class="status ${c.status}">${c.status === 'awaiting' ? '◷ Awaiting decision' : c.status === 'accepted' ? '✓ Accepted' : '× Declined'}</span><h3>${escape(c.title)}</h3></div><span class="change-delta">${c.priceDelta >= 0 ? '+' : ''}${money(c.priceDelta, quote.currency)}</span></div><p>${escape(c.description)}</p><p><strong>Schedule:</strong> ${escape(c.scheduleImpact || 'No impact stated')}</p><div class="decision-buttons no-print">${c.status === 'awaiting' ? `<button class="button" data-action="share-change" data-id="${quote.id}" data-change="${c.id}">Share change link</button><button class="button" data-action="import" data-id="${quote.id}">Import receipt</button>` : ''}</div></article>`).join('')}</div>` : '<p class="empty-note">No changes recorded. If the job moves outside the accepted scope, add a change card before the extra work starts.</p>'}
  </section>`;
}

function ledgerSection(events: LedgerEvent[]): string {
  return `<section class="packet-section"><details><summary><strong>Record details · ${events.length} ledger entr${events.length === 1 ? 'y' : 'ies'}</strong></summary><ol class="ledger">${events.map(event => `<li><strong>${escape(event.type.replaceAll('_',' '))}</strong><span>${dateTime(event.occurredAt)} · ${escape(event.timezone)}</span><div class="hash">${escape(event.hash)}</div></li>`).join('')}</ol><p class="help">Each entry includes the previous entry’s hash. Editing an exported archive breaks verification.</p></details></section>`;
}

function legalPage(kind: 'privacy' | 'terms'): string {
  if (kind === 'privacy') return `<article class="legal"><span class="eyebrow">Last updated 5 September 2026</span><h1>Privacy</h1><h2>Your records stay in your browser</h2><p>ScopeStamp stores quotes, client details, decisions, and change history in IndexedDB in this browser. ScopeStamp does not sync that content.</p><p>Shared links contain a locked quote in the URL fragment. Browsers do not send URL fragments to the web server. Anyone with a shared link can read its contents.</p><h2>Demo data stays separate</h2><p>The demo uses a separate browser database. Resetting or leaving the demo clears that sample without reading or changing your records.</p><h2>Billing and licenses</h2><p>Sociobot hosts checkout and license verification. Dodo is its merchant of record. ScopeStamp sends the license token only when it checks a license.</p><p>Payment details do not enter ScopeStamp.</p><h2>Network use</h2><p>ScopeStamp includes no analytics, advertising, external fonts, or tracking scripts. Web-server access logs may include an IP address and request details.</p><h2>Remove or export a record</h2><p>Open a quote and choose “Delete record” to remove it from this browser. “Export archive” downloads a copy first.</p><p>Clearing this site’s browser data also removes its records.</p><h2>Contact</h2><p>Privacy questions: <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p></article>`;
  return `<article class="legal"><span class="eyebrow">Last updated 5 September 2026</span><h1>Terms</h1><h2>A records utility, not legal advice</h2><p>ScopeStamp helps you describe work and preserve a tamper-evident history. It does not create legal terms, verify identity, or witness a signature.</p><p>A recorded decision may not have a particular legal effect. You are responsible for your wording and local recordkeeping requirements.</p><h2>Your responsibilities</h2><p>Only enter and share information you may use. Check scope, pricing, exclusions, and contact details before locking a revision.</p><p>Keep exported archives in a safe place. Clearing browser storage can remove local records.</p><h2>One-time Field kit</h2><p>Field kit costs $39 once. A verified license removes the three-open-packet limit in the current browser.</p><p>Sociobot hosts checkout and license verification. Dodo is its merchant of record and handles refunds. Refunded or revoked licenses no longer remove the limit.</p><p>Archive export, accessibility, and safety features remain free.</p><h2>Warranty and liability</h2><p>The software is provided “as is” without warranty. Where law allows, the authors are not liable for lost records or indirect damages.</p><p>These terms do not limit rights that the law does not allow us to limit.</p><h2>Contact</h2><p>Questions: <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p></article>`;
}

function parseEditorForm(quote: Quote): Quote {
  const form = document.querySelector<HTMLFormElement>('#quote-form');
  if (!form) return quote;
  const data = new FormData(form);
  const descriptions = data.getAll('item-description').map(String);
  const quantities = data.getAll('item-quantity').map(Number);
  const prices = data.getAll('item-price').map(Number);
  return {
    ...quote,
    businessName: String(data.get('businessName') || '').trim(), businessEmail: String(data.get('businessEmail') || '').trim(),
    clientName: String(data.get('clientName') || '').trim(), clientEmail: String(data.get('clientEmail') || '').trim(),
    projectTitle: String(data.get('projectTitle') || '').trim(), reference: String(data.get('reference') || '').trim(),
    currency: String(data.get('currency') || 'USD'), validUntil: String(data.get('validUntil') || ''), summary: String(data.get('summary') || '').trim(), terms: String(data.get('terms') || '').trim(),
    exclusions: String(data.get('exclusions') || '').split('\n').map(x => x.trim()).filter(Boolean),
    items: descriptions.map((description, index) => ({ id: quote.items[index]?.id || id(), description: description.trim(), quantity: quantities[index] || 0, unitPrice: prices[index] || 0 })),
    updatedAt: new Date().toISOString(),
  };
}

function validationError(quote: Quote): string {
  if (!quote.businessName || !quote.businessEmail || !quote.clientName || !quote.projectTitle || !quote.reference || !quote.validUntil || !quote.summary) return 'Complete every required heading and scope field.';
  if (!quote.items.length || quote.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) return 'Each line item needs a description, a quantity above zero and a non-negative price.';
  if (!quote.exclusions.length) return 'State at least one exclusion. If nothing is excluded, write that explicitly.';
  return '';
}

async function saveDraft(quote: Quote, quiet = false): Promise<Quote> {
  const updated = parseEditorForm(quote);
  await db.saveQuote(updated);
  if (!quiet) toast('Draft saved on this device.');
  return updated;
}

function openDialog(content: string): void {
  const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.innerHTML = `<div class="modal-inner">${content}</div>`;
  const heading = dialog.querySelector<HTMLElement>('h2, h3');
  if (heading) { heading.id = `dialog-${id()}`; dialog.setAttribute('aria-labelledby', heading.id); }
  dialog.addEventListener('close', () => { dialog.remove(); returnFocus?.focus(); });
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLElement>('input, button, a')?.focus();
}

function licenseDialog(): void {
  const state = currentLicense();
  openDialog(`<span class="eyebrow">One-time purchase · $39</span><h2>Unlock the Field kit</h2><p>The free notebook holds three open packets, with unlimited completed archives. Field kit adds unlimited active packets and keeps every data export available.</p><p><a class="button primary" href="${BUY_URL}">Buy once for $39</a></p><hr><h3>Restore a purchase</h3><form id="license-form"><div class="field"><label for="licenseToken">License token</label><input id="licenseToken" name="token" value="${escape(state.token)}" autocomplete="off" required></div><div class="modal-actions"><button type="button" class="button quiet" data-action="close-dialog">Cancel</button><button class="button" type="submit">Verify license</button></div></form><p class="help">Checkout is hosted by Sociobot/Dodo, the merchant of record. Refunds are handled there and revoke the license. See <a href="/privacy" data-route>privacy</a> and <a href="/terms" data-route>terms</a>.</p>`);
}

function download(value: unknown, filename: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareEncoded(encoded: string, title: string): Promise<void> {
  const url = `${location.origin}${location.pathname}#review=${encoded}`;
  await navigator.clipboard.writeText(url);
  if (navigator.share) {
    try { await navigator.share({ title, text: 'Review and record your decision in ScopeStamp.', url }); return; }
    catch (error) { if ((error as DOMException).name === 'AbortError') return; }
  }
  toast('Decision link copied.');
}

async function importFile(): Promise<void> {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json'; input.className = 'sr-only'; input.setAttribute('aria-label', 'Choose ScopeStamp record'); document.body.append(input);
  input.onchange = async () => {
    try {
      const file = input.files?.[0]; if (!file) return;
      const value = JSON.parse(await file.text()) as Receipt | Archive;
      if (value.format === 'scopestamp-receipt') await importReceipt(value);
      else if (value.format === 'scopestamp-archive') await importArchive(value);
      else throw new Error('Choose a ScopeStamp receipt or archive JSON file.');
      await render();
    } catch (error) { toast(error instanceof Error ? error.message : 'That file could not be imported.'); }
    finally { input.remove(); }
  };
  input.click();
}

async function importReceipt(receipt: Receipt): Promise<void> {
  if (!await verifyReceipt(receipt)) throw new Error('Receipt verification failed. The file may have changed.');
  const quotes = await db.quotes();
  const quote = quotes.find(q => receipt.kind === 'quote' ? q.packetHash === receipt.packetHash : q.changes.some(c => c.packetHash === receipt.packetHash));
  if (!quote) throw new Error('No matching quote or change exists on this device. Import its archive first.');
  if (quote.events.some(event => event.payload.receiptHash === receipt.hash)) { toast('This receipt is already in the record.'); return; }
  if (receipt.kind === 'quote' && quote.status !== 'awaiting') throw new Error('This quote already has a recorded decision.');
  if (receipt.kind === 'change') {
    const change = quote.changes.find(c => c.packetHash === receipt.packetHash);
    if (!change || change.status !== 'awaiting') throw new Error('This change already has a recorded decision.');
    change.status = receipt.decision; change.decision = receipt;
  } else quote.status = receipt.decision;
  const event = await makeLedgerEvent({ type: `${receipt.kind}_${receipt.decision}` as LedgerEvent['type'], occurredAt: receipt.occurredAt, timezone: receipt.timezone, actor: receipt.actorName, payload: { receiptHash: receipt.hash, packetHash: receipt.packetHash, note: receipt.note }, previousHash: quote.events.at(-1)?.hash ?? null });
  quote.events.push(event); quote.updatedAt = new Date().toISOString(); await db.saveQuote(quote);
  toast(`${receipt.kind === 'quote' ? 'Quote' : 'Change'} marked ${receipt.decision}.`);
}

async function importArchive(archive: Archive): Promise<void> {
  if (archive.version !== 1 || !archive.quote?.id) throw new Error('This archive version is not supported.');
  for (let i = 0; i < archive.quote.events.length; i++) {
    const { id: _id, hash, ...body } = archive.quote.events[i];
    if (hash !== await sha256(body)) throw new Error(`Archive ledger verification failed at entry ${i + 1}.`);
    if (i > 0 && body.previousHash !== archive.quote.events[i - 1].hash) throw new Error(`Archive chain is broken at entry ${i + 1}.`);
  }
  await db.saveQuote(archive.quote); toast(`Imported ${archive.quote.reference}.`);
}

async function createNew(): Promise<void> {
  const quotes = await db.quotes();
  if (!currentLicense().unlocked && quotes.filter(q => q.status === 'draft' || q.status === 'awaiting').length >= 3) { licenseDialog(); return; }
  const quote = newQuote(); await db.saveQuote(quote); route(`#quote/${quote.id}/edit`);
}

function updatePageIdentity(notFound = false): void {
  const title = notFound ? 'Page not found — ScopeStamp'
    : location.hash.startsWith('#review=') ? 'Client review — ScopeStamp'
      : location.pathname === '/privacy' ? 'Privacy — ScopeStamp'
        : location.pathname === '/terms' ? 'Terms — ScopeStamp'
          : isDemoMode() ? 'Demo — ScopeStamp'
            : location.hash.startsWith('#quote/') ? 'Quote record — ScopeStamp'
              : 'ScopeStamp — record quote decisions';
  document.title = title;
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = `${location.origin}${['/', '/privacy', '/terms', '/demo'].includes(location.pathname) ? location.pathname : '/'}`;
  if (!focusAfterRender) return;
  const heading = document.querySelector<HTMLElement>('main h1');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start' });
    const live = document.querySelector('#route-live');
    if (live) live.textContent = heading.textContent || title;
  }
  focusAfterRender = false;
}

async function render(): Promise<void> {
  document.documentElement.classList.toggle('offline', !navigator.onLine);
  let notFound = false;
  try {
    const hash = location.hash;
    if (hash.startsWith('#review=')) app.innerHTML = shell(await reviewPage(hash.slice(8)), true);
    else if (location.pathname === '/privacy') app.innerHTML = shell(legalPage('privacy'));
    else if (location.pathname === '/terms') app.innerHTML = shell(legalPage('terms'));
    else if (!['/', '/demo', '/index.html'].includes(location.pathname)) {
      notFound = true;
      app.innerHTML = shell('<section class="not-found"><span class="error-number" aria-hidden="true">404</span><h1>This page does not exist</h1><p>The address may be incomplete. Return to your quote records or open the sample.</p><div class="hero-actions"><a class="button primary" href="/" data-route>Return home</a><a class="button" href="/demo" data-route>Open the sample</a></div></section>');
    } else {
      const match = hash.match(/^#quote\/([^/]+)(\/edit)?$/);
      if (match) {
      const quote = await db.quote(match[1]);
        if (!quote) app.innerHTML = shell('<section class="empty-note"><h1>Record not found</h1><p>It may have been removed from this browser.</p><a class="button" href="/" data-route>Return to records</a></section>');
        else app.innerHTML = shell(await quoteDetail(quote));
      } else app.innerHTML = shell(await home());
    }
  } catch (error) {
    app.innerHTML = shell(`<section class="empty-note"><h1>The notebook didn’t open.</h1><p>${escape(error instanceof Error ? error.message : 'Local storage is unavailable.')}</p><button class="button" data-action="retry">Try again</button></section>`);
  }
  updatePageIdentity(notFound);
}

app.addEventListener('click', async event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-route]');
  if (!target) return;
  if (target.hasAttribute('data-route')) {
    event.preventDefault(); const href = target.getAttribute('href') || '/';
    if (isDemoMode() && !href.startsWith('/demo') && !href.startsWith('#')) await db.clear();
    route(href);
    return;
  }
  const action = target.dataset.action;
  if (action === 'new-quote') await createNew();
  if (action === 'reset-demo') { await seedDemo(true); focusAfterRender = true; await render(); toast('Sample restored.'); }
  if (action === 'start-real') { await db.clear(); location.assign('/'); }
  if (action === 'retry') await render();
  if (action === 'license') licenseDialog();
  if (action === 'close-dialog') target.closest<HTMLDialogElement>('dialog')?.close();
  if (action === 'print') window.print();
  if (action === 'import') await importFile();
  if (action === 'delete') {
    const quote = await db.quote(target.dataset.id!);
    if (quote) openDialog(`<span class="eyebrow">Remove local record</span><h2>Delete “${escape(quote.projectTitle)}”?</h2><p>This removes the quote from ${isDemoMode() ? 'the demo' : 'this browser'}. Export it first if you need a copy.</p><div class="modal-actions"><button type="button" class="button quiet" data-action="close-dialog">Keep record</button><button type="button" class="button danger" data-action="confirm-delete" data-id="${quote.id}">Delete record</button></div>`);
  }
  if (action === 'confirm-delete') {
    await db.deleteQuote(target.dataset.id!);
    target.closest<HTMLDialogElement>('dialog')?.close();
    route(isDemoMode() ? '/demo' : '/');
    toast('Record deleted from this browser.');
  }
  if (action === 'save-draft' || action === 'add-item' || action === 'remove-item') {
    const match = location.hash.match(/^#quote\/([^/]+)/); if (!match) return;
    let quote = await db.quote(match[1]); if (!quote) return;
    quote = await saveDraft(quote, action !== 'save-draft');
    if (action === 'add-item') quote.items.push({ id: id(), description: '', quantity: 1, unitPrice: 0 });
    if (action === 'remove-item' && quote.items.length > 1) quote.items.splice(Number(target.dataset.index), 1);
    await db.saveQuote(quote); if (action !== 'save-draft') await render();
  }
  if (action === 'share') {
    const quote = await db.quote(target.dataset.id!); if (quote?.encodedPacket) await shareEncoded(quote.encodedPacket, `${quote.reference}: ${quote.projectTitle}`);
  }
  if (action === 'share-change') {
    const quote = await db.quote(target.dataset.id!); const change = quote?.changes.find(c => c.id === target.dataset.change);
    if (change?.encodedPacket) await shareEncoded(change.encodedPacket, `${quote!.reference} change: ${change.title}`);
  }
  if (action === 'export') {
    const quote = await db.quote(target.dataset.id!); if (quote) download({ format:'scopestamp-archive', version:1, exportedAt:new Date().toISOString(), quote } satisfies Archive, `${quote.reference}-scopestamp-archive.json`);
  }
  if (action === 'download-receipt') {
    const receipt = await db.receipt(target.dataset.hash!); if (receipt) download(receipt, `${receipt.quoteReference}-${receipt.kind}-receipt.json`);
  }
  if (action === 'add-change') {
    openDialog(`<span class="eyebrow">New scope entry</span><h2>Add a change card</h2><form id="change-form"><input type="hidden" name="quoteId" value="${escape(target.dataset.id)}"><div class="field"><label for="changeTitle">Change title *</label><input id="changeTitle" name="title" required></div><div class="field"><label for="changeDescription">What changes *</label><textarea id="changeDescription" name="description" required></textarea></div><div class="field"><label for="priceDelta">Price adjustment</label><input id="priceDelta" name="priceDelta" type="number" step="0.01" value="0"></div><div class="field"><label for="scheduleImpact">Schedule impact</label><input id="scheduleImpact" name="scheduleImpact"></div><div class="modal-actions"><button type="button" class="button quiet" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Lock change card</button></div></form>`);
  }
});

app.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  if (!form.reportValidity()) return;
  if (form.id === 'quote-form') {
    const match = location.hash.match(/^#quote\/([^/]+)/); if (!match) return;
    let quote = await db.quote(match[1]); if (!quote) return;
    quote = parseEditorForm(quote); editorError = validationError(quote);
    if (editorError) { await db.saveQuote(quote); await render(); document.querySelector('.error-box')?.scrollIntoView(); return; }
    const lockedAt = new Date().toISOString();
    const packet = await makeQuotePacket(quote, lockedAt);
    quote.packetHash = packet.packetHash; quote.encodedPacket = encodePacket(packet); quote.status = 'awaiting';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    quote.events.push(await makeLedgerEvent({ type:'quote_locked', occurredAt:lockedAt, timezone, actor:quote.businessName, payload:{ packetHash: packet.packetHash, revision: quote.revision }, previousHash:null }));
    quote.updatedAt = lockedAt; await db.saveQuote(quote); editorError = ''; route(`#quote/${quote.id}`); toast('Revision locked. It is ready to share.');
  }
  if (form.id === 'decision-form') {
    const data = new FormData(form, (event as SubmitEvent).submitter as HTMLElement);
    const packet = decodePacket(String(data.get('packet')));
    const receipt = await makeReceipt(packet, String(data.get('decision')) as 'accepted' | 'declined', String(data.get('actorName')), String(data.get('note') || ''));
    await db.saveReceipt(receipt); await render(); toast('Decision recorded. Download the receipt and return it to the sender.');
  }
});

document.addEventListener('submit', async event => {
  const form = event.target as HTMLFormElement;
  if (form.id === 'license-form') {
    event.preventDefault(); const data = new FormData(form); saveLicense(String(data.get('token')));
    const button = form.querySelector<HTMLButtonElement>('button[type=submit]'); if (button) { button.disabled = true; button.textContent = 'Verifying…'; }
    const valid = await verifyLicense(true); if (valid) { form.closest<HTMLDialogElement>('dialog')?.close(); await render(); toast('Field kit unlocked on this device.'); } else { if (button) { button.disabled = false; button.textContent = 'Verify license'; } toast('That license is not active. Check the token and try again.'); }
  }
  if (form.id === 'change-form') {
    event.preventDefault(); if (!form.reportValidity()) return;
    const data = new FormData(form); const quote = await db.quote(String(data.get('quoteId'))); if (!quote) return;
    const createdAt = new Date().toISOString();
    const change: ChangeCard = { id:id(), title:String(data.get('title')).trim(), description:String(data.get('description')).trim(), priceDelta:Number(data.get('priceDelta')) || 0, scheduleImpact:String(data.get('scheduleImpact')).trim(), createdAt, status:'awaiting', packetHash:'' };
    const packet = await makeChangePacket(quote, change); change.packetHash = packet.packetHash; change.encodedPacket = encodePacket(packet); quote.changes.push(change);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; quote.events.push(await makeLedgerEvent({ type:'change_created', occurredAt:createdAt, timezone, actor:quote.businessName, payload:{ packetHash:packet.packetHash, changeId:change.id }, previousHash:quote.events.at(-1)?.hash ?? null }));
    quote.updatedAt = createdAt; await db.saveQuote(quote); form.closest<HTMLDialogElement>('dialog')?.close(); await render(); toast('Change card locked and ready to share.');
  }
});

document.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action="close-dialog"]');
  if (target) target.closest<HTMLDialogElement>('dialog')?.close();
});

document.addEventListener('click', async event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action="confirm-delete"]');
  if (!target) return;
  await db.deleteQuote(target.dataset.id!);
  target.closest<HTMLDialogElement>('dialog')?.close();
  route(isDemoMode() ? '/demo' : '/');
  toast('Record deleted from this browser.');
});

app.addEventListener('input', () => {
  if (!document.querySelector('#quote-form')) return;
  const note = document.querySelector('#autosave');
  if (note) note.textContent = 'Saving draft…';
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(async () => {
    const match = location.hash.match(/^#quote\/([^/]+)/); if (!match) return;
    const quote = await db.quote(match[1]); if (!quote) return;
    await saveDraft(quote, true);
    const current = document.querySelector('#autosave'); if (current) current.textContent = 'Draft saved on this device';
  }, 500);
});

window.addEventListener('popstate', () => { focusAfterRender = true; void render(); });
window.addEventListener('hashchange', () => { focusAfterRender = true; void render(); });
window.addEventListener('online', () => { document.documentElement.classList.remove('offline'); toast('Back online. Local records were available throughout.'); });
window.addEventListener('offline', () => { document.documentElement.classList.add('offline'); toast('Offline. ScopeStamp will keep working locally.'); });

document.addEventListener('click', event => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a.skip-link');
  if (!link) return;
  event.preventDefault();
  history.replaceState({}, '', `${location.pathname}${location.search}#main`);
  document.querySelector<HTMLElement>('main#main')?.focus();
});

if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register('/sw.js').then(registration => {
    if (hadController && registration.waiting) toast('An update is ready. Reload the page to install it.');
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => {
      if (hadController && registration.waiting) toast('An update is ready. Reload the page to install it.');
    }));
  }).catch(() => { /* app remains usable without install support */ });
}

void (isDemoMode() ? Promise.resolve(false) : verifyLicense()).then(() => render());

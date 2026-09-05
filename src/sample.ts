import { db } from './db';
import { encodePacket, makeChangePacket, makeLedgerEvent, makeQuotePacket, makeReceipt } from './record';
import type { ChangeCard, Quote } from './types';

export const SAMPLE_ID = 'demo-oak-studio';

export async function seedDemo(force = false): Promise<void> {
  if (force) await db.clear();
  if ((await db.quotes()).length) return;

  const createdAt = '2026-08-14T09:15:00.000Z';
  const quote: Quote = {
    id: SAMPLE_ID,
    reference: 'Q-2026-041',
    businessName: 'Northline Joinery',
    businessEmail: 'hello@northline.example',
    clientName: 'Maya Chen',
    clientEmail: 'maya@example.test',
    projectTitle: 'Oak studio shelving',
    summary: 'Build and fit two oak shelving bays along the north wall, including wall fixing and a clear oil finish.',
    currency: 'USD',
    validUntil: '2026-10-15',
    items: [
      { id: 'demo-item-1', description: 'Build and fit oak shelving bays', quantity: 2, unitPrice: 760 },
      { id: 'demo-item-2', description: 'Clear oil finish', quantity: 1, unitPrice: 230 },
    ],
    exclusions: ['Electrical work', 'Wall painting', 'Moving the client’s equipment'],
    terms: '40% deposit before materials are ordered. Remaining balance due after fitting.',
    createdAt,
    updatedAt: createdAt,
    status: 'draft',
    revision: 2,
    events: [],
    changes: [],
  };

  const packet = await makeQuotePacket(quote, '2026-08-15T10:30:00.000Z');
  quote.packetHash = packet.packetHash;
  quote.encodedPacket = encodePacket(packet);
  quote.events.push(await makeLedgerEvent({
    type: 'quote_locked', occurredAt: packet.lockedAt, timezone: 'America/New_York', actor: quote.businessName,
    payload: { packetHash: packet.packetHash, revision: quote.revision }, previousHash: null,
  }));
  const quoteReceipt = await makeReceipt(packet, 'accepted', 'Maya Chen', 'Approved as written.');
  quote.events.push(await makeLedgerEvent({
    type: 'quote_accepted', occurredAt: quoteReceipt.occurredAt, timezone: quoteReceipt.timezone, actor: quoteReceipt.actorName,
    payload: { receiptHash: quoteReceipt.hash, packetHash: quoteReceipt.packetHash, note: quoteReceipt.note },
    previousHash: quote.events.at(-1)?.hash ?? null,
  }));
  quote.status = 'accepted';

  const change: ChangeCard = {
    id: 'demo-change-1',
    title: 'Add cable access panels',
    description: 'Cut and edge two removable cable access panels in the lower shelves.',
    priceDelta: 180,
    scheduleImpact: 'No change to the fitting date.',
    createdAt: '2026-08-21T13:20:00.000Z',
    status: 'awaiting',
    packetHash: '',
  };
  const changePacket = await makeChangePacket(quote, change);
  change.packetHash = changePacket.packetHash;
  change.encodedPacket = encodePacket(changePacket);
  quote.changes.push(change);
  quote.events.push(await makeLedgerEvent({
    type: 'change_created', occurredAt: change.createdAt, timezone: 'America/New_York', actor: quote.businessName,
    payload: { packetHash: change.packetHash, changeId: change.id }, previousHash: quote.events.at(-1)?.hash ?? null,
  }));
  quote.updatedAt = change.createdAt;
  await db.saveQuote(quote);
}

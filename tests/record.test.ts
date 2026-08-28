import { describe, expect, it } from 'vitest';
import { decodePacket, encodePacket, makeQuotePacket, makeReceipt, quoteTotal, verifyPacket, verifyReceipt } from '../src/record';
import type { Quote } from '../src/types';

const quote = (): Quote => ({
  id: 'q1', reference: 'Q-2026-001', businessName: 'Northline Joinery', businessEmail: 'work@example.test',
  clientName: 'Alex Client', clientEmail: '', projectTitle: 'Built-in shelving', summary: 'Build and fit oak shelving.',
  currency: 'USD', validUntil: '2026-09-30', items: [{ id:'i1', description:'Shelving', quantity:2, unitPrice:750 }],
  exclusions:['Painting'], terms:'50% deposit', createdAt:'2026-08-28T10:00:00.000Z', updatedAt:'2026-08-28T10:00:00.000Z',
  status:'draft', revision:1, events:[], changes:[],
});

describe('tamper-evident packets', () => {
  it('round trips and verifies a locked quote', async () => {
    const packet = await makeQuotePacket(quote(), '2026-08-28T11:00:00.000Z');
    expect(await verifyPacket(packet)).toBe(true);
    expect(decodePacket(encodePacket(packet))).toEqual(packet);
    expect(quoteTotal(quote())).toBe(1500);
  });

  it('detects packet and receipt edits', async () => {
    const packet = await makeQuotePacket(quote());
    const receipt = await makeReceipt(packet, 'accepted', 'Alex Client', 'Looks right');
    expect(await verifyReceipt(receipt)).toBe(true);
    expect(await verifyReceipt({ ...receipt, actorName: 'Someone else' })).toBe(false);
    packet.quote.summary = 'Changed after lock';
    expect(await verifyPacket(packet)).toBe(false);
  });
});

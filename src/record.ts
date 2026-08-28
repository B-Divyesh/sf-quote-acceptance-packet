import type { ChangeCard, ChangePacket, LedgerEvent, Packet, Quote, QuotePacket, Receipt } from './types';

export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
}

export async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : canonical(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function nowProvenance() {
  const now = new Date();
  return { occurredAt: now.toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' };
}

function quotePacketBody(quote: Quote, lockedAt: string) {
  const { events: _events, changes: _changes, status: _status, packetHash: _packetHash, encodedPacket: _encodedPacket, ...snapshot } = quote;
  return {
    format: 'scopestamp-packet' as const,
    version: 1 as const,
    kind: 'quote' as const,
    quote: snapshot,
    lockedAt,
    previousHash: quote.events.at(-1)?.hash ?? null,
  };
}

export async function makeQuotePacket(quote: Quote, lockedAt = new Date().toISOString()): Promise<QuotePacket> {
  const body = quotePacketBody(quote, lockedAt);
  return { ...body, packetHash: await sha256(body) };
}

export async function verifyPacket(packet: Packet): Promise<boolean> {
  const { packetHash: _hash, ...body } = packet;
  return packet.packetHash === await sha256(body);
}

export async function makeLedgerEvent(input: Omit<LedgerEvent, 'id' | 'hash' | 'recordedAt'>): Promise<LedgerEvent> {
  const body = { ...input, recordedAt: new Date().toISOString() };
  return { id: crypto.randomUUID(), ...body, hash: await sha256(body) };
}

export async function makeChangePacket(quote: Quote, change: ChangeCard): Promise<ChangePacket> {
  const { decision: _decision, status: _status, packetHash: _packetHash, encodedPacket: _encodedPacket, ...changeBody } = change;
  const body = {
    format: 'scopestamp-packet' as const,
    version: 1 as const,
    kind: 'change' as const,
    quoteReference: quote.reference,
    projectTitle: quote.projectTitle,
    businessName: quote.businessName,
    clientName: quote.clientName,
    currency: quote.currency,
    change: changeBody,
    baseHash: quote.events.at(-1)?.hash ?? quote.packetHash ?? '',
  };
  return { ...body, packetHash: await sha256(body) };
}

export async function makeReceipt(packet: Packet, decision: 'accepted' | 'declined', actorName: string, note: string): Promise<Receipt> {
  const time = nowProvenance();
  const body = {
    format: 'scopestamp-receipt' as const,
    version: 1 as const,
    kind: packet.kind,
    packetHash: packet.packetHash,
    quoteReference: packet.kind === 'quote' ? packet.quote.reference : packet.quoteReference,
    ...(packet.kind === 'change' ? { changeId: packet.change.id } : {}),
    decision,
    actorName: actorName.trim(),
    note: note.trim(),
    ...time,
    previousHash: packet.kind === 'quote' ? packet.packetHash : packet.baseHash,
  };
  return { ...body, hash: await sha256(body) };
}

export async function verifyReceipt(receipt: Receipt): Promise<boolean> {
  if (receipt.format !== 'scopestamp-receipt' || receipt.version !== 1) return false;
  const { hash, ...body } = receipt;
  return hash === await sha256(body);
}

export function encodePacket(packet: Packet): string {
  const bytes = new TextEncoder().encode(JSON.stringify(packet));
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePacket(value: string): Packet {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Packet;
  if (parsed?.format !== 'scopestamp-packet' || parsed.version !== 1 || !['quote', 'change'].includes(parsed.kind)) throw new Error('This is not a ScopeStamp packet.');
  return parsed;
}

export function quoteTotal(quote: Pick<Quote, 'items'>): number {
  return quote.items.reduce((total, item) => total + Number(item.quantity) * Number(item.unitPrice), 0);
}

export function money(value: number, currency: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}

export function shortHash(hash?: string): string {
  return hash ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : 'Not locked';
}

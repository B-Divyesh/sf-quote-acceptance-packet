export type QuoteStatus = 'draft' | 'awaiting' | 'accepted' | 'declined';
export type Decision = 'accepted' | 'declined';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface LedgerEvent {
  id: string;
  type: 'quote_locked' | 'quote_accepted' | 'quote_declined' | 'change_created' | 'change_accepted' | 'change_declined';
  occurredAt: string;
  recordedAt: string;
  timezone: string;
  actor: string;
  payload: Record<string, unknown>;
  previousHash: string | null;
  hash: string;
}

export interface ChangeCard {
  id: string;
  title: string;
  description: string;
  priceDelta: number;
  scheduleImpact: string;
  createdAt: string;
  status: 'awaiting' | Decision;
  packetHash: string;
  encodedPacket?: string;
  decision?: Receipt;
}

export interface Quote {
  id: string;
  reference: string;
  businessName: string;
  businessEmail: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  summary: string;
  currency: string;
  validUntil: string;
  items: LineItem[];
  exclusions: string[];
  terms: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  revision: number;
  packetHash?: string;
  encodedPacket?: string;
  events: LedgerEvent[];
  changes: ChangeCard[];
}

export interface QuotePacket {
  format: 'scopestamp-packet';
  version: 1;
  kind: 'quote';
  quote: Omit<Quote, 'events' | 'changes' | 'status' | 'packetHash' | 'encodedPacket'>;
  packetHash: string;
  lockedAt: string;
  previousHash: string | null;
}

export interface ChangePacket {
  format: 'scopestamp-packet';
  version: 1;
  kind: 'change';
  quoteReference: string;
  projectTitle: string;
  businessName: string;
  clientName: string;
  currency: string;
  change: Omit<ChangeCard, 'decision' | 'status' | 'packetHash'>;
  baseHash: string;
  packetHash: string;
}

export type Packet = QuotePacket | ChangePacket;

export interface Receipt {
  format: 'scopestamp-receipt';
  version: 1;
  kind: 'quote' | 'change';
  packetHash: string;
  quoteReference: string;
  changeId?: string;
  decision: Decision;
  actorName: string;
  note: string;
  occurredAt: string;
  timezone: string;
  previousHash: string;
  hash: string;
}

export interface Archive {
  format: 'scopestamp-archive';
  version: 1;
  exportedAt: string;
  quote: Quote;
}

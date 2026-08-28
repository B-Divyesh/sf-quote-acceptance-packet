import type { Quote, Receipt } from './types';

const DB_NAME = 'scopestamp-local';
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('quotes')) db.createObjectStore('quotes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('receipts')) db.createObjectStore('receipts', { keyPath: 'packetHash' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(storeName: 'quotes' | 'receipts', mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = run(tx.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export const db = {
  quotes: () => transaction<Quote[]>('quotes', 'readonly', store => store.getAll()).then(rows => rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
  quote: (id: string) => transaction<Quote | undefined>('quotes', 'readonly', store => store.get(id)),
  saveQuote: (quote: Quote) => transaction<IDBValidKey>('quotes', 'readwrite', store => store.put(quote)),
  deleteQuote: (id: string) => transaction<undefined>('quotes', 'readwrite', store => store.delete(id)),
  receipt: (packetHash: string) => transaction<Receipt | undefined>('receipts', 'readonly', store => store.get(packetHash)),
  saveReceipt: (receipt: Receipt) => transaction<IDBValidKey>('receipts', 'readwrite', store => store.put(receipt)),
  clear: async () => {
    const database = await open();
    await Promise.all(['quotes', 'receipts'].map(name => new Promise<void>((resolve, reject) => {
      const req = database.transaction(name, 'readwrite').objectStore(name).clear();
      req.onsuccess = () => resolve(); req.onerror = () => reject(req.error);
    })));
    database.close();
  },
};

import { get, set, del } from 'idb-keyval';
import { Persister, PersistedClient } from '@tanstack/react-query-persist-client';

/**
 * SPEED OF LIGHT Persister
 * Uses IndexedDB (idb-keyval) for high-performance, asynchronous query caching.
 * This ensures the app always starts with the last known data INSTANTLY (0ms network delay).
 */
export function createIDBPersister(idbValidKey: string = 'Swipess-query-cache') {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  } as Persister;
}



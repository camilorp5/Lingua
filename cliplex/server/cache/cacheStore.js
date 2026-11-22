import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_CACHE_FILE = fileURLToPath(new URL('./clip-cache.json', import.meta.url));
const CACHE_FILE = resolve(process.env.CLIP_CACHE_FILE || DEFAULT_CACHE_FILE);
const CACHE_VERSION = 1;
let cacheData;
let writeQueue = Promise.resolve();

export class CacheStoreError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'CacheStoreError';
  }
}

export async function initializeCacheStore() {
  if (cacheData) return;

  try {
    const saved = await readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(saved);
    if (parsed?.version !== CACHE_VERSION || !parsed.entries || typeof parsed.entries !== 'object') {
      throw new Error('Unsupported or invalid cache file format.');
    }
    cacheData = parsed;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new CacheStoreError(`Could not load cache file "${CACHE_FILE}".`, { cause: error });
    }
    cacheData = { version: CACHE_VERSION, entries: {} };
    await persistCache();
  }
}

async function persistCache() {
  const contents = JSON.stringify(cacheData);
  const tempFile = `${CACHE_FILE}.${process.pid}.tmp`;
  const writeOperation = writeQueue.then(async () => {
    try {
      await mkdir(dirname(CACHE_FILE), { recursive: true });
      await writeFile(tempFile, contents, 'utf8');
      await rename(tempFile, CACHE_FILE);
    } catch (error) {
      throw new CacheStoreError(`Could not persist cache file "${CACHE_FILE}".`, { cause: error });
    }
  });
  writeQueue = writeOperation.catch(() => {});
  await writeOperation;
}

export async function getCachedValue(namespace, key) {
  await initializeCacheStore();
  const cacheKey = `${namespace}:${key}`;
  const entry = cacheData.entries[cacheKey];
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    delete cacheData.entries[cacheKey];
    await persistCache();
    return null;
  }

  return entry.value;
}

export async function setCachedValue(namespace, key, value, { ttlMs, maxEntries }) {
  await initializeCacheStore();
  const now = Date.now();
  const cacheKey = `${namespace}:${key}`;

  for (const [existingKey, entry] of Object.entries(cacheData.entries)) {
    if (entry.expiresAt <= now) delete cacheData.entries[existingKey];
  }

  cacheData.entries[cacheKey] = {
    value,
    updatedAt: now,
    expiresAt: now + ttlMs
  };

  const namespaceEntries = Object.entries(cacheData.entries)
    .filter(([existingKey]) => existingKey.startsWith(`${namespace}:`))
    .sort(([, left], [, right]) => left.updatedAt - right.updatedAt);
  while (namespaceEntries.length > maxEntries) {
    const [oldestKey] = namespaceEntries.shift();
    delete cacheData.entries[oldestKey];
  }

  await persistCache();
}

import { createHash } from "node:crypto";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

const maximumEntries = 2000;

export function buildCacheKey(toolName: string, input: unknown): string {
  const serialized = JSON.stringify(input, Object.keys(input as object).sort());
  return createHash("sha256").update(`${toolName}:${serialized}`).digest("hex");
}

export function readFromCache<Value>(
  key: string,
  cacheSeconds: number
): Value | null {
  if (cacheSeconds <= 0) {
    return null;
  }

  const entry = memoryCache.get(key);
  if (entry === undefined) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value as Value;
}

export function writeToCache(
  key: string,
  value: unknown,
  cacheSeconds: number
): void {
  if (cacheSeconds <= 0) {
    return;
  }

  if (memoryCache.size >= maximumEntries) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey !== undefined) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + cacheSeconds * 1000,
  });
}

export function clearCache(): void {
  memoryCache.clear();
}

export function getCacheSize(): number {
  return memoryCache.size;
}

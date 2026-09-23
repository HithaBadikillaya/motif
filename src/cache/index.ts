export interface CacheStore<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  /** Remove all cached entries managed by this store. */
  clear(): Promise<void>;
}

/** No-op cache for testing or when caching is disabled. */
export class NullCache<T> implements CacheStore<T> {
  async get(): Promise<T | undefined> {
    return undefined;
  }
  async set(): Promise<void> {}
  async has(): Promise<boolean> {
    return false;
  }
  async delete(): Promise<void> {}
  async clear(): Promise<void> {}
}

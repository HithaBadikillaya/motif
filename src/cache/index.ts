export interface CacheStore<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
}

# Cache Module

Asynchronous storage management solution based on the **Strategy Pattern**, supporting multiple storage backends (localStorage, IndexedDB, Memory) with a unified API interface.

## Architecture

```shell
┌───────────────────────────────────────────────┐
│             StorageManager                    │
│  ┌─────────────┐  ┌───────────────────────┐   │
│  │   Prefix    │  │   TTL Expiration      │   │
│  │  Isolation  │  │     Management        │   │
│  └─────────────┘  └───────────────────────┘   │
├───────────────────────────────────────────────┤
│             IStorageDriver                    │
├──────────┬─────────────────┬──────────────────┤
│  Local   │   IndexedDB     │     Memory       │
│  Storage │   Driver        │     Driver       │
│  Driver  │                 │                  │
└──────────┴─────────────────┴──────────────────┘
```

**Layer Responsibilities:**

| Layer | Responsibility |
| --- | --- |
| `StorageManager` | Namespace prefix isolation, TTL expiration checks, unified external API |
| `IStorageDriver` | Pure key-value storage abstraction interface |
| Driver Implementations | Concrete storage engine adapters, unaware of prefixes or TTL |

---

## Quick Start

### Basic Usage (Default localStorage)

```typescript
import { StorageManager } from '@vben-core/shared/cache';

const cache = new StorageManager({ prefix: 'myapp' });
// Use IndexedDB
// new StorageManager({ driver: new IndexedDBDriver(), prefix: 'app' });

// Use sessionStorage
// new StorageManager({ driver: new LocalStorageDriver({ storageType: 'sessionStorage' }), prefix: 'app' });

// In-memory test environment
// new StorageManager({ driver: new MemoryStorageDriver(), prefix: 'test' });

// Store data
await cache.setItem('user', { name: 'John Doe', age: 28 });

// Read data
const user = await cache.getItem('user');
// => { name: 'John Doe', age: 28 }

// Read with default value
const settings = await cache.getItem('settings', { theme: 'light' });
// Returns { theme: 'light' } if absent

// Remove data
await cache.removeItem('user');

// Clear all data under current prefix
await cache.clear();
```

### With TTL Expiration

```typescript
const cache = new StorageManager({ prefix: 'session' });

// Set expiry in 5 minutes (TTL in milliseconds)
await cache.setItem('token', 'abc123', 5 * 60 * 1000);

// Readable within 5 minutes
const token = await cache.getItem('token');
// => 'abc123'

// Returns null after 5 minutes (lazy deletion)
const expiredToken = await cache.getItem('token');
// => null

// Proactively clear all expired items
await cache.clearExpiredItems();
```

---

## Storage Drivers

### LocalStorageDriver (Default)

Persists data using browser `localStorage` or `sessionStorage`.

```typescript
import { LocalStorageDriver, StorageManager } from '@vben-core/shared/cache';

// Using localStorage (default)
const cache = new StorageManager({
  driver: new LocalStorageDriver(),
  prefix: 'app',
});

// Using sessionStorage
const sessionCache = new StorageManager({
  driver: new LocalStorageDriver({ storageType: 'sessionStorage' }),
  prefix: 'app',
});
```

**Features:**

- Synchronous browser APIs wrapped in async for consistent interface
- Automatic JSON serialization / deserialization
- Corrupted data is automatically purged, returning null
- Storage capacity: approx. 5-10MB (browser dependent)

**Use Cases:** User preferences, small config payloads, token storage

---

### IndexedDBDriver

Based on browser IndexedDB, supporting high-capacity structured data storage.

```typescript
import { IndexedDBDriver, StorageManager } from '@vben-core/shared/cache';

const cache = new StorageManager({
  driver: new IndexedDBDriver({
    dbName: 'my-app-db',     // Database name, default 'vben-storage'
    dbVersion: 1,            // Database version, default 1
    storeName: 'cache-store', // Object store name, default 'kv-store'
  }),
  prefix: 'data',
});

// Store large payloads
await cache.setItem('table-data', largeDataArray);

// Store binary-friendly structures (IndexedDB native support)
await cache.setItem('config', {
  columns: [...],
  filters: [...],
  pagination: { page: 1, size: 20 },
});
```

**Features:**

- Lazy initialization: opens connection on first operation, no manual `init()` needed
- Large capacity (typically hundreds of MB to GBs)
- Supports structured cloning (Date, RegExp, Blob, etc.)
- Asynchronous non-blocking I/O

**Use Cases:** Offline caches, large table records, file/image caches, complex business data

---

### MemoryStorageDriver

In-memory Map driver; data does not persist and clears on page reload.

```typescript
import { MemoryStorageDriver, StorageManager } from '@vben-core/shared/cache';

const cache = new StorageManager({
  driver: new MemoryStorageDriver(),
  prefix: 'test',
});
```

**Features:**

- Fastest read/write performance
- Zero browser API dependencies
- Bound to page lifecycle

**Use Cases:** Unit tests, SSR server-side rendering, temporary runtime caches

---

## API Reference

### StorageManager

#### Constructor

```typescript
new StorageManager(options?: StorageManagerOptions)
```

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `driver` | `IStorageDriver` | `new LocalStorageDriver()` | Storage driver instance |
| `prefix` | `string` | `''` | Key prefix for namespace isolation |

#### Methods

| Method | Signature | Description |
| --- | --- | --- |
| `getItem` | `getItem<T>(key: string, defaultValue?: T \| null): Promise<T \| null>` | Get item; returns defaultValue if absent or expired |
| `setItem` | `setItem<T>(key: string, value: T, ttl?: number): Promise<void>` | Set item with optional TTL (ms) |
| `removeItem` | `removeItem(key: string): Promise<void>` | Remove specified item |
| `clear` | `clear(): Promise<void>` | Clear all items under current prefix |
| `clearExpiredItems` | `clearExpiredItems(): Promise<void>` | Proactively clear all expired items |

---

### IStorageDriver Interface

Custom drivers implement this interface:

```typescript
interface IStorageDriver {
  clear(): Promise<void>;
  getItem<T>(key: string): Promise<null | T>;
  keys(): Promise<string[]>;
  removeItem(key: string): Promise<void>;
  setItem<T>(key: string, value: T): Promise<void>;
}
```

---

## Advanced Usage

### Custom Driver

```typescript
import type { IStorageDriver } from '@vben-core/shared/cache';

class CookieStorageDriver implements IStorageDriver {
  async getItem<T>(key: string): Promise<null | T> {
    const value = getCookie(key);
    return value ? JSON.parse(value) : null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    setCookie(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    deleteCookie(key);
  }

  async clear(): Promise<void> {
    clearAllCookies();
  }

  async keys(): Promise<string[]> {
    return getAllCookieNames();
  }
}

// Using custom driver
const cache = new StorageManager({
  driver: new CookieStorageDriver(),
  prefix: 'ck',
});
```

### Dynamic Driver Selection by Environment

```typescript
import {
  IndexedDBDriver,
  LocalStorageDriver,
  MemoryStorageDriver,
  StorageManager,
} from '@vben-core/shared/cache';

function createStorageManager(prefix: string) {
  // Use memory driver in SSR environment
  if (typeof window === 'undefined') {
    return new StorageManager({
      driver: new MemoryStorageDriver(),
      prefix,
    });
  }

  // Use IndexedDB for large datasets
  if (needsLargeStorage()) {
    return new StorageManager({
      driver: new IndexedDBDriver({ dbName: `${prefix}-db` }),
      prefix,
    });
  }

  // Default to localStorage
  return new StorageManager({ prefix });
}
```

### Namespace Isolation

```typescript
// Different modules use different prefixes without interference
const userCache = new StorageManager({ prefix: 'user' });
const configCache = new StorageManager({ prefix: 'config' });

await userCache.setItem('profile', { name: 'John Doe' });
await configCache.setItem('profile', { theme: 'dark' });

// Isolated lookups
await userCache.getItem('profile'); // => { name: 'John Doe' }
await configCache.getItem('profile'); // => { theme: 'dark' }

// Clearing user prefix only affects userCache
await userCache.clear();
await configCache.getItem('profile'); // => { theme: 'dark' } (unaffected)
```

### Periodic Expired Items Cleanup

```typescript
const cache = new StorageManager({ prefix: 'app' });

// Clear once on app startup
await cache.clearExpiredItems();

// Or run periodic cleanup (every 10 minutes)
setInterval(
  async () => {
    await cache.clearExpiredItems();
  },
  10 * 60 * 1000,
);
```

---

## Data Storage Format

`StorageManager` persists wrapped records in the driver layer:

```typescript
interface StorageItem<T> {
  expiry?: number; // Expiry timestamp (ms), undefined indicates no expiration
  value: T; // Business payload
}
```

Formatted storage keys follow: `{prefix}-{key}`

For example, `prefix = 'app'` and `key = 'user'` produces `app-user`.

---

## Expiration Strategy

Employs a dual strategy of **lazy eviction + active cleanup**:

| Strategy | Trigger | Description |
| --- | --- | --- |
| Lazy Eviction | On `getItem` call | Checks expiration on read, deletes and returns default if expired |
| Active Cleanup | On `clearExpiredItems` call | Traverses all prefixed keys and removes expired entries |

---

## Driver Comparison

| Feature | LocalStorageDriver | IndexedDBDriver | MemoryStorageDriver |
| --- | --- | --- | --- |
| Persistence | Yes | Yes | No |
| Capacity | 5-10 MB | Hundreds of MB+ | Memory-bound |
| Speed | Fast (Sync) | Moderate (Async I/O) | Fastest |
| Data Types | JSON-serializable | Structured clone | Any JS object |
| Environment | All modern browsers | All modern browsers | Any JS runtime |
| Main Thread Blocking | Yes | No | No |
| Best Suited For | Preferences, tokens, small configs | Offline caches, large datasets | Testing, SSR |

---

## Notes

1. **All methods are async** — Returns Promises even for synchronous localStorage, ensuring seamless driver swapping.
2. **TTL in milliseconds** — `setItem('key', value, 60000)` expires after 60 seconds.
3. **IndexedDB lazy init** — No manual `init()` needed; connection opens on first operation.
4. **Logical prefix isolation** — `clear()` only clears entries under active prefix.
5. **Resilient error handling** — Corrupted JSON automatically purges and returns null; saveToCache catches errors safely.
6. **IndexedDB versioning** — Increment `dbVersion` when altering object store schema; store creates on `upgradeneeded`.

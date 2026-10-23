/**
 * Secret Store client — talks to the local CLI daemon (`127.0.0.1:8765/api/v1/secrets*`).
 *
 * Powers the workstation credential management UI. The daemon owns the local
 * encrypted store (~/.tq/system/secrets.json) and the cloud sync; values are
 * never returned by the API (only names + metadata) — see SPEC-secret-store.
 */

const DEFAULT_DAEMON_PORT = 8765;

export interface SecretRow {
  key_version?: null | number;
  name: string;
}

export interface SecretOpResult {
  affected: number;
  message: string;
  ok: boolean;
}

export interface SecretStoreStatus {
  cloud: SecretRow[];
  cloud_error: null | string;
  device_public_key: null | string;
  enrolled: boolean;
  local_count: number;
  secrets: SecretRow[];
  store_path: string;
}

function daemonBase(port = DEFAULT_DAEMON_PORT) {
  return `http://127.0.0.1:${port}/api/v1`;
}

async function daemonRequest<T>(
  path: string,
  init?: RequestInit,
  port = DEFAULT_DAEMON_PORT,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${daemonBase(port)}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...init,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error ?? data?.message ?? `HTTP ${res.status}`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return data as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** GET /secrets — store status + secret names (local + cloud). */
export function getSecretStatus(port?: number) {
  return daemonRequest<SecretStoreStatus>('/secrets', { method: 'GET' }, port);
}

/** POST /secrets — create/update a secret (stored locally, encrypted). */
export function setSecret(name: string, value: string, port?: number) {
  return daemonRequest<SecretOpResult>(
    '/secrets',
    { body: JSON.stringify({ name, value }), method: 'POST' },
    port,
  );
}

/** DELETE /secrets/{name} */
export function deleteSecret(name: string, port?: number) {
  return daemonRequest<SecretOpResult>(
    `/secrets/${encodeURIComponent(name)}`,
    { method: 'DELETE' },
    port,
  );
}

/** POST /secrets/push — upload local secrets, client-side encrypted. */
export function pushSecrets(port?: number) {
  return daemonRequest<SecretOpResult>(
    '/secrets/push',
    { method: 'POST' },
    port,
  );
}

/** POST /secrets/pull — fetch the sealed DEK and decrypt the tenant secrets locally. */
export function pullSecrets(port?: number) {
  return daemonRequest<SecretOpResult>(
    '/secrets/pull',
    { method: 'POST' },
    port,
  );
}

/** POST /secrets/rotate — rotate the tenant DEK. */
export function rotateSecrets(port?: number) {
  return daemonRequest<SecretOpResult>(
    '/secrets/rotate',
    { method: 'POST' },
    port,
  );
}

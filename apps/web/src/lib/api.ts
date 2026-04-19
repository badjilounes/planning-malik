import 'server-only';
import { redirect } from 'next/navigation';
import type { AuthTokens } from '@planning/types';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from './session';

const API_URL = process.env.API_URL ?? 'http://localhost:3333/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  /** If true, no auth header is attached. */
  anonymous?: boolean;
  /**
   * If true, a 401 triggers a refresh + retry. Must only be used from Server
   * Actions or Route Handlers (cookie writes are forbidden in RSC).
   */
  allowRefresh?: boolean;
  /** Forwarded to the underlying fetch. */
  cache?: RequestCache;
  next?: { tags?: string[]; revalidate?: number | false };
}

/**
 * Internal server-side fetch. Prefer `apiGet` / `apiMutate` / `apiAction`
 * below rather than calling this directly.
 */
async function rawFetch<T>(path: string, opts: ApiFetchOptions): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (!opts.anonymous) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache ?? 'no-store',
    next: opts.next,
  });

  if (res.status === 401 && !opts.anonymous) {
    if (opts.allowRefresh) {
      const refreshed = await attemptRefresh();
      if (refreshed) return rawFetch<T>(path, { ...opts, allowRefresh: false });
    }
    await clearSession();
    redirect('/login?reauth=1');
  }

  if (!res.ok) {
    const body = await safeJson(res);
    throw new ApiError(res.status, `API ${res.status} on ${opts.method ?? 'GET'} ${path}`, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  if (!res.ok) return false;
  const tokens = (await res.json()) as AuthTokens;
  await setSession(tokens);
  return true;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

// ─── public helpers ─────────────────────────────────────────────────────

/** Use from RSC (pages / layouts). Read-only, no refresh. */
export function apiGet<T>(path: string, opts: Omit<ApiFetchOptions, 'method' | 'allowRefresh'> = {}): Promise<T> {
  return rawFetch<T>(path, { ...opts, method: 'GET' });
}

/** Use from Server Actions. Auto-refreshes on 401. */
export function apiAction<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  return rawFetch<T>(path, { method, body, allowRefresh: true });
}

/** Anonymous call (login / register / health). */
export function apiAnonymous<T>(
  path: string,
  method: 'POST' | 'GET',
  body?: unknown,
): Promise<T> {
  return rawFetch<T>(path, { method, body, anonymous: true });
}

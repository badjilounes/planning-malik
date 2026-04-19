'use server';

import { redirect } from 'next/navigation';
import { apiAnonymous, ApiError } from '@/lib/api';
import { setSession } from '@/lib/session';
import type { AuthResponse } from '@planning/types';
import type { AuthActionState } from '../login/actions';

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim() || undefined;
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    String(formData.get('timezone') ?? 'UTC');

  if (!email || !password) return { error: 'Email et mot de passe obligatoires.' };
  if (password.length < 8) return { error: 'Le mot de passe doit contenir au moins 8 caractères.' };

  let response: AuthResponse;
  try {
    response = await apiAnonymous<AuthResponse>('/auth/register', 'POST', {
      email,
      password,
      displayName,
      timezone,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { error: 'Un compte existe déjà avec cet email.' };
    }
    if (err instanceof ApiError) {
      console.error('[registerAction] API rejected', {
        status: err.status,
        body: err.body,
      });
      const msgs = extractMessages(err.body);
      return { error: msgs ?? `Erreur serveur (${err.status}).` };
    }
    console.error('[registerAction] fetch failed', { apiUrl: process.env.API_URL, err });
    return { error: 'Impossible de joindre le serveur. Réessayez.' };
  }

  await setSession(response.tokens, response.user);
  redirect('/calendar');
}

function extractMessages(body: unknown): string | null {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return null;
}

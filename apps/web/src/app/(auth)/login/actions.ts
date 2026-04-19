'use server';

import { redirect } from 'next/navigation';
import { apiAnonymous, ApiError } from '@/lib/api';
import { setSession } from '@/lib/session';
import type { AuthResponse } from '@planning/types';

export interface AuthActionState {
  error?: string;
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('from') ?? '/tasks');

  if (!email || !password) {
    return { error: 'Please enter your email and password.' };
  }

  let response: AuthResponse;
  try {
    response = await apiAnonymous<AuthResponse>('/auth/login', 'POST', { email, password });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
      return { error: 'Invalid email or password.' };
    }
    return { error: 'Could not reach the API. Is it running?' };
  }

  await setSession(response.tokens, response.user);
  redirect(redirectTo.startsWith('/') ? redirectTo : '/tasks');
}

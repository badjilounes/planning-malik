'use server';

import { redirect } from 'next/navigation';
import { apiAction, ApiError } from '@/lib/api';
import { clearSession, getRefreshToken } from '@/lib/session';

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await apiAction('/auth/logout', 'POST', { refreshToken });
    } catch (err) {
      // Even if revocation fails (network, expired access), we still clear
      // local cookies so the user appears signed out.
      if (!(err instanceof ApiError)) throw err;
    }
  }
  await clearSession();
  redirect('/login');
}

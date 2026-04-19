import Link from 'next/link';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; reauth?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Sign in to keep your plan in motion.
        </p>
      </div>

      {params.reauth && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-200">
          Your session expired. Please sign in again.
        </div>
      )}

      <LoginForm from={params.from ?? '/tasks'} />

      <p className="text-center text-xs text-fg-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Create one
        </Link>
      </p>
    </div>
  );
}

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
        <h1 className="text-2xl font-semibold tracking-tight">Content de vous revoir</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Connectez-vous pour reprendre votre planning.
        </p>
      </div>

      {params.reauth && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-200">
          Votre session a expiré. Merci de vous reconnecter.
        </div>
      )}

      <LoginForm from={params.from ?? '/calendar'} />

      <p className="text-center text-xs text-fg-muted">
        Pas encore de compte ?{' '}
        <Link
          href="/register"
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

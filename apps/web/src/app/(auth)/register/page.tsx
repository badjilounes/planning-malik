import Link from 'next/link';
import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Planifiez vos tâches récurrentes en toute sérénité.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-xs text-fg-muted">
        Déjà un compte ?{' '}
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}

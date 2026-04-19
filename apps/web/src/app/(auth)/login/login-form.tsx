'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { loginAction, type AuthActionState } from './actions';

const initialState: AuthActionState = {};

export function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <Card className="p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="from" value={from} />

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        {state.error && (
          <p className="text-xs text-red-500" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" fullWidth disabled={pending}>
      {pending ? 'Connexion…' : 'Se connecter'}
    </Button>
  );
}

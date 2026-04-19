import Link from 'next/link';
import type { ReactNode } from 'react';
import { CalendarDays, ListChecks, LogOut, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/session';
import { logoutAction } from '@/app/(app)/logout/actions';

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/85 px-6 backdrop-blur">
          <div className="text-sm text-fg-muted">
            {user?.displayName ? (
              <>
                Hi, <span className="text-fg">{user.displayName}</span>
              </>
            ) : (
              user?.email
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="md" className="h-10 w-10 p-0" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border bg-surface-muted/40 px-4 py-5 md:flex">
      <Link href="/calendar" className="mb-8 flex items-center gap-2 px-2 text-sm font-semibold tracking-tight">
        <span className="inline-block h-6 w-6 rounded-lg bg-brand-600" aria-hidden />
        Planning Malik
      </Link>

      <nav className="flex flex-col gap-0.5">
        <NavLink href="/calendar" icon={<CalendarDays className="h-4 w-4" />} label="Calendar" />
        <NavLink href="/tasks" icon={<ListChecks className="h-4 w-4" />} label="Tasks" />
      </nav>

      <div className="mt-auto">
        <NavLink href="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
      </div>
    </aside>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-elevated hover:text-fg"
    >
      {icon}
      {label}
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, ListChecks, Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  // Close the panel when the route changes or on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.classList.add('overflow-hidden');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface-elevated p-4 shadow-pop transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!open}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/calendar"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="inline-block h-6 w-6 rounded-lg bg-brand-600" aria-hidden />
            Planning Malik
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          <MobileNavLink
            href="/calendar"
            icon={<CalendarDays className="h-4 w-4" />}
            label="Calendrier"
            onNavigate={() => setOpen(false)}
          />
          <MobileNavLink
            href="/tasks"
            icon={<ListChecks className="h-4 w-4" />}
            label="Tâches"
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </aside>
    </>
  );
}

function MobileNavLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
    >
      {icon}
      {label}
    </Link>
  );
}

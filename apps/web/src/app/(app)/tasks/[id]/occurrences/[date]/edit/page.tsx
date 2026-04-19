import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiGet, ApiError } from '@/lib/api';
import type { TaskDto } from '@planning/types';
import { ExceptionForm } from './exception-form';

export default async function EditOccurrencePage({
  params,
}: {
  params: Promise<{ id: string; date: string }>;
}) {
  const { id, date } = await params;
  let task: TaskDto;
  try {
    task = await apiGet<TaskDto>(`/tasks/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  if (!task.recurrence) notFound();

  const originalDate = decodeURIComponent(date);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/tasks"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Edit this occurrence</h1>
      <p className="mb-6 text-sm text-fg-muted">
        You&apos;re editing <span className="text-fg">{task.title}</span> on{' '}
        {new Date(originalDate).toLocaleString()}. The series itself is not affected —
        only this one instance.
      </p>
      <ExceptionForm task={task} originalDate={originalDate} />
    </div>
  );
}

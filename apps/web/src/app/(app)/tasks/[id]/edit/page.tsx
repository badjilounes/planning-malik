import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiGet, ApiError } from '@/lib/api';
import type { TaskDto } from '@planning/types';
import { TaskForm } from '../../task-form';

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let task: TaskDto;
  try {
    task = await apiGet<TaskDto>(`/tasks/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/tasks"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Edit task</h1>
      {task.recurrence && (
        <p className="mb-6 text-sm text-fg-muted">
          Changes apply to the entire series. To edit a single occurrence, use the menu on
          that occurrence instead.
        </p>
      )}
      <TaskForm task={task} />
    </div>
  );
}

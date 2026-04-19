import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TaskForm } from '../task-form';

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/tasks"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New task</h1>
      <TaskForm />
    </div>
  );
}

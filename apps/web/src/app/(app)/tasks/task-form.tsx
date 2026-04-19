'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { TaskPriority, TaskStatus, type TaskDto } from '@planning/types';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { RecurrenceEditor } from './recurrence-editor';
import {
  createTaskAction,
  updateTaskAction,
  type TaskFormState,
} from './actions';

const initialState: TaskFormState = {};

export function TaskForm({ task }: { task?: TaskDto }) {
  const isEdit = Boolean(task);

  const boundAction = isEdit
    ? updateTaskAction.bind(null, task!.id)
    : createTaskAction;

  const [state, formAction] = useActionState(boundAction, initialState);

  const [repeats, setRepeats] = useState<boolean>(Boolean(task?.recurrence));

  return (
    <Card className="p-6">
      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={task?.title ?? ''}
            placeholder="e.g. Weekly team sync"
            required
            maxLength={200}
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={task?.description ?? ''}
            placeholder="Anything the future you should know…"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              defaultValue={toDatetimeLocal(task?.dueDate)}
              required
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              name="priority"
              defaultValue={task?.priority ?? TaskPriority.MEDIUM}
            >
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={task?.status ?? TaskStatus.TODO}
            >
              <option value={TaskStatus.TODO}>To do</option>
              <option value={TaskStatus.IN_PROGRESS}>In progress</option>
              <option value={TaskStatus.DONE}>Done</option>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            defaultValue={task?.tags?.join(', ') ?? ''}
            placeholder="Comma-separated (e.g. work, meeting)"
          />
        </div>

        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="repeats"
              checked={repeats}
              onChange={(e) => setRepeats(e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
            />
            <span className="font-medium">Repeat this task</span>
          </label>
          {repeats && (
            <div className="mt-4 animate-fade-in">
              <RecurrenceEditor initial={task?.recurrence ?? null} />
            </div>
          )}
        </div>

        {state.error && (
          <p className="text-xs text-red-500" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/tasks">
            <Button type="button" variant="secondary" size="md">
              Cancel
            </Button>
          </Link>
          <SubmitButton isEdit={isEdit} />
        </div>
      </form>
    </Card>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
    </Button>
  );
}

function toDatetimeLocal(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

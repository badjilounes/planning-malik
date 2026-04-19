'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { TaskPriority, TaskStatus, type TaskDto } from '@planning/types';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  upsertExceptionAction,
  type ExceptionFormState,
} from '../../../../actions';

const initialState: ExceptionFormState = {};

export function ExceptionForm({
  task,
  originalDate,
}: {
  task: TaskDto;
  originalDate: string;
}) {
  const boundAction = upsertExceptionAction.bind(null, task.id, originalDate);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <Card className="p-6">
      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <Label htmlFor="title">Title (leave empty to inherit)</Label>
          <Input
            id="title"
            name="title"
            defaultValue={task.title}
            placeholder={task.title}
            maxLength={200}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={task.description ?? ''}
            placeholder="Inherits from the series unless you change it."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="dueDate">Due date / time</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              defaultValue={toDatetimeLocal(originalDate)}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue={task.priority}>
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={task.status}>
              <option value={TaskStatus.TODO}>To do</option>
              <option value={TaskStatus.IN_PROGRESS}>In progress</option>
              <option value={TaskStatus.DONE}>Done</option>
            </Select>
          </div>
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
          <SubmitButton />
        </div>
      </form>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" disabled={pending}>
      {pending ? 'Saving…' : 'Save this occurrence'}
    </Button>
  );
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

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
          <Label htmlFor="title">Titre (vide = hérité de la série)</Label>
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
            placeholder="Hérité de la série sauf si vous modifiez."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="dueDate">Date et heure</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              defaultValue={toDatetimeLocal(originalDate)}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priorité</Label>
            <Select id="priority" name="priority" defaultValue={task.priority}>
              <option value={TaskPriority.LOW}>Faible</option>
              <option value={TaskPriority.MEDIUM}>Moyenne</option>
              <option value={TaskPriority.HIGH}>Haute</option>
              <option value={TaskPriority.URGENT}>Urgente</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select id="status" name="status" defaultValue={task.status}>
              <option value={TaskStatus.TODO}>À faire</option>
              <option value={TaskStatus.IN_PROGRESS}>En cours</option>
              <option value={TaskStatus.DONE}>Terminée</option>
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
              Annuler
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
      {pending ? 'Enregistrement…' : 'Enregistrer cette occurrence'}
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

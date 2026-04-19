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
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            name="title"
            defaultValue={task?.title ?? ''}
            placeholder="Ex. Réunion d'équipe hebdo"
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
            placeholder="Une note pour votre futur vous…"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="dueDate">Échéance</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              defaultValue={toDatetimeLocal(task?.dueDate)}
              required
            />
          </div>
          <div>
            <Label htmlFor="priority">Priorité</Label>
            <Select
              id="priority"
              name="priority"
              defaultValue={task?.priority ?? TaskPriority.MEDIUM}
            >
              <option value={TaskPriority.LOW}>Faible</option>
              <option value={TaskPriority.MEDIUM}>Moyenne</option>
              <option value={TaskPriority.HIGH}>Haute</option>
              <option value={TaskPriority.URGENT}>Urgente</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              id="status"
              name="status"
              defaultValue={task?.status ?? TaskStatus.TODO}
            >
              <option value={TaskStatus.TODO}>À faire</option>
              <option value={TaskStatus.IN_PROGRESS}>En cours</option>
              <option value={TaskStatus.DONE}>Terminée</option>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Étiquettes</Label>
          <Input
            id="tags"
            name="tags"
            defaultValue={task?.tags?.join(', ') ?? ''}
            placeholder="Séparées par virgule (ex. travail, réunion)"
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
            <span className="font-medium">Répéter cette tâche</span>
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
              Annuler
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
      {pending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer la tâche'}
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

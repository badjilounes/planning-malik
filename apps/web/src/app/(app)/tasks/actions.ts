'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiAction } from '@/lib/api';
import type {
  ExceptionAction,
  RecurrenceFreq,
  TaskDto,
  TaskPriority,
  TaskStatus,
} from '@planning/types';

// ─── Template-level ─────────────────────────────────────────────────────

export interface TaskFormState {
  error?: string;
}

export async function createTaskAction(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const payload = parseTaskFormData(formData);
  if ('error' in payload) return payload;

  try {
    await apiAction<TaskDto>('/tasks', 'POST', payload.value);
  } catch {
    return { error: 'Could not create this task.' };
  }
  revalidatePath('/tasks');
  redirect('/tasks');
}

export async function updateTaskAction(
  taskId: string,
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const payload = parseTaskFormData(formData);
  if ('error' in payload) return payload;

  try {
    await apiAction<TaskDto>(`/tasks/${taskId}`, 'PATCH', payload.value);
  } catch {
    return { error: 'Could not update this task.' };
  }
  revalidatePath('/tasks');
  redirect('/tasks');
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  await apiAction(`/tasks/${taskId}`, 'DELETE');
  revalidatePath('/tasks');
}

export async function setTaskStatusAction(
  taskId: string,
  status: TaskStatus,
): Promise<void> {
  await apiAction(`/tasks/${taskId}`, 'PATCH', { status });
  revalidatePath('/tasks');
}

// ─── Occurrence-level (exceptions) ──────────────────────────────────────

export async function skipOccurrenceAction(
  taskId: string,
  originalDate: string,
): Promise<void> {
  await apiAction(`/tasks/${taskId}/exceptions`, 'PUT', {
    originalDate,
    action: 'SKIP' satisfies ExceptionAction,
  });
  revalidatePath('/tasks');
}

export interface ExceptionFormState {
  error?: string;
}

export async function upsertExceptionAction(
  taskId: string,
  originalDate: string,
  _prev: ExceptionFormState,
  formData: FormData,
): Promise<ExceptionFormState> {
  const title = String(formData.get('title') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const dueDate = String(formData.get('dueDate') ?? '').trim() || null;
  const status = (String(formData.get('status') ?? '').trim() as TaskStatus) || null;
  const priority =
    (String(formData.get('priority') ?? '').trim() as TaskPriority) || null;

  try {
    await apiAction(`/tasks/${taskId}/exceptions`, 'PUT', {
      originalDate,
      action: 'MODIFY' satisfies ExceptionAction,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      status: status || null,
      priority: priority || null,
    });
  } catch {
    return { error: 'Could not save this occurrence.' };
  }
  revalidatePath('/tasks');
  redirect('/tasks');
}

export async function clearExceptionAction(
  taskId: string,
  originalDate: string,
): Promise<void> {
  await apiAction(`/tasks/${taskId}/exceptions/${encodeURIComponent(originalDate)}`, 'DELETE');
  revalidatePath('/tasks');
}

// ─── helpers ────────────────────────────────────────────────────────────

type ParsedTaskPayload =
  | { value: Record<string, unknown> }
  | { error: string };

function parseTaskFormData(formData: FormData): ParsedTaskPayload {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const dueDate = String(formData.get('dueDate') ?? '').trim();
  const priority = String(formData.get('priority') ?? 'MEDIUM') as TaskPriority;
  const status = String(formData.get('status') ?? 'TODO') as TaskStatus;
  const tagsRaw = String(formData.get('tags') ?? '').trim();

  if (!title) return { error: 'Title is required.' };
  if (!dueDate) return { error: 'Due date is required.' };

  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

  const value: Record<string, unknown> = {
    title,
    description: description || undefined,
    dueDate: new Date(dueDate).toISOString(),
    priority,
    status,
    tags,
  };

  const repeats = formData.get('repeats') === 'on';
  if (repeats) {
    const freq = String(formData.get('freq') ?? 'DAILY') as RecurrenceFreq;
    const interval = Number(formData.get('interval') ?? 1);
    const byWeekday = formData
      .getAll('byWeekday')
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n));
    const byMonthDay = String(formData.get('byMonthDay') ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 31);

    value.recurrence = {
      freq,
      interval: Number.isFinite(interval) && interval > 0 ? interval : 1,
      byWeekday: freq === 'WEEKLY' ? byWeekday : undefined,
      byMonthDay: freq === 'MONTHLY' ? byMonthDay : undefined,
      startsOn: new Date(dueDate).toISOString(),
    };
  } else {
    value.recurrence = null; // explicit removal on update
  }

  return { value };
}

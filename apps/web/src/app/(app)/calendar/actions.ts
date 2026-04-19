'use server';

import { revalidatePath } from 'next/cache';
import { apiAction } from '@/lib/api';
import type { TaskDto, TaskPriority } from '@planning/types';

export interface CreateInput {
  title: string;
  description: string | null;
  dueDate: string;
  priority: TaskPriority;
  tags: string[];
}

export async function createCalendarTaskAction(input: CreateInput): Promise<void> {
  await apiAction<TaskDto>('/tasks', 'POST', {
    title: input.title,
    description: input.description ?? undefined,
    dueDate: input.dueDate,
    priority: input.priority,
    status: 'TODO',
    tags: input.tags,
    recurrence: null,
  });
  revalidatePath('/calendar');
}

export interface UpdateInput {
  title?: string;
  description?: string | null;
  dueDate?: string;
  priority?: TaskPriority;
  tags?: string[];
}

export async function updateCalendarTaskAction(
  taskId: string,
  patch: UpdateInput,
): Promise<void> {
  await apiAction<TaskDto>(`/tasks/${taskId}`, 'PATCH', patch);
  revalidatePath('/calendar');
}

export async function deleteCalendarTaskAction(taskId: string): Promise<void> {
  await apiAction(`/tasks/${taskId}`, 'DELETE');
  revalidatePath('/calendar');
}

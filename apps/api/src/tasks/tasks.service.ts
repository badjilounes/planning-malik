import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@planning/data-access';
import { buildRruleString } from '@planning/utils';
import type {
  RecurrenceFreq,
  TaskDto,
  TaskOccurrenceDto,
  TaskPriority,
  TaskStatus,
} from '@planning/types';
import { RecurrenceService, type TaskWithRecurrence } from '../recurrence/recurrence.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import type { UpsertExceptionDto } from './dto/create-exception.dto';
import type { RecurrenceRuleInputDto } from './dto/recurrence-rule.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recurrence: RecurrenceService,
  ) {}

  // ─── Reads ─────────────────────────────────────────────────────────────

  async listOccurrences(
    userId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<TaskOccurrenceDto[]> {
    // One query for everything the user owns that could touch the range:
    //   * non-recurring tasks with dueDate in range
    //   * recurring tasks whose rule window overlaps the range
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        OR: [
          { recurrence: null, dueDate: { gte: rangeStart, lt: rangeEnd } },
          {
            recurrence: {
              startsOn: { lte: rangeEnd },
              OR: [{ endsOn: null }, { endsOn: { gte: rangeStart } }],
            },
          },
        ],
      },
      include: { recurrence: true, exceptions: true },
    });

    return this.recurrence.expand(tasks as TaskWithRecurrence[], rangeStart, rangeEnd);
  }

  async findOne(userId: string, id: string): Promise<TaskDto> {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: { recurrence: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    return toTaskDto(task);
  }

  // ─── Writes ────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateTaskDto): Promise<TaskDto> {
    const dueDate = new Date(dto.dueDate);

    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        dueDate,
        priority: dto.priority ?? 'MEDIUM',
        status: dto.status ?? 'TODO',
        tags: dto.tags ?? [],
        ...(dto.recurrence && {
          recurrence: { create: toRecurrenceCreate(dto.recurrence) },
        }),
      },
      include: { recurrence: true },
    });
    return toTaskDto(task);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<TaskDto> {
    await this.assertOwned(userId, id);

    const data: Prisma.TaskUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
    };

    // Recurrence handling: omit = leave alone, null = remove, object = replace.
    if (dto.recurrence === null) {
      data.recurrence = { delete: true };
    } else if (dto.recurrence) {
      data.recurrence = {
        upsert: {
          create: toRecurrenceCreate(dto.recurrence),
          update: toRecurrenceUpdate(dto.recurrence),
        },
      };
      // Replacing the rule invalidates old exceptions — the originalDates
      // they referenced may no longer exist.
      await this.prisma.taskException.deleteMany({ where: { taskId: id } });
    }

    const task = await this.prisma.task.update({
      where: { id },
      data,
      include: { recurrence: true },
    });
    return toTaskDto(task);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwned(userId, id);
    await this.prisma.task.delete({ where: { id } });
  }

  // ─── Exceptions (per-occurrence edits) ─────────────────────────────────

  async upsertException(userId: string, taskId: string, dto: UpsertExceptionDto): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
      select: { id: true, recurrence: { select: { id: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (!task.recurrence) {
      throw new ForbiddenException('Exceptions only apply to recurring tasks');
    }

    const originalDate = new Date(dto.originalDate);
    await this.prisma.taskException.upsert({
      where: { taskId_originalDate: { taskId, originalDate } },
      create: {
        taskId,
        originalDate,
        action: dto.action,
        title: dto.title ?? null,
        description: dto.description ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status ?? null,
        priority: dto.priority ?? null,
      },
      update: {
        action: dto.action,
        title: dto.title ?? null,
        description: dto.description ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status ?? null,
        priority: dto.priority ?? null,
      },
    });
  }

  async removeException(userId: string, taskId: string, originalDate: string): Promise<void> {
    await this.assertOwned(userId, taskId);
    await this.prisma.taskException.deleteMany({
      where: { taskId, originalDate: new Date(originalDate) },
    });
  }

  // ─── internals ─────────────────────────────────────────────────────────

  private async assertOwned(userId: string, taskId: string): Promise<void> {
    const owned = await this.prisma.task.count({ where: { id: taskId, userId } });
    if (owned === 0) throw new NotFoundException('Task not found');
  }
}

function toRecurrenceCreate(
  input: RecurrenceRuleInputDto,
): Prisma.RecurrenceRuleCreateWithoutTaskInput {
  const startsOn = new Date(input.startsOn);
  const endsOn = input.endsOn ? new Date(input.endsOn) : null;
  return {
    freq: input.freq,
    interval: input.interval ?? 1,
    byWeekday: input.byWeekday ?? [],
    byMonthDay: input.byMonthDay ?? [],
    startsOn,
    endsOn,
    count: input.count ?? null,
    rruleString: buildRruleString({
      freq: input.freq,
      interval: input.interval,
      byWeekday: input.byWeekday,
      byMonthDay: input.byMonthDay,
      startsOn,
      endsOn,
      count: input.count,
    }),
  };
}

function toRecurrenceUpdate(
  input: RecurrenceRuleInputDto,
): Prisma.RecurrenceRuleUpdateWithoutTaskInput {
  const created = toRecurrenceCreate(input);
  return { ...created };
}

function toTaskDto(task: {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  priority: string;
  status: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  recurrence: {
    id: string;
    freq: string;
    interval: number;
    byWeekday: number[];
    byMonthDay: number[];
    startsOn: Date;
    endsOn: Date | null;
    count: number | null;
    rruleString: string;
  } | null;
}): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate.toISOString(),
    priority: task.priority as TaskPriority,
    status: task.status as TaskStatus,
    tags: task.tags,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    recurrence: task.recurrence
      ? {
          id: task.recurrence.id,
          freq: task.recurrence.freq as RecurrenceFreq,
          interval: task.recurrence.interval,
          byWeekday: task.recurrence.byWeekday,
          byMonthDay: task.recurrence.byMonthDay,
          startsOn: task.recurrence.startsOn.toISOString(),
          endsOn: task.recurrence.endsOn?.toISOString() ?? null,
          count: task.recurrence.count,
          rruleString: task.recurrence.rruleString,
        }
      : null,
  };
}

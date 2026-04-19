import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksDto } from './dto/list-tasks.dto';
import { UpsertExceptionDto } from './dto/create-exception.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import type { TaskDto, TaskOccurrenceDto } from '@planning/types';

const DEFAULT_RANGE_DAYS = 35; // one full month view with padding

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTasksDto,
  ): Promise<TaskOccurrenceDto[]> {
    const { rangeStart, rangeEnd } = resolveRange(query);
    return this.tasks.listOccurrences(user.id, rangeStart, rangeEnd);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<TaskDto> {
    return this.tasks.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskDto> {
    return this.tasks.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskDto> {
    return this.tasks.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.tasks.remove(user.id, id);
  }

  @Put(':id/exceptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  upsertException(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertExceptionDto,
  ): Promise<void> {
    return this.tasks.upsertException(user.id, id, dto);
  }

  @Delete(':id/exceptions/:originalDate')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeException(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('originalDate') originalDate: string,
  ): Promise<void> {
    return this.tasks.removeException(user.id, id, originalDate);
  }
}

function resolveRange(query: ListTasksDto): { rangeStart: Date; rangeEnd: Date } {
  const now = new Date();
  const rangeStart = query.rangeStart ? new Date(query.rangeStart) : startOfDay(now);
  const rangeEnd = query.rangeEnd
    ? new Date(query.rangeEnd)
    : new Date(rangeStart.getTime() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);
  return { rangeStart, rangeEnd };
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

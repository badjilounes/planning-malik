import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '@planning/types';
import { RecurrenceRuleInputDto } from './recurrence-rule.dto';

/**
 * Updates the task *template* — i.e. the entire series for recurring tasks.
 * To edit a single occurrence, use the exceptions endpoints.
 */
export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  description?: string | null;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  @IsOptional()
  tags?: string[];

  /**
   * Set to `null` to remove recurrence (task becomes one-shot).
   * Set to a new rule to replace the existing one.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceRuleInputDto)
  recurrence?: RecurrenceRuleInputDto | null;
}

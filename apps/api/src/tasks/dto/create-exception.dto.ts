import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ExceptionAction, TaskPriority, TaskStatus } from '@planning/types';

/**
 * Create or update a per-occurrence exception. `originalDate` is the date
 * that the rule would have produced (un-modified). `action`:
 *   * SKIP — hide this occurrence
 *   * MODIFY — override fields for this occurrence only
 */
export class UpsertExceptionDto {
  @IsDateString()
  originalDate!: string;

  @IsEnum(ExceptionAction)
  action!: ExceptionAction;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  description?: string | null;

  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus | null;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority | null;
}

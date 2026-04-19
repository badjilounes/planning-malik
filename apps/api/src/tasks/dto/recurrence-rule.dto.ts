import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { RecurrenceFreq } from '@planning/types';

export class RecurrenceRuleInputDto {
  @IsEnum(RecurrenceFreq)
  freq!: RecurrenceFreq;

  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  interval?: number;

  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  byWeekday?: number[];

  @IsArray()
  @ArrayMaxSize(31)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  @IsOptional()
  byMonthDay?: number[];

  @IsDateString()
  startsOn!: string;

  @IsDateString()
  @IsOptional()
  endsOn?: string | null;

  @IsInt()
  @Min(1)
  @Max(10_000)
  @IsOptional()
  @Type(() => Number)
  count?: number | null;
}

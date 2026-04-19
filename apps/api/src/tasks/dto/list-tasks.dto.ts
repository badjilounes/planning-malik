import { IsDateString, IsOptional } from 'class-validator';

export class ListTasksDto {
  @IsDateString()
  @IsOptional()
  rangeStart?: string;

  @IsDateString()
  @IsOptional()
  rangeEnd?: string;
}

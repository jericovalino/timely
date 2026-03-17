import {
  IsString,
  IsArray,
  IsEnum,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class CreateWorkScheduleDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime: string;

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  workDays: DayOfWeek[];
}

export class UpdateWorkScheduleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  workDays?: DayOfWeek[];
}

import {
  IsString,
  IsOptional,
  IsISO8601,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ScanDto {
  @IsString()
  @MinLength(1)
  employeeNumber: string;
}

export class CreateAttendanceDto {
  @IsString()
  @MinLength(1)
  employeeId: string;

  @IsISO8601()
  date: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeIn must be in HH:mm format' })
  timeIn?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeOut must be in HH:mm format' })
  timeOut?: string;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class UpdateAttendanceDto {
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeIn must be in HH:mm format' })
  timeIn?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeOut must be in HH:mm format' })
  timeOut?: string;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class AttendanceQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isLate?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isUndertime?: boolean;
}

export class AttendanceLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}

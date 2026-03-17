import { IsString, IsISO8601, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DailySummaryQueryDto {
  @IsISO8601()
  date: string;
}

export class MonthlyDtrQueryDto {
  @IsString()
  employeeId: string;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class LateUndertimeQueryDto {
  @IsISO8601()
  from: string;

  @IsISO8601()
  to: string;
}

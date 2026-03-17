import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  DailySummaryQueryDto,
  MonthlyDtrQueryDto,
  LateUndertimeQueryDto,
} from './dto/reports.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-summary')
  async getDailySummary(@Query() query: DailySummaryQueryDto) {
    return this.reportsService.getDailySummary(query.date);
  }

  @Get('monthly-dtr')
  async getMonthlyDtr(@Query() query: MonthlyDtrQueryDto) {
    return this.reportsService.getMonthlyDtr(
      query.employeeId,
      query.year,
      query.month,
    );
  }

  @Get('late-undertime')
  async getLateUndertimeReport(@Query() query: LateUndertimeQueryDto) {
    return this.reportsService.getLateUndertimeReport(query.from, query.to);
  }
}

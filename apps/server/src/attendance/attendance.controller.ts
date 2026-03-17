import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import {
  ScanDto,
  UpdateAttendanceDto,
  AttendanceQueryDto,
  AttendanceLogQueryDto,
} from './dto/attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // PUBLIC endpoint — no JWT guard, rate limited
  @Post('scan')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async scan(@Body() dto: ScanDto) {
    return this.attendanceService.scan(dto.employeeNumber);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAttendanceList(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.getAttendanceList(query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateAttendance(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attendanceService.updateAttendance(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logs')
  async getAttendanceLogs(@Query() query: AttendanceLogQueryDto) {
    return this.attendanceService.getAttendanceLogs(query);
  }
}

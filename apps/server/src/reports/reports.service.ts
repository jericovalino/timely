import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Local shape mirrors the Prisma AttendanceRecord model until `prisma generate` runs. */
export interface AttendanceRecordLike {
  employeeId: string;
  date: Date;
  timeIn: Date | null;
  timeOut: Date | null;
  isLate: boolean;
  isUndertime: boolean;
  lateMinutes: number;
  undertimeMinutes: number;
  totalHoursWorked: number | null;
  adminNote: string | null;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailySummary(date: string) {
    const targetDate = new Date(date);

    // Get all active employees with their schedule
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      include: { department: true, schedule: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    // Get all attendance records for that date
    const records = (await this.prisma.attendanceRecord.findMany({
      where: { date: targetDate },
    })) as AttendanceRecordLike[];

    const recordsByEmployeeId = new Map<string, AttendanceRecordLike>(
      records.map((r): [string, AttendanceRecordLike] => [r.employeeId, r]),
    );

    const summary = employees.map((employee) => {
      const record = recordsByEmployeeId.get(employee.id);

      if (!record) {
        return {
          employee,
          status: 'absent' as const,
          timeIn: null,
          timeOut: null,
          lateMinutes: 0,
          isLate: false,
          isUndertime: false,
          undertimeMinutes: 0,
          totalHoursWorked: null,
        };
      }

      let status: 'present' | 'late';
      if (record.isLate) {
        status = 'late';
      } else {
        status = 'present';
      }

      return {
        employee,
        status,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        lateMinutes: record.lateMinutes,
        isLate: record.isLate,
        isUndertime: record.isUndertime,
        undertimeMinutes: record.undertimeMinutes,
        totalHoursWorked: record.totalHoursWorked,
      };
    });

    return {
      date: targetDate,
      summary,
      totals: {
        totalEmployees: employees.length,
        totalPresent: summary.filter((s) => s.status !== 'absent').length,
        totalAbsent: summary.filter((s) => s.status === 'absent').length,
        totalLate: summary.filter((s) => s.isLate).length,
      },
    };
  }

  async getMonthlyDtr(employeeId: string, year: number, month: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true, schedule: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Build date range for the month (month is 1-indexed)
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0)); // day 0 of next month = last day of this month

    // Get all attendance records for that month
    const records = (await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      orderBy: { date: 'asc' },
    })) as AttendanceRecordLike[];

    const recordsByDate = new Map<string, AttendanceRecordLike>(
      records.map((r): [string, AttendanceRecordLike] => [
        r.date.toISOString().split('T')[0],
        r,
      ]),
    );

    type DailyRow = {
      date: Date;
      status: string;
      timeIn: Date | null;
      timeOut: Date | null;
      isLate: boolean;
      lateMinutes: number;
      isUndertime: boolean;
      undertimeMinutes: number;
      totalHoursWorked: number | null;
      adminNote: string | null;
    };

    // Build array of all calendar days
    const totalDays = lastDay.getUTCDate();
    const dailyRecords: DailyRow[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      const dateKey = dateObj.toISOString().split('T')[0];
      const record = recordsByDate.get(dateKey);

      if (record) {
        dailyRecords.push({
          date: dateObj,
          status: record.isLate ? 'late' : 'present',
          timeIn: record.timeIn,
          timeOut: record.timeOut,
          isLate: record.isLate,
          lateMinutes: record.lateMinutes,
          isUndertime: record.isUndertime,
          undertimeMinutes: record.undertimeMinutes,
          totalHoursWorked: record.totalHoursWorked,
          adminNote: record.adminNote,
        });
      } else {
        dailyRecords.push({
          date: dateObj,
          status: 'absent',
          timeIn: null,
          timeOut: null,
          isLate: false,
          lateMinutes: 0,
          isUndertime: false,
          undertimeMinutes: 0,
          totalHoursWorked: null,
          adminNote: null,
        });
      }
    }

    // Calculate totals
    const presentDays = dailyRecords.filter((d) => d.status !== 'absent');
    const totalDaysPresent = presentDays.length;
    const totalHoursWorked = presentDays.reduce(
      (sum, d) => sum + (d.totalHoursWorked ?? 0),
      0,
    );
    const totalLateMinutes = dailyRecords.reduce(
      (sum, d) => sum + d.lateMinutes,
      0,
    );
    const totalUndertimeMinutes = dailyRecords.reduce(
      (sum, d) => sum + d.undertimeMinutes,
      0,
    );

    return {
      employee,
      year,
      month,
      dailyRecords,
      totals: {
        totalDaysPresent,
        totalDaysAbsent: totalDays - totalDaysPresent,
        totalHoursWorked,
        totalLateMinutes,
        totalUndertimeMinutes,
      },
    };
  }

  async getLateUndertimeReport(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
        OR: [{ isLate: true }, { isUndertime: true }],
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: { lateMinutes: 'desc' },
    });

    const typedRecords = records as (AttendanceRecordLike & {
      employee: { firstName: string; lastName: string; employeeNumber: string; department: { name: string } | null };
    })[];

    return {
      from: fromDate,
      to: toDate,
      records: typedRecords,
      totals: {
        totalRecords: typedRecords.length,
        totalLate: typedRecords.filter((r) => r.isLate).length,
        totalUndertime: typedRecords.filter((r) => r.isUndertime).length,
      },
    };
  }
}

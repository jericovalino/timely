import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  AttendanceQueryDto,
  AttendanceLogQueryDto,
} from './dto/attendance.dto';

interface WorkScheduleLike {
  startTime: string;
  endTime: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async scan(employeeNumber: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find employee
      const employee = await tx.employee.findUnique({
        where: { employeeNumber },
        include: { schedule: true },
      });

      if (!employee || !employee.isActive) {
        return { status: 'NOT_FOUND' };
      }

      const now = new Date();
      // Use UTC date for consistency
      const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );

      const cooldownMinutes = this.configService.get<number>(
        'scan.cooldownMinutes',
        120,
      );

      // 2. Get today's last AttendanceLog for this employee
      const lastLog = await tx.attendanceLog.findFirst({
        where: { employeeId: employee.id, date: today },
        orderBy: { scannedAt: 'desc' },
      });

      const employeeData = {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        photoUrl: employee.photoUrl,
      };

      // 3. No entry today → TIME IN
      if (!lastLog) {
        await tx.attendanceLog.create({
          data: {
            employeeId: employee.id,
            date: today,
            scannedAt: now,
            type: 'IN',
          },
        });

        // Calculate tardiness
        const { isLate, lateMinutes } = this.calculateTardiness(
          now,
          employee.schedule,
        );

        await tx.attendanceRecord.upsert({
          where: {
            employeeId_date: { employeeId: employee.id, date: today },
          },
          create: {
            employeeId: employee.id,
            date: today,
            timeIn: now,
            isLate,
            lateMinutes,
          },
          update: { timeIn: now, isLate, lateMinutes },
        });

        return { status: 'TIME_IN', employee: employeeData, scannedAt: now };
      }

      // 4. Within cooldown → ALREADY_RECORDED (log as IGNORED)
      const minutesSinceLast =
        (now.getTime() - lastLog.scannedAt.getTime()) / 60000;
      if (minutesSinceLast < cooldownMinutes) {
        await tx.attendanceLog.create({
          data: {
            employeeId: employee.id,
            date: today,
            scannedAt: now,
            type: 'IGNORED',
          },
        });
        return {
          status: 'ALREADY_RECORDED',
          employee: employeeData,
          lastScan: lastLog.scannedAt,
        };
      }

      // 5. Outside cooldown → TIME OUT
      await tx.attendanceLog.create({
        data: {
          employeeId: employee.id,
          date: today,
          scannedAt: now,
          type: 'OUT',
        },
      });

      // Get timeIn from AttendanceRecord
      const record = await tx.attendanceRecord.findUnique({
        where: {
          employeeId_date: { employeeId: employee.id, date: today },
        },
      });

      const { isUndertime, undertimeMinutes, totalHoursWorked } =
        this.calculateUndertime(now, record?.timeIn, employee.schedule);

      await tx.attendanceRecord.update({
        where: {
          employeeId_date: { employeeId: employee.id, date: today },
        },
        data: { timeOut: now, isUndertime, undertimeMinutes, totalHoursWorked },
      });

      return { status: 'TIME_OUT', employee: employeeData, scannedAt: now };
    });
  }

  private calculateTardiness(
    timeIn: Date,
    schedule: WorkScheduleLike | null,
  ): { isLate: boolean; lateMinutes: number } {
    if (!schedule) return { isLate: false, lateMinutes: 0 };
    const [schedHour, schedMin] = schedule.startTime.split(':').map(Number);
    const schedStart = new Date(timeIn);
    schedStart.setUTCHours(schedHour, schedMin, 0, 0);
    const diffMs = timeIn.getTime() - schedStart.getTime();
    const lateMinutes = Math.max(0, Math.floor(diffMs / 60000));
    return { isLate: lateMinutes > 0, lateMinutes };
  }

  private calculateUndertime(
    timeOut: Date,
    timeIn: Date | null | undefined,
    schedule: WorkScheduleLike | null,
  ): {
    isUndertime: boolean;
    undertimeMinutes: number;
    totalHoursWorked: number | null;
  } {
    const totalHoursWorked = timeIn
      ? (timeOut.getTime() - timeIn.getTime()) / 3600000
      : null;

    if (!schedule)
      return { isUndertime: false, undertimeMinutes: 0, totalHoursWorked };
    const [schedHour, schedMin] = schedule.endTime.split(':').map(Number);
    const schedEnd = new Date(timeOut);
    schedEnd.setUTCHours(schedHour, schedMin, 0, 0);
    const diffMs = schedEnd.getTime() - timeOut.getTime();
    const undertimeMinutes = Math.max(0, Math.floor(diffMs / 60000));
    return {
      isUndertime: undertimeMinutes > 0,
      undertimeMinutes,
      totalHoursWorked,
    };
  }

  async createAttendance(dto: CreateAttendanceDto, lastEditedById: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { schedule: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const date = new Date(dto.date);
    const dateUTC = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const parseHHmm = (hhmm: string, baseDate: Date): Date => {
      const [hours, minutes] = hhmm.split(':').map(Number);
      const d = new Date(baseDate);
      d.setUTCHours(hours, minutes, 0, 0);
      return d;
    };

    const timeIn = dto.timeIn ? parseHHmm(dto.timeIn, dateUTC) : null;
    const timeOut = dto.timeOut ? parseHHmm(dto.timeOut, dateUTC) : null;

    const { isLate, lateMinutes } = timeIn
      ? this.calculateTardiness(timeIn, employee.schedule)
      : { isLate: false, lateMinutes: 0 };

    const { isUndertime, undertimeMinutes, totalHoursWorked } =
      timeOut
        ? this.calculateUndertime(timeOut, timeIn, employee.schedule)
        : { isUndertime: false, undertimeMinutes: 0, totalHoursWorked: null };

    return this.prisma.attendanceRecord.create({
      data: {
        employeeId: employee.id,
        date: dateUTC,
        timeIn,
        timeOut,
        isLate,
        lateMinutes,
        isUndertime,
        undertimeMinutes,
        totalHoursWorked,
        adminNote: dto.adminNote,
        lastEditedById,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });
  }

  async getAttendanceList(query: AttendanceQueryDto) {
    const {
      page = 1,
      limit = 20,
      employeeId,
      departmentId,
      from,
      to,
      isLate,
      isUndertime,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (departmentId) {
      where.employee = { departmentId };
    }

    if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = new Date(from);
      }
      if (to) {
        where.date.lte = new Date(to);
      }
    }

    if (isLate !== undefined) {
      where.isLate = isLate;
    }

    if (isUndertime !== undefined) {
      where.isUndertime = isUndertime;
    }

    const [records, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            include: { department: true },
          },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateAttendance(
    id: string,
    dto: UpdateAttendanceDto,
    lastEditedById: string,
  ) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: { employee: { include: { schedule: true } } },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    const parseHHmm = (hhmm: string, baseDate: Date): Date => {
      const [hours, minutes] = hhmm.split(':').map(Number);
      const d = new Date(baseDate);
      d.setUTCHours(hours, minutes, 0, 0);
      return d;
    };

    const timeIn = dto.timeIn
      ? parseHHmm(dto.timeIn, record.date)
      : record.timeIn;
    const timeOut = dto.timeOut
      ? parseHHmm(dto.timeOut, record.date)
      : record.timeOut;

    const schedule = record.employee.schedule;

    let isLate = record.isLate;
    let lateMinutes = record.lateMinutes;
    let isUndertime = record.isUndertime;
    let undertimeMinutes = record.undertimeMinutes;
    let totalHoursWorked = record.totalHoursWorked;

    if (timeIn) {
      const tardiness = this.calculateTardiness(timeIn, schedule);
      isLate = tardiness.isLate;
      lateMinutes = tardiness.lateMinutes;
    }

    if (timeOut) {
      const undertime = this.calculateUndertime(timeOut, timeIn, schedule);
      isUndertime = undertime.isUndertime;
      undertimeMinutes = undertime.undertimeMinutes;
      totalHoursWorked = undertime.totalHoursWorked;
    }

    const updateData: any = {
      isLate,
      lateMinutes,
      isUndertime,
      undertimeMinutes,
      totalHoursWorked,
      lastEditedById,
    };

    if (dto.timeIn !== undefined) {
      updateData.timeIn = timeIn;
    }

    if (dto.timeOut !== undefined) {
      updateData.timeOut = timeOut;
    }

    if (dto.adminNote !== undefined) {
      updateData.adminNote = dto.adminNote;
    }

    return this.prisma.attendanceRecord.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: { department: true },
        },
      },
    });
  }

  async getAttendanceLogs(query: AttendanceLogQueryDto) {
    const { page = 1, limit = 20, employeeId, from, to } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = new Date(from);
      }
      if (to) {
        where.date.lte = new Date(to);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.attendanceLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
        },
        orderBy: { scannedAt: 'desc' },
      }),
      this.prisma.attendanceLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

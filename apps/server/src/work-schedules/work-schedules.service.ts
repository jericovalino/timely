import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
} from './dto/work-schedule.dto';

@Injectable()
export class WorkSchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(createWorkScheduleDto: CreateWorkScheduleDto) {
    const existing = await this.prisma.workSchedule.findUnique({
      where: { name: createWorkScheduleDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Work schedule with name "${createWorkScheduleDto.name}" already exists`,
      );
    }

    return this.prisma.workSchedule.create({
      data: createWorkScheduleDto,
    });
  }

  async findAll() {
    return this.prisma.workSchedule.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async update(id: string, updateWorkScheduleDto: UpdateWorkScheduleDto) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Work schedule not found');
    }

    if (updateWorkScheduleDto.name) {
      const nameConflict = await this.prisma.workSchedule.findFirst({
        where: {
          name: updateWorkScheduleDto.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException(
          `Work schedule with name "${updateWorkScheduleDto.name}" already exists`,
        );
      }
    }

    return this.prisma.workSchedule.update({
      where: { id },
      data: updateWorkScheduleDto,
    });
  }

  async remove(id: string) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
      include: {
        employees: {
          where: { isActive: true },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Work schedule not found');
    }

    if (schedule.employees.length > 0) {
      throw new BadRequestException(
        'Cannot delete work schedule with assigned employees. Please reassign employees first.',
      );
    }

    await this.prisma.workSchedule.delete({ where: { id } });

    return { message: 'Work schedule deleted successfully' };
  }
}

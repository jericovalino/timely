import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Department with name "${createDepartmentDto.name}" already exists`,
      );
    }

    return this.prisma.department.create({
      data: createDepartmentDto,
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const nameConflict = await this.prisma.department.findFirst({
      where: {
        name: updateDepartmentDto.name,
        id: { not: id },
      },
    });

    if (nameConflict) {
      throw new ConflictException(
        `Department with name "${updateDepartmentDto.name}" already exists`,
      );
    }

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
    });
  }

  async remove(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          where: { isActive: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (department.employees.length > 0) {
      throw new BadRequestException(
        'Cannot delete department with active employees. Please reassign or deactivate employees first.',
      );
    }

    await this.prisma.department.delete({ where: { id } });

    return { message: 'Department deleted successfully' };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto,
} from './dto/employee.dto';

const employeeInclude = {
  department: true,
  schedule: true,
};

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({
      where: { employeeNumber: createEmployeeDto.employeeNumber },
    });

    if (existing) {
      // Return 422 on duplicate employeeNumber
      throw new HttpException(
        {
          statusCode: 422,
          message: 'Validation failed',
          errors: {
            employeeNumber: [
              `Employee number "${createEmployeeDto.employeeNumber}" is already in use`,
            ],
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Validate department exists
    const department = await this.prisma.department.findUnique({
      where: { id: createEmployeeDto.departmentId },
    });
    if (!department) {
      throw new BadRequestException('Department not found');
    }

    // Validate schedule exists
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: createEmployeeDto.scheduleId },
    });
    if (!schedule) {
      throw new BadRequestException('Work schedule not found');
    }

    return this.prisma.employee.create({
      data: createEmployeeDto,
      include: employeeInclude,
    });
  }

  async findAll(query: EmployeeQueryDto) {
    const { page = 1, limit = 20, search, departmentId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: employeeInclude,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: employeeInclude,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (
      updateEmployeeDto.employeeNumber &&
      updateEmployeeDto.employeeNumber !== employee.employeeNumber
    ) {
      const conflict = await this.prisma.employee.findUnique({
        where: { employeeNumber: updateEmployeeDto.employeeNumber },
      });

      if (conflict) {
        throw new HttpException(
          {
            statusCode: 422,
            message: 'Validation failed',
            errors: {
              employeeNumber: [
                `Employee number "${updateEmployeeDto.employeeNumber}" is already in use`,
              ],
            },
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    if (updateEmployeeDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateEmployeeDto.departmentId },
      });
      if (!department) {
        throw new BadRequestException('Department not found');
      }
    }

    if (updateEmployeeDto.scheduleId) {
      const schedule = await this.prisma.workSchedule.findUnique({
        where: { id: updateEmployeeDto.scheduleId },
      });
      if (!schedule) {
        throw new BadRequestException('Work schedule not found');
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto,
      include: employeeInclude,
    });
  }

  async deactivate(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.employee.update({
      where: { id },
      data: { isActive: false },
      include: employeeInclude,
    });
  }
}

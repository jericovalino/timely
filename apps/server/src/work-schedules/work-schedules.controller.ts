import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WorkSchedulesService } from './work-schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
} from './dto/work-schedule.dto';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class WorkSchedulesController {
  constructor(private readonly workSchedulesService: WorkSchedulesService) {}

  @Post()
  async create(@Body() createWorkScheduleDto: CreateWorkScheduleDto) {
    return this.workSchedulesService.create(createWorkScheduleDto);
  }

  @Get()
  async findAll() {
    return this.workSchedulesService.findAll();
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWorkScheduleDto: UpdateWorkScheduleDto,
  ) {
    return this.workSchedulesService.update(id, updateWorkScheduleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.workSchedulesService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PlacementsService } from './placements.service';
import { CreatePlacementDto, UpdatePlacementDto } from './placements.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('placements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlacementsController {
  constructor(private placementsService: PlacementsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@CurrentUser('id') adminId: string, @Body() dto: CreatePlacementDto) {
    return this.placementsService.create(adminId, dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdatePlacementDto,
  ) {
    return this.placementsService.update(id, adminId, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.placementsService.remove(id, adminId);
  }

  @Get(':id/registrations')
  @Roles(Role.ADMIN)
  getRegistrations(@Param('id') id: string) {
    return this.placementsService.getPlacementRegistrations(id);
  }

  @Get()
  findAll() {
    return this.placementsService.findAll();
  }

  @Get('my/registrations')
  @Roles(Role.STUDENT)
  myRegistrations(@CurrentUser('id') studentId: string) {
    return this.placementsService.getStudentRegistrations(studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placementsService.findOne(id);
  }

  @Post(':id/register')
  @Roles(Role.STUDENT)
  register(@Param('id') id: string, @CurrentUser('id') studentId: string) {
    return this.placementsService.registerStudent(id, studentId);
  }
}

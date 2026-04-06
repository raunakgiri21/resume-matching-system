import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Post('placements/:id/run')
  @Roles(Role.ADMIN)
  matchAll(@Param('id') placementId: string) {
    return this.matchingService.matchAll(placementId);
  }

  @Post('registrations/:id/run')
  @Roles(Role.ADMIN)
  matchOne(@Param('id') registrationId: string) {
    return this.matchingService.matchOne(registrationId);
  }

  @Get('placements/:id/results')
  @Roles(Role.ADMIN)
  getRankedResults(@Param('id') placementId: string) {
    return this.matchingService.getRankedResults(placementId);
  }

  @Get('placements/:id/my-result')
  @Roles(Role.STUDENT)
  getMyResult(
    @Param('id') placementId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.matchingService.getStudentResult(placementId, studentId);
  }
}

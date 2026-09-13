import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { ROLE_SETS } from '../admin-auth/roles';
import { OperationsService } from './operations.service';

@Controller('admin/operations')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.opsRead)
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}
  @Get('overview') overview() { return this.operations.overview(); }
}

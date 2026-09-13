import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { IntegrationsStatusService } from './integrations-status.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { ROLE_SETS } from '../admin-auth/roles';

@Controller('admin/integrations')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.integrationsRead)
export class IntegrationsStatusController {
  constructor(
    private readonly integrations: IntegrationsStatusService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  check(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.integrations.check();
  }

  private authorize(token?: string) {
    const expected = this.config.get<string>('ADMIN_IMPORT_TOKEN');
    if (!expected || !token) throw new UnauthorizedException();
    const left = Buffer.from(expected);
    const right = Buffer.from(token);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      throw new UnauthorizedException();
    }
  }
}

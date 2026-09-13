import {
  Controller,
  Get,
  Headers,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { AuditLogService } from './audit-log.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { ROLE_SETS } from '../admin-auth/roles';

@Controller('admin/audit-logs')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.auditRead)
export class AuditLogController {
  constructor(
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  list(
    @Headers('x-admin-import-token') token: string | undefined,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.authorize(token);
    const parsedLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const parsedOffset = Math.max(Number(offset) || 0, 0);
    return this.auditLog.list(parsedLimit, parsedOffset);
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

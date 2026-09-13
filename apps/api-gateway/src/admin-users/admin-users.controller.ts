import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto, UpdateAdminUserDto } from './admin-users.dto';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { CurrentAdmin } from '../admin-auth/current-admin.decorator';
import type { AdminUser } from '../admin-auth/admin-auth.service';
import { ROLE_SETS } from '../admin-auth/roles';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('admin/users')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.usersRead)
export class AdminUsersController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  list(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.users.list();
  }

  @Post()
  @RequireRoles(...ROLE_SETS.usersWrite)
  async create(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateAdminUserDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const created = await this.users.create(dto);
    await this.auditLog.record(actor, 'user.create', 'portal_user', created.id, {
      email: created.email,
      roles: created.roles,
    });
    return created;
  }

  @Patch(':id')
  @RequireRoles(...ROLE_SETS.usersWrite)
  async update(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const updated = await this.users.update(id, dto, actor.id);
    await this.auditLog.record(actor, 'user.update', 'portal_user', id, {
      roles: dto.roles,
      active: dto.active,
      passwordChanged: dto.password !== undefined,
    });
    return updated;
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

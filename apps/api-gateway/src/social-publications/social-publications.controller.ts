import {
  Body,
  Controller,
  Delete,
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
import { SocialPublicationsService } from './social-publications.service';
import {
  CreateSocialPublicationDto,
  UpdateSocialPublicationDto,
} from './social-publications.dto';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { CurrentAdmin } from '../admin-auth/current-admin.decorator';
import type { AdminUser } from '../admin-auth/admin-auth.service';
import { ROLE_SETS } from '../admin-auth/roles';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('admin/social-publications')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.socialRead)
export class SocialPublicationsController {
  constructor(
    private readonly social: SocialPublicationsService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  list(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.social.list();
  }

  @Post()
  @RequireRoles(...ROLE_SETS.socialWrite)
  async create(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateSocialPublicationDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const created = await this.social.create(dto);
    await this.auditLog.record(actor, 'social_publication.create', 'social_publication', created.id);
    return created;
  }

  @Patch(':id')
  @RequireRoles(...ROLE_SETS.socialWrite)
  async update(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateSocialPublicationDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const updated = await this.social.update(id, dto);
    await this.auditLog.record(actor, 'social_publication.update', 'social_publication', id);
    return updated;
  }

  @Delete(':id')
  @RequireRoles(...ROLE_SETS.socialWrite)
  async remove(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const result = await this.social.delete(id);
    await this.auditLog.record(actor, 'social_publication.delete', 'social_publication', id);
    return result;
  }

  @Post(':id/publish')
  @RequireRoles(...ROLE_SETS.socialWrite)
  async publish(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const result = await this.social.publish(id);
    await this.auditLog.record(actor, 'social_publication.publish', 'social_publication', id);
    return result;
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

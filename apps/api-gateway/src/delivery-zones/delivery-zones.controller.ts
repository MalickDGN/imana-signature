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
import { DeliveryZonesService } from './delivery-zones.service';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from './delivery-zones.dto';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { CurrentAdmin } from '../admin-auth/current-admin.decorator';
import type { AdminUser } from '../admin-auth/admin-auth.service';
import { ROLE_SETS } from '../admin-auth/roles';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('admin/delivery-zones')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.deliveryZonesRead)
export class AdminDeliveryZonesController {
  constructor(
    private readonly deliveryZones: DeliveryZonesService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  list(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.deliveryZones.listAll();
  }

  @Post()
  @RequireRoles(...ROLE_SETS.deliveryZonesWrite)
  async create(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateDeliveryZoneDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const created = await this.deliveryZones.create(dto);
    await this.auditLog.record(actor, 'delivery_zone.create', 'delivery_zone', created.id, { ...dto });
    return created;
  }

  @Patch(':id')
  @RequireRoles(...ROLE_SETS.deliveryZonesWrite)
  async update(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryZoneDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const updated = await this.deliveryZones.update(id, { ...dto });
    await this.auditLog.record(actor, 'delivery_zone.update', 'delivery_zone', id, { ...dto });
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

@Controller('delivery-zones')
export class PublicDeliveryZonesController {
  constructor(private readonly deliveryZones: DeliveryZonesService) {}

  @Get()
  listActive() {
    return this.deliveryZones.listActive();
  }
}

import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { OrdersAdminService } from './orders-admin.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { CurrentAdmin } from '../admin-auth/current-admin.decorator';
import type { AdminUser } from '../admin-auth/admin-auth.service';
import { ROLE_SETS } from '../admin-auth/roles';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('admin/orders')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.ordersRead)
export class OrdersAdminController {
  constructor(
    private readonly orders: OrdersAdminService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  list(
    @Headers('x-admin-import-token') token: string | undefined,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.authorize(token);
    return this.orders.list({
      status,
      search,
      limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
      offset: Math.max(Number(offset) || 0, 0),
    });
  }

  @Get(':id')
  findOne(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.authorize(token);
    return this.orders.findOne(id);
  }

  @Post(':id/confirm')
  @RequireRoles(...ROLE_SETS.ordersWrite)
  async confirm(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    await this.orders.confirm(id);
    await this.auditLog.record(actor, 'order.confirm', 'sale_order', String(id));
    return { confirmed: true };
  }

  @Post(':id/cancel')
  @RequireRoles(...ROLE_SETS.ordersWrite)
  async cancel(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    await this.orders.cancel(id);
    await this.auditLog.record(actor, 'order.cancel', 'sale_order', String(id));
    return { cancelled: true };
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

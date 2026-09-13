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
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './payment-methods.dto';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { CurrentAdmin } from '../admin-auth/current-admin.decorator';
import type { AdminUser } from '../admin-auth/admin-auth.service';
import { ROLE_SETS } from '../admin-auth/roles';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('admin/payment-methods')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.paymentMethodsRead)
export class AdminPaymentMethodsController {
  constructor(
    private readonly paymentMethods: PaymentMethodsService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  list(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.paymentMethods.listAll();
  }

  @Post()
  @RequireRoles(...ROLE_SETS.paymentMethodsWrite)
  async create(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreatePaymentMethodDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const created = await this.paymentMethods.create(dto);
    await this.auditLog.record(actor, 'payment_method.create', 'payment_method', created.id, { ...dto });
    return created;
  }

  @Patch(':id')
  @RequireRoles(...ROLE_SETS.paymentMethodsWrite)
  async update(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    const updated = await this.paymentMethods.update(id, { ...dto });
    await this.auditLog.record(actor, 'payment_method.update', 'payment_method', id, { ...dto });
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

@Controller('payment-methods')
export class PublicPaymentMethodsController {
  constructor(private readonly paymentMethods: PaymentMethodsService) {}

  @Get()
  listActive() {
    return this.paymentMethods.listActive();
  }
}

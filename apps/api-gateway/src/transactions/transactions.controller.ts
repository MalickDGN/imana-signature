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
import { TransactionsService } from './transactions.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { ROLE_SETS } from '../admin-auth/roles';

@Controller('admin/transactions')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.transactionsRead)
export class TransactionsController {
  constructor(
    private readonly transactions: TransactionsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  list(
    @Headers('x-admin-import-token') token: string | undefined,
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.authorize(token);
    return this.transactions.list({
      status,
      provider,
      limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
      offset: Math.max(Number(offset) || 0, 0),
    });
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

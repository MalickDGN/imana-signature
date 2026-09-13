import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { SeoService } from './seo.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { ROLE_SETS } from '../admin-auth/roles';

@Controller('admin/seo-analysis')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.seoRead)
export class SeoController {
  constructor(
    private readonly seo: SeoService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  analyze(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.seo.analyze();
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

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import {
  CreateCampaignDto,
  TrackAnalyticsEventDto,
  UpdateCampaignDto,
} from './analytics.dto';
import { AnalyticsService } from './analytics.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { ROLE_SETS } from '../admin-auth/roles';

interface HeaderResponse {
  setHeader(name: string, value: string | number): void;
}

@Controller('analytics')
export class PublicAnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  track(@Body() dto: TrackAnalyticsEventDto) {
    return this.analytics.track(dto);
  }
}

@Controller('admin/analytics')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.opsRead)
export class AdminAnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly config: ConfigService,
  ) {}

  @Get('overview')
  overview(
    @Headers('x-admin-import-token') token: string | undefined,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.authorize(token);
    return this.analytics.overview(from, to);
  }

  @Get('campaigns')
  campaigns(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.analytics.listCampaigns();
  }

  @Post('campaigns')
  createCampaign(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateCampaignDto,
  ) {
    this.authorize(token);
    return this.analytics.createCampaign(dto);
  }

  @Patch('campaigns/:id')
  updateCampaign(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    this.authorize(token);
    return this.analytics.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  deleteCampaign(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.authorize(token);
    return this.analytics.deleteCampaign(id);
  }

  @Get('report')
  async report(
    @Headers('x-admin-import-token') token: string | undefined,
    @Res({ passthrough: true }) response: HeaderResponse,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.authorize(token);
    const buffer = await this.analytics.report(from, to);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="rapport-analytics-imana.xlsx"',
    );
    return new StreamableFile(buffer);
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

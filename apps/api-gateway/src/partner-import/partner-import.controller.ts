import {
  Controller,
  Body,
  Get,
  Headers,
  Param,
  Post,
  Req,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { timingSafeEqual } from 'node:crypto';
import { PartnerImportService } from './partner-import.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import type { AdminRequest } from '../admin-auth/admin-auth.guard';
import { ROLE_SETS } from '../admin-auth/roles';

@Controller('admin/partner-import')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.etlRead)
export class PartnerImportController {
  constructor(
    private readonly service: PartnerImportService,
    private readonly config: ConfigService,
  ) {}

  @Post('validate')
  @RequireRoles(...ROLE_SETS.etlOperate)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  validate(
    @Headers('x-admin-import-token') token: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: AdminRequest,
  ) {
    this.assertAuthorized(token);
    return this.service.validate(file, request.adminUser);
  }

  @Post(':batchId/execute')
  @RequireRoles(...ROLE_SETS.etlApprove)
  execute(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('batchId') batchId: string,
    @Req() request: AdminRequest,
  ) {
    this.assertAuthorized(token);
    return this.service.execute(batchId, request.adminUser);
  }

  @Post(':batchId/dry-run')
  @RequireRoles(...ROLE_SETS.etlOperate)
  dryRun(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('batchId') batchId: string,
    @Body() body: { strategy?: string },
    @Req() request: AdminRequest,
  ) {
    this.assertAuthorized(token);
    return this.service.dryRun(batchId, body?.strategy, request.adminUser);
  }

  @Post(':batchId/retry')
  @RequireRoles(...ROLE_SETS.etlApprove)
  retry(@Headers('x-admin-import-token') token: string | undefined, @Param('batchId') batchId: string, @Req() request: AdminRequest) {
    this.assertAuthorized(token); return this.service.retry(batchId, request.adminUser);
  }

  @Get(':batchId/report')
  async report(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('batchId') batchId: string,
  ) {
    this.assertAuthorized(token);
    const report = await this.service.createReport(batchId);
    return new StreamableFile(report, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="rapport-import-partenaires-${batchId}.xlsx"`,
      length: report.byteLength,
    });
  }

  private assertAuthorized(token: string | undefined): void {
    const expected = this.config.get<string>('ADMIN_IMPORT_TOKEN');
    if (!expected || !token) throw new UnauthorizedException();
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(token);
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException();
    }
  }
}

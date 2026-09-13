import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { timingSafeEqual } from 'node:crypto';
import { PartnerImportService } from './partner-import.service';

@Controller('admin/partner-import')
export class PartnerImportController {
  constructor(
    private readonly service: PartnerImportService,
    private readonly config: ConfigService,
  ) {}

  @Post('validate')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  validate(
    @Headers('x-admin-import-token') token: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.assertAuthorized(token);
    return this.service.validate(file);
  }

  @Post(':batchId/execute')
  execute(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('batchId') batchId: string,
  ) {
    this.assertAuthorized(token);
    return this.service.execute(batchId);
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

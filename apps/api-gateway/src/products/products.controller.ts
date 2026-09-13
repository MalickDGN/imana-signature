import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { CurrentAdmin } from '../admin-auth/current-admin.decorator';
import type { AdminUser } from '../admin-auth/admin-auth.service';
import { ROLE_SETS } from '../admin-auth/roles';
import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('categories')
  findCategories() {
    return this.productsService.findCategories();
  }

  @Get('metrics')
  metrics() {
    return this.productsService.getMetrics();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Get(':id/image')
  async findImage(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    const image = await this.productsService.findImage(id);
    response.setHeader('Content-Type', 'image/jpeg');
    response.setHeader('Content-Length', image.byteLength);
    response.setHeader('Cache-Control', 'public, max-age=86400');
    return new StreamableFile(image);
  }

  @Patch(':id')
  @UseGuards(AdminAccessGuard)
  @RequireRoles(...ROLE_SETS.productsWrite)
  async update(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    await this.productsService.update(id, dto);
    await this.auditLog.record(actor, 'product.update', 'product', String(id), { ...dto });
    return { updated: true };
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

interface HeaderResponse {
  setHeader(name: string, value: string | number): void;
}

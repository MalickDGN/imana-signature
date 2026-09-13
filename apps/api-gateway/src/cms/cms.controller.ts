import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { timingSafeEqual } from 'node:crypto';
import {
  CreateArticleDto,
  CreateFaqDto,
  CreateTaxonomyDto,
  MediaMetadataDto,
  UpdateArticleDto,
  UpdateFaqDto,
} from './cms.dto';
import { CmsService } from './cms.service';
import { AdminAccessGuard, RequireRoles } from '../admin-auth/admin-auth.guard';
import { CurrentAdmin } from '../admin-auth/current-admin.decorator';
import type { AdminUser } from '../admin-auth/admin-auth.service';
import { ROLE_SETS } from '../admin-auth/roles';

interface HeaderResponse {
  setHeader(name: string, value: string | number): void;
}

@Controller('admin/cms')
@UseGuards(AdminAccessGuard)
@RequireRoles(...ROLE_SETS.cmsRead)
export class AdminCmsController {
  constructor(
    private readonly cms: CmsService,
    private readonly config: ConfigService,
  ) {}

  @Get('overview')
  overview(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.cms.overview();
  }

  @Get('articles')
  articles(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.cms.listArticles();
  }

  @Post('articles')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  createArticle(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateArticleDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    return this.cms.createArticle(dto, actor);
  }

  @Post('articles/:id/preview-token')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  previewToken(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.authorize(token);
    return this.cms.createPreviewToken(id);
  }

  @Patch('articles/:id')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  updateArticle(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentAdmin() actor: AdminUser,
  ) {
    this.authorize(token);
    return this.cms.updateArticle(id, dto, actor);
  }

  @Delete('articles/:id')
  @RequireRoles(...ROLE_SETS.cmsPublish)
  deleteArticle(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.authorize(token);
    return this.cms.deleteArticle(id);
  }

  @Get('categories')
  categories(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.cms.listCategories();
  }

  @Post('categories')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  createCategory(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateTaxonomyDto,
  ) {
    this.authorize(token);
    return this.cms.createCategory(dto);
  }

  @Get('tags')
  tags(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.cms.listTags();
  }

  @Post('tags')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  createTag(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateTaxonomyDto,
  ) {
    this.authorize(token);
    return this.cms.createTag(dto);
  }

  @Get('faqs')
  faqs(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.cms.listFaqs();
  }

  @Post('faqs')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  createFaq(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateFaqDto,
  ) {
    this.authorize(token);
    return this.cms.createFaq(dto);
  }

  @Patch('faqs/:id')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  updateFaq(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateFaqDto,
  ) {
    this.authorize(token);
    return this.cms.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @RequireRoles(...ROLE_SETS.cmsPublish)
  deleteFaq(
    @Headers('x-admin-import-token') token: string | undefined,
    @Param('id') id: string,
  ) {
    this.authorize(token);
    return this.cms.deleteFaq(id);
  }

  @Get('faq-categories')
  faqCategories(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.cms.listFaqCategories();
  }

  @Post('faq-categories')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  createFaqCategory(
    @Headers('x-admin-import-token') token: string | undefined,
    @Body() dto: CreateTaxonomyDto,
  ) {
    this.authorize(token);
    return this.cms.createFaqCategory(dto);
  }

  @Get('media')
  media(@Headers('x-admin-import-token') token?: string) {
    this.authorize(token);
    return this.cms.listMedia();
  }

  @Post('media')
  @RequireRoles(...ROLE_SETS.cmsWrite)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  uploadMedia(
    @Headers('x-admin-import-token') token: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: MediaMetadataDto,
  ) {
    this.authorize(token);
    return this.cms.createMedia(file, metadata.altText);
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

@Controller('content')
export class PublicCmsController {
  constructor(private readonly cms: CmsService) {}

  @Get('articles')
  articles() {
    return this.cms.listArticles(true);
  }

  @Get('articles/:slug')
  article(@Param('slug') slug: string) {
    return this.cms.findPublishedArticle(slug);
  }

  @Get('preview/:token')
  preview(@Param('token') token: string) {
    return this.cms.previewArticle(token);
  }

  @Get('faqs')
  faqs() {
    return this.cms.listFaqs(true);
  }

  @Get('media/:id')
  async media(
    @Param('id') id: string,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    const media = await this.cms.getMedia(id);
    response.setHeader('Content-Type', media.mime_type);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(media.name)}"`,
    );
    response.setHeader('Content-Length', media.size_bytes);
    response.setHeader('Cache-Control', 'public, max-age=86400');
    return new StreamableFile(media.data);
  }
}

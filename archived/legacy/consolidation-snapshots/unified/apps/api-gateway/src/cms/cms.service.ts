import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import {
  CreateArticleDto,
  CreateFaqDto,
  CreateTaxonomyDto,
  UpdateArticleDto,
  UpdateFaqDto,
} from './cms.dto';

const ALLOWED_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf',
]);

@Injectable()
export class CmsService {
  constructor(private readonly db: PortalDatabaseService) {}

  async overview() {
    const [
      articles,
      published,
      scheduled,
      faqs,
      media,
      missingSeo,
    ] = await Promise.all([
      this.count('cms_articles'),
      this.countWhere('cms_articles', `status = 'published'`),
      this.countWhere('cms_articles', `status = 'scheduled'`),
      this.count('faq_items'),
      this.count('cms_media'),
      this.countWhere(
        'cms_articles',
        `status IN ('published', 'scheduled') AND
         (COALESCE(seo_title, '') = '' OR COALESCE(seo_description, '') = '')`,
      ),
    ]);
    return {
      articles,
      published,
      scheduled,
      faqs,
      media,
      missingSeo,
      databaseAvailable: this.db.isAvailable(),
    };
  }

  async listArticles(publicOnly = false) {
    const articles = this.db.table('cms_articles');
    const categories = this.db.table('cms_categories');
    const media = this.db.table('cms_media');
    const articleTags = this.db.table('cms_article_tags');
    const tags = this.db.table('cms_tags');
    const visibility = publicOnly
      ? `WHERE a.status = 'published'
         OR (a.status = 'scheduled' AND a.publish_at <= now())`
      : '';
    const result = await this.db.query(
      `SELECT
        a.*,
        c.name AS category_name,
        c.slug AS category_slug,
        CASE WHEN m.id IS NULL THEN NULL ELSE '/api/content/media/' || m.id END AS cover_url,
        COALESCE((
          SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
            ORDER BY t.name)
          FROM ${articleTags} at
          JOIN ${tags} t ON t.id = at.tag_id
          WHERE at.article_id = a.id
        ), '[]'::json) AS tags
       FROM ${articles} a
       LEFT JOIN ${categories} c ON c.id = a.category_id
       LEFT JOIN ${media} m ON m.id = a.cover_media_id
       ${visibility}
       ORDER BY COALESCE(a.publish_at, a.created_at) DESC`,
    );
    return result.rows.map(mapArticle);
  }

  async findPublishedArticle(slug: string) {
    const rows = (await this.listArticles(true)) as ArticleView[];
    const article = rows.find((item) => item.slug === slug);
    if (!article) throw new NotFoundException('Article introuvable.');
    return article;
  }

  async createArticle(dto: CreateArticleDto) {
    const id = randomUUID();
    const slug = slugify(dto.slug || dto.title);
    const articles = this.db.table('cms_articles');
    await this.db.query(
      `INSERT INTO ${articles}
        (id, title, slug, excerpt, body_html, status, publish_at,
         category_id, cover_media_id, seo_title, seo_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id,
        dto.title.trim(),
        slug,
        dto.excerpt?.trim() || null,
        cleanHtml(dto.bodyHtml),
        dto.status,
        dto.publishAt ?? null,
        dto.categoryId || null,
        dto.coverMediaId || null,
        dto.seoTitle?.trim() || null,
        dto.seoDescription?.trim() || null,
      ],
    );
    await this.replaceArticleTags(id, dto.tagIds);
    return this.findArticleById(id);
  }

  async updateArticle(id: string, dto: UpdateArticleDto) {
    await this.findArticleById(id);
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };
    if (dto.title !== undefined) add('title', dto.title.trim());
    if (dto.slug !== undefined) add('slug', slugify(dto.slug));
    if (dto.excerpt !== undefined) add('excerpt', dto.excerpt.trim() || null);
    if (dto.bodyHtml !== undefined) add('body_html', cleanHtml(dto.bodyHtml));
    if (dto.status !== undefined) add('status', dto.status);
    if (dto.publishAt !== undefined) add('publish_at', dto.publishAt || null);
    if (dto.categoryId !== undefined) add('category_id', dto.categoryId || null);
    if (dto.coverMediaId !== undefined) {
      add('cover_media_id', dto.coverMediaId || null);
    }
    if (dto.seoTitle !== undefined) add('seo_title', dto.seoTitle.trim() || null);
    if (dto.seoDescription !== undefined) {
      add('seo_description', dto.seoDescription.trim() || null);
    }
    if (fields.length > 0) {
      values.push(id);
      await this.db.query(
        `UPDATE ${this.db.table('cms_articles')}
         SET ${fields.join(', ')}, updated_at = now()
         WHERE id = $${values.length}`,
        values,
      );
    }
    if (dto.tagIds !== undefined) await this.replaceArticleTags(id, dto.tagIds);
    return this.findArticleById(id);
  }

  async deleteArticle(id: string) {
    const result = await this.db.query(
      `DELETE FROM ${this.db.table('cms_articles')} WHERE id = $1`,
      [id],
    );
    if (result.rowCount === 0) throw new NotFoundException('Article introuvable.');
    return { deleted: true };
  }

  async listCategories() {
    const result = await this.db.query(
      `SELECT * FROM ${this.db.table('cms_categories')}
       ORDER BY active DESC, name ASC`,
    );
    return result.rows;
  }

  async createCategory(dto: CreateTaxonomyDto) {
    const id = randomUUID();
    const result = await this.db.query(
      `INSERT INTO ${this.db.table('cms_categories')}
        (id, name, slug, description)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [id, dto.name.trim(), slugify(dto.slug || dto.name), dto.description || null],
    );
    return result.rows[0];
  }

  async listTags() {
    const result = await this.db.query(
      `SELECT * FROM ${this.db.table('cms_tags')} ORDER BY name ASC`,
    );
    return result.rows;
  }

  async createTag(dto: CreateTaxonomyDto) {
    const id = randomUUID();
    const result = await this.db.query(
      `INSERT INTO ${this.db.table('cms_tags')} (id, name, slug)
       VALUES ($1,$2,$3) RETURNING *`,
      [id, dto.name.trim(), slugify(dto.slug || dto.name)],
    );
    return result.rows[0];
  }

  async listFaqs(publicOnly = false) {
    const visibility = publicOnly ? `WHERE f.status = 'published'` : '';
    const result = await this.db.query(
      `SELECT f.*, c.name AS category_name, c.slug AS category_slug
       FROM ${this.db.table('faq_items')} f
       LEFT JOIN ${this.db.table('faq_categories')} c ON c.id = f.category_id
       ${visibility}
       ORDER BY COALESCE(c.sequence, 999), f.sequence, f.created_at`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      question: row.question,
      answerHtml: row.answer_html,
      categoryId: row.category_id,
      categoryName: row.category_name,
      categorySlug: row.category_slug,
      status: row.status,
      sequence: row.sequence,
      updatedAt: row.updated_at,
    }));
  }

  async listFaqCategories() {
    const result = await this.db.query(
      `SELECT * FROM ${this.db.table('faq_categories')}
       ORDER BY sequence, name`,
    );
    return result.rows;
  }

  async createFaqCategory(dto: CreateTaxonomyDto) {
    const id = randomUUID();
    const result = await this.db.query(
      `INSERT INTO ${this.db.table('faq_categories')}
        (id, name, slug)
       VALUES ($1,$2,$3) RETURNING *`,
      [id, dto.name.trim(), slugify(dto.slug || dto.name)],
    );
    return result.rows[0];
  }

  async createFaq(dto: CreateFaqDto) {
    const id = randomUUID();
    const result = await this.db.query(
      `INSERT INTO ${this.db.table('faq_items')}
        (id, question, answer_html, category_id, status, sequence)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        id,
        dto.question.trim(),
        cleanHtml(dto.answerHtml),
        dto.categoryId || null,
        dto.status,
        dto.sequence,
      ],
    );
    return result.rows[0];
  }

  async updateFaq(id: string, dto: UpdateFaqDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };
    if (dto.question !== undefined) add('question', dto.question.trim());
    if (dto.answerHtml !== undefined) add('answer_html', cleanHtml(dto.answerHtml));
    if (dto.categoryId !== undefined) add('category_id', dto.categoryId || null);
    if (dto.status !== undefined) add('status', dto.status);
    if (dto.sequence !== undefined) add('sequence', dto.sequence);
    if (fields.length === 0) return { id };
    values.push(id);
    const result = await this.db.query(
      `UPDATE ${this.db.table('faq_items')}
       SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );
    if (result.rowCount === 0) throw new NotFoundException('FAQ introuvable.');
    return result.rows[0];
  }

  async deleteFaq(id: string) {
    const result = await this.db.query(
      `DELETE FROM ${this.db.table('faq_items')} WHERE id = $1`,
      [id],
    );
    if (result.rowCount === 0) throw new NotFoundException('FAQ introuvable.');
    return { deleted: true };
  }

  async listMedia() {
    const result = await this.db.query(
      `SELECT id, name, mime_type, size_bytes, alt_text, created_at,
              '/api/content/media/' || id AS url
       FROM ${this.db.table('cms_media')}
       ORDER BY created_at DESC`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      altText: row.alt_text,
      createdAt: row.created_at,
      url: row.url,
    }));
  }

  async createMedia(file: Express.Multer.File, altText?: string) {
    if (!file) throw new BadRequestException('Sélectionnez un média.');
    if (!ALLOWED_MEDIA_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Formats autorisés : JPEG, PNG, WebP, GIF, MP4, WebM et PDF.',
      );
    }
    const id = randomUUID();
    const result = await this.db.query(
      `INSERT INTO ${this.db.table('cms_media')}
        (id, name, mime_type, size_bytes, alt_text, data)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, mime_type, size_bytes, alt_text, created_at`,
      [id, file.originalname, file.mimetype, file.size, altText || null, file.buffer],
    );
    return {
      ...result.rows[0],
      url: `/api/content/media/${id}`,
    };
  }

  async getMedia(id: string) {
    const result = await this.db.query<{
      name: string;
      mime_type: string;
      size_bytes: number;
      data: Buffer;
    }>(
      `SELECT name, mime_type, size_bytes, data
       FROM ${this.db.table('cms_media')} WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) throw new NotFoundException('Média introuvable.');
    return result.rows[0];
  }

  private async findArticleById(id: string) {
    const all = (await this.listArticles(false)) as ArticleView[];
    const article = all.find((item) => item.id === id);
    if (!article) throw new NotFoundException('Article introuvable.');
    return article;
  }

  private async replaceArticleTags(articleId: string, tagIds: string[]) {
    await this.db.query(
      `DELETE FROM ${this.db.table('cms_article_tags')} WHERE article_id = $1`,
      [articleId],
    );
    for (const tagId of [...new Set(tagIds)]) {
      await this.db.query(
        `INSERT INTO ${this.db.table('cms_article_tags')} (article_id, tag_id)
         VALUES ($1,$2)`,
        [articleId, tagId],
      );
    }
  }

  private async count(table: Parameters<PortalDatabaseService['table']>[0]) {
    const result = await this.db.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM ${this.db.table(table)}`,
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  private async countWhere(
    table: Parameters<PortalDatabaseService['table']>[0],
    where: string,
  ) {
    const result = await this.db.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM ${this.db.table(table)} WHERE ${where}`,
    );
    return Number(result.rows[0]?.count ?? 0);
  }
}

export interface ArticleView {
  id: string;
  slug: string;
  [key: string]: unknown;
}

function mapArticle(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    bodyHtml: row.body_html,
    status: row.status,
    publishAt: row.publish_at,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    coverMediaId: row.cover_media_id,
    coverUrl: row.cover_url,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 240);
  if (!slug) throw new BadRequestException('Le slug est invalide.');
  return slug;
}

function cleanHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'figure',
      'figcaption',
      'video',
      'source',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      video: ['src', 'controls', 'poster'],
      source: ['src', 'type'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
      }),
    },
  });
}

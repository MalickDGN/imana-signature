import { describe, expect, it, vi } from 'vitest';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CmsService } from './cms.service';

const auditLog = { record: vi.fn() } as unknown as AuditLogService;

describe('CmsService', () => {
  it('sanitizes FAQ HTML before persistence', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ id: 'faq-1' }],
      rowCount: 1,
    });
    const service = new CmsService(
      {
        table: (name: string) => `"test"."${name}"`,
        query,
      } as unknown as PortalDatabaseService,
      auditLog,
    );

    await service.createFaq({
      question: 'Comment commander ?',
      answerHtml:
        '<p onclick="alert(1)">Avec soin.</p><script>alert(2)</script><a href="javascript:alert(3)">Lien</a>',
      status: 'published',
      sequence: 10,
    });

    const values = query.mock.calls[0][1] as unknown[];
    expect(values[2]).toContain('<p>Avec soin.</p>');
    expect(values[2]).not.toContain('onclick');
    expect(values[2]).not.toContain('<script');
    expect(values[2]).not.toContain('javascript:');
  });

  it('maps database article fields to the public contract', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: 'article-1',
          title: 'Le sillage',
          slug: 'le-sillage',
          body_html: '<p>Contenu</p>',
          status: 'published',
          category_name: 'Lifestyle',
          tags: [],
        },
      ],
    });
    const service = new CmsService(
      {
        table: (name: string) => `"test"."${name}"`,
        query,
      } as unknown as PortalDatabaseService,
      auditLog,
    );

    const articles = await service.listArticles(true);

    expect(articles).toEqual([
      expect.objectContaining({
        id: 'article-1',
        slug: 'le-sillage',
        bodyHtml: '<p>Contenu</p>',
        categoryName: 'Lifestyle',
      }),
    ]);
    expect(query.mock.calls[0][0]).toContain(`a.status = 'published'`);
  });

  it('records a CONTENT_PUBLISHED audit event when an article is created already published', async () => {
    let insertedId = '';
    const query = vi.fn().mockImplementation((sql: string, values?: unknown[]) => {
      if (sql.startsWith('INSERT INTO') && sql.includes('cms_articles')) {
        insertedId = String(values?.[0]);
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({
        rows: [{ id: insertedId, title: 'Nouveau', slug: 'nouveau', body_html: '<p>Ok</p>', status: 'published', tags: [] }],
      });
    });
    const record = vi.fn();
    const service = new CmsService(
      { table: (name: string) => `"test"."${name}"`, query } as unknown as PortalDatabaseService,
      { record } as unknown as AuditLogService,
    );

    await service.createArticle({
      title: 'Nouveau',
      bodyHtml: '<p>Ok</p>',
      status: 'published',
      seoIndex: true,
      tagIds: [],
      galleryMediaIds: [],
    } as never);

    expect(record).toHaveBeenCalledWith(
      undefined,
      'CONTENT_PUBLISHED',
      'cms_article',
      insertedId,
      expect.objectContaining({ source: 'admin', result: 'success' }),
    );
  });

  it('records a CONTENT_PUBLISHED audit event only when the status transitions to published', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ id: 'article-3', title: 'Ancien', slug: 'ancien', body_html: '<p>Ok</p>', status: 'draft', tags: [] }],
    });
    const record = vi.fn();
    const service = new CmsService(
      { table: (name: string) => `"test"."${name}"`, query } as unknown as PortalDatabaseService,
      { record } as unknown as AuditLogService,
    );

    await service.updateArticle('article-3', { status: 'published' } as never);

    expect(record).toHaveBeenCalledWith(
      undefined,
      'CONTENT_PUBLISHED',
      'cms_article',
      'article-3',
      expect.objectContaining({ source: 'admin', result: 'success' }),
    );
  });

  it('does not re-record CONTENT_PUBLISHED when an already published article is edited', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ id: 'article-4', title: 'Déjà publié', slug: 'deja-publie', body_html: '<p>Ok</p>', status: 'published', tags: [] }],
    });
    const record = vi.fn();
    const service = new CmsService(
      { table: (name: string) => `"test"."${name}"`, query } as unknown as PortalDatabaseService,
      { record } as unknown as AuditLogService,
    );

    await service.updateArticle('article-4', { status: 'published' } as never);

    expect(record).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { CmsService } from './cms.service';

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
});

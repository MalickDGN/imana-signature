import { describe, expect, it, vi } from 'vitest';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('persists only the validated first-party event fields', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 1 });
    const service = new AnalyticsService(createDb(query));

    await service.track({
      eventName: 'page_view',
      visitorId: 'visitor-1',
      sessionId: 'session-1',
      path: '/collections',
      source: 'newsletter',
      metadata: { locale: 'fr' },
    });

    expect(query).toHaveBeenCalledOnce();
    expect(query.mock.calls[0][1]).toEqual([
      'page_view',
      'visitor-1',
      'session-1',
      '/collections',
      null,
      'newsletter',
      null,
      null,
      null,
      '{"locale":"fr"}',
    ]);
  });

  it('computes the conversion rate and returns campaign performance', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('WITH per_session')) {
        return {
          rows: [{
            visitors: 80,
            sessions: 100,
            pageviews: 240,
            conversions: 5,
            revenue: 125000,
            bounce_rate: 31.456,
          }],
        };
      }
      if (sql.includes(`date_trunc('day'`)) return { rows: [] };
      if (sql.includes(`NULLIF(path`)) return { rows: [{ label: '/', count: 12 }] };
      if (sql.includes(`NULLIF(source`)) return { rows: [{ label: 'direct', count: 8 }] };
      if (sql.includes('published_articles')) {
        return {
          rows: [{
            published_articles: 3,
            missing_metadata: 1,
            published_faqs: 4,
          }],
        };
      }
      return {
        rows: [{
          id: 'campaign-1',
          name: 'Été',
          channel: 'email',
          status: 'active',
          starts_at: null,
          ends_at: null,
          budget_fcfa: '50000',
          utm_source: 'newsletter',
          utm_medium: 'email',
          utm_campaign: 'ete',
          sessions: 20,
          conversions: 2,
          revenue: 50000,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };
    });
    const service = new AnalyticsService(createDb(query));

    const result = await service.overview(
      '2026-06-01T00:00:00.000Z',
      '2026-07-01T00:00:00.000Z',
    );

    expect(result.metrics.conversionRate).toBe(5);
    expect(result.metrics.bounceRate).toBe(31.46);
    expect(result.campaigns[0]).toEqual(
      expect.objectContaining({ conversionRate: 10, budgetFcfa: 50000 }),
    );
    expect(result.seo.missing_metadata).toBe(1);
  });
});

function createDb(query: ReturnType<typeof vi.fn>) {
  return {
    table: (name: string) => `"test"."${name}"`,
    query,
  } as unknown as PortalDatabaseService;
}

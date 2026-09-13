import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { randomUUID } from 'node:crypto';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import {
  CreateCampaignDto,
  TrackAnalyticsEventDto,
  UpdateCampaignDto,
} from './analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: PortalDatabaseService) {}

  async track(dto: TrackAnalyticsEventDto) {
    const events = this.db.table('analytics_events');
    await this.db.query(
      `INSERT INTO ${events}
       (event_name, visitor_id, session_id, path, referrer, source, medium,
        campaign, value_fcfa, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        dto.eventName,
        dto.visitorId,
        dto.sessionId,
        dto.path ?? null,
        dto.referrer ?? null,
        dto.source ?? null,
        dto.medium ?? null,
        dto.campaign ?? null,
        dto.valueFcfa ?? null,
        JSON.stringify(dto.metadata ?? {}),
      ],
    );
    return { accepted: true };
  }

  async overview(from?: string, to?: string) {
    const range = parseRange(from, to);
    const events = this.db.table('analytics_events');
    const articles = this.db.table('cms_articles');
    const faqs = this.db.table('faq_items');
    const campaignsTable = this.db.table('marketing_campaigns');
    const params = [range.from.toISOString(), range.to.toISOString()];
    const period = `happened_at >= $1::timestamptz AND happened_at < $2::timestamptz`;

    const [summary, timeline, topPages, sources, seo, campaigns] =
      await Promise.all([
        this.db.query<SummaryRow>(
          `WITH per_session AS (
             SELECT session_id,
                    count(*) FILTER (WHERE event_name = 'page_view') AS pageviews
             FROM ${events}
             WHERE ${period}
             GROUP BY session_id
           )
           SELECT
             count(DISTINCT visitor_id)::int AS visitors,
             count(DISTINCT session_id)::int AS sessions,
             count(*) FILTER (WHERE event_name = 'page_view')::int AS pageviews,
             count(*) FILTER (WHERE event_name = 'conversion')::int AS conversions,
             COALESCE(sum(value_fcfa) FILTER (WHERE event_name = 'conversion'), 0)::float8
               AS revenue,
             COALESCE((
               SELECT 100.0 * count(*) FILTER (WHERE pageviews <= 1)
                      / NULLIF(count(*), 0)
               FROM per_session
             ), 0)::float8 AS bounce_rate
           FROM ${events}
           WHERE ${period}`,
          params,
        ),
        this.db.query<TimelineRow>(
          `SELECT date_trunc('day', happened_at)::date::text AS day,
                  count(DISTINCT visitor_id)::int AS visitors,
                  count(DISTINCT session_id)::int AS sessions,
                  count(*) FILTER (WHERE event_name = 'page_view')::int AS pageviews,
                  count(*) FILTER (WHERE event_name = 'conversion')::int AS conversions
           FROM ${events}
           WHERE ${period}
           GROUP BY 1 ORDER BY 1`,
          params,
        ),
        this.db.query<LabelCountRow>(
          `SELECT COALESCE(NULLIF(path, ''), '/') AS label, count(*)::int AS count
           FROM ${events}
           WHERE ${period} AND event_name = 'page_view'
           GROUP BY 1 ORDER BY count DESC LIMIT 10`,
          params,
        ),
        this.db.query<LabelCountRow>(
          `SELECT COALESCE(NULLIF(source, ''), 'direct') AS label,
                  count(DISTINCT session_id)::int AS count
           FROM ${events}
           WHERE ${period}
           GROUP BY 1 ORDER BY count DESC LIMIT 10`,
          params,
        ),
        this.db.query<SeoRow>(
          `SELECT
             count(*) FILTER (
               WHERE status = 'published'
                  OR (status = 'scheduled' AND publish_at <= now())
             )::int AS published_articles,
             count(*) FILTER (
               WHERE status IN ('published', 'scheduled')
                 AND (COALESCE(seo_title, '') = ''
                   OR COALESCE(seo_description, '') = '')
             )::int AS missing_metadata,
             (SELECT count(*)::int FROM ${faqs} WHERE status = 'published')
               AS published_faqs
           FROM ${articles}`,
        ),
        this.db.query<CampaignRow>(
          `SELECT c.*,
                  count(DISTINCT e.session_id)::int AS sessions,
                  count(*) FILTER (WHERE e.event_name = 'conversion')::int AS conversions,
                  COALESCE(sum(e.value_fcfa) FILTER (
                    WHERE e.event_name = 'conversion'
                  ), 0)::float8 AS revenue
           FROM ${campaignsTable} c
           LEFT JOIN ${events} e
             ON e.campaign = c.utm_campaign
            AND e.happened_at >= $1::timestamptz
            AND e.happened_at < $2::timestamptz
           GROUP BY c.id
           ORDER BY c.created_at DESC`,
          params,
        ),
      ]);

    const metrics = summary.rows[0] ?? emptySummary();
    return {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      metrics: {
        visitors: metrics.visitors,
        sessions: metrics.sessions,
        pageviews: metrics.pageviews,
        conversions: metrics.conversions,
        revenue: metrics.revenue,
        conversionRate:
          metrics.sessions > 0
            ? round((metrics.conversions / metrics.sessions) * 100)
            : 0,
        bounceRate: round(metrics.bounce_rate),
      },
      timeline: timeline.rows,
      topPages: topPages.rows,
      sources: sources.rows,
      seo: seo.rows[0] ?? {
        published_articles: 0,
        missing_metadata: 0,
        published_faqs: 0,
      },
      campaigns: campaigns.rows.map(mapCampaign),
      collection: { provider: 'first_party', configured: true },
    };
  }

  async listCampaigns() {
    const table = this.db.table('marketing_campaigns');
    const result = await this.db.query<CampaignRow>(
      `SELECT *, 0::int AS sessions, 0::int AS conversions, 0::float8 AS revenue
       FROM ${table} ORDER BY created_at DESC`,
    );
    return result.rows.map(mapCampaign);
  }

  async createCampaign(dto: CreateCampaignDto) {
    validateCampaignDates(dto.startsAt, dto.endsAt);
    const table = this.db.table('marketing_campaigns');
    const result = await this.db.query<CampaignRow>(
      `INSERT INTO ${table}
       (id, name, channel, status, starts_at, ends_at, budget_fcfa,
        utm_source, utm_medium, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *, 0::int AS sessions, 0::int AS conversions,
                 0::float8 AS revenue`,
      [
        randomUUID(),
        dto.name.trim(),
        dto.channel,
        dto.status,
        toDateOrNull(dto.startsAt),
        toDateOrNull(dto.endsAt),
        dto.budgetFcfa,
        nullable(dto.utmSource),
        nullable(dto.utmMedium),
        dto.utmCampaign.trim(),
      ],
    );
    return mapCampaign(result.rows[0]);
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    validateCampaignDates(dto.startsAt, dto.endsAt);
    const table = this.db.table('marketing_campaigns');
    const result = await this.db.query<CampaignRow>(
      `UPDATE ${table} SET
         name = COALESCE($2, name),
         channel = COALESCE($3, channel),
         status = COALESCE($4, status),
         starts_at = COALESCE($5, starts_at),
         ends_at = COALESCE($6, ends_at),
         budget_fcfa = COALESCE($7, budget_fcfa),
         utm_source = COALESCE($8, utm_source),
         utm_medium = COALESCE($9, utm_medium),
         utm_campaign = COALESCE($10, utm_campaign),
         updated_at = now()
       WHERE id = $1
       RETURNING *, 0::int AS sessions, 0::int AS conversions,
                 0::float8 AS revenue`,
      [
        id,
        nullable(dto.name),
        dto.channel ?? null,
        dto.status ?? null,
        toDateOrNull(dto.startsAt),
        toDateOrNull(dto.endsAt),
        dto.budgetFcfa ?? null,
        nullable(dto.utmSource),
        nullable(dto.utmMedium),
        nullable(dto.utmCampaign),
      ],
    );
    if (!result.rows[0]) throw new NotFoundException('Campagne introuvable.');
    return mapCampaign(result.rows[0]);
  }

  async report(from?: string, to?: string): Promise<Buffer> {
    const data = await this.overview(from, to);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IMANA Signature';
    workbook.created = new Date();

    const summary = workbook.addWorksheet('Synthèse');
    summary.columns = [
      { header: 'Indicateur', key: 'label', width: 28 },
      { header: 'Valeur', key: 'value', width: 20 },
    ];
    summary.addRows([
      { label: 'Visiteurs', value: data.metrics.visitors },
      { label: 'Sessions', value: data.metrics.sessions },
      { label: 'Pages vues', value: data.metrics.pageviews },
      { label: 'Taux de rebond (%)', value: data.metrics.bounceRate },
      { label: 'Conversions', value: data.metrics.conversions },
      { label: 'Taux de conversion (%)', value: data.metrics.conversionRate },
      { label: 'Revenu (FCFA)', value: data.metrics.revenue },
    ]);

    addSheet(workbook, 'Évolution', data.timeline);
    addSheet(workbook, 'Pages', data.topPages);
    addSheet(workbook, 'Sources', data.sources);
    addSheet(workbook, 'Campagnes', data.campaigns);
    for (const sheet of workbook.worksheets) {
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF19323C' },
      };
      sheet.autoFilter = {
        from: 'A1',
        to: `${sheet.getColumn(sheet.columnCount).letter}1`,
      };
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}

function parseRange(from?: string, to?: string) {
  const end = to ? new Date(to) : new Date();
  const start = from
    ? new Date(from)
    : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start >= end
  ) {
    throw new BadRequestException('Période Analytics invalide.');
  }
  if (end.getTime() - start.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw new BadRequestException('La période est limitée à 366 jours.');
  }
  return { from: start, to: end };
}

function validateCampaignDates(startsAt?: string, endsAt?: string) {
  if (startsAt && Number.isNaN(new Date(startsAt).getTime())) {
    throw new BadRequestException('Date de début invalide.');
  }
  if (endsAt && Number.isNaN(new Date(endsAt).getTime())) {
    throw new BadRequestException('Date de fin invalide.');
  }
  if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
    throw new BadRequestException('La fin doit suivre le début de campagne.');
  }
}

function toDateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

function nullable(value?: string) {
  return value?.trim() || null;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function emptySummary(): SummaryRow {
  return {
    visitors: 0,
    sessions: 0,
    pageviews: 0,
    conversions: 0,
    revenue: 0,
    bounce_rate: 0,
  };
}

function mapCampaign(row: CampaignRow) {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    budgetFcfa: Number(row.budget_fcfa),
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    sessions: row.sessions,
    conversions: row.conversions,
    revenue: row.revenue,
    conversionRate:
      row.sessions > 0 ? round((row.conversions / row.sessions) * 100) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function addSheet<T extends object>(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: T[],
) {
  const sheet = workbook.addWorksheet(name);
  const keys = rows.length ? Object.keys(rows[0]) : ['information'];
  sheet.columns = keys.map((key) => ({
    header: key,
    key,
    width: Math.min(35, Math.max(14, key.length + 3)),
  }));
  if (rows.length) sheet.addRows(rows as Record<string, unknown>[]);
  else sheet.addRow({ information: 'Aucune donnée sur la période.' });
}

interface SummaryRow {
  visitors: number;
  sessions: number;
  pageviews: number;
  conversions: number;
  revenue: number;
  bounce_rate: number;
}

export interface TimelineRow {
  day: string;
  visitors: number;
  sessions: number;
  pageviews: number;
  conversions: number;
}

export interface LabelCountRow {
  label: string;
  count: number;
}

export interface SeoRow {
  published_articles: number;
  missing_metadata: number;
  published_faqs: number;
}

interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  status: string;
  starts_at: Date | null;
  ends_at: Date | null;
  budget_fcfa: number | string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string;
  sessions: number;
  conversions: number;
  revenue: number;
  created_at: Date;
  updated_at: Date;
}

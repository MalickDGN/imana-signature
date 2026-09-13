import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class PortalDatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PortalDatabaseService.name);
  private readonly schema: string;
  private readonly pool: Pool;
  private available = false;

  constructor(config: ConfigService) {
    const schema = config.get<string>('PORTAL_DB_SCHEMA') ?? 'imana_portal';
    if (!/^[a-z_][a-z0-9_]*$/i.test(schema)) {
      throw new Error('PORTAL_DB_SCHEMA contains invalid characters.');
    }
    this.schema = schema;
    this.pool = new Pool({
      host: config.get<string>('POSTGRES_HOST') ?? 'localhost',
      port: Number(config.get<string>('POSTGRES_PORT') ?? 5432),
      database: config.get<string>('POSTGRES_DB') ?? 'imana_db',
      user: config.get<string>('POSTGRES_USER') ?? 'imana_admin',
      password: config.get<string>('POSTGRES_PASSWORD'),
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.migrate();
      this.available = true;
      this.logger.log(
        `Portal database schema "${this.schema}" is ready.`,
      );
    } catch (error) {
      this.available = false;
      this.logger.error(
        'Portal database initialization failed.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  isAvailable(): boolean {
    return this.available;
  }

  table(name: PortalTable): string {
    return `"${this.schema}"."${name}"`;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    if (!this.available) {
      throw new ServiceUnavailableException(
        'Le stockage CMS et Analytics est indisponible.',
      );
    }
    return this.pool.query<T>(text, values);
  }

  private async migrate(): Promise<void> {
    const schema = `"${this.schema}"`;
    await this.pool.query(`
      CREATE SCHEMA IF NOT EXISTS ${schema};

      CREATE TABLE IF NOT EXISTS ${schema}.cms_categories (
        id text PRIMARY KEY,
        name varchar(120) NOT NULL,
        slug varchar(140) NOT NULL UNIQUE,
        description text,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.cms_tags (
        id text PRIMARY KEY,
        name varchar(80) NOT NULL,
        slug varchar(100) NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.cms_media (
        id text PRIMARY KEY,
        name varchar(255) NOT NULL,
        mime_type varchar(120) NOT NULL,
        size_bytes integer NOT NULL,
        alt_text varchar(255),
        data bytea NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.cms_articles (
        id text PRIMARY KEY,
        title varchar(220) NOT NULL,
        slug varchar(240) NOT NULL UNIQUE,
        excerpt text,
        body_html text NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'scheduled', 'published', 'unpublished')),
        publish_at timestamptz,
        category_id text REFERENCES ${schema}.cms_categories(id) ON DELETE SET NULL,
        cover_media_id text REFERENCES ${schema}.cms_media(id) ON DELETE SET NULL,
        seo_title varchar(70),
        seo_description varchar(170),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.cms_article_tags (
        article_id text NOT NULL REFERENCES ${schema}.cms_articles(id) ON DELETE CASCADE,
        tag_id text NOT NULL REFERENCES ${schema}.cms_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (article_id, tag_id)
      );

      CREATE TABLE IF NOT EXISTS ${schema}.faq_categories (
        id text PRIMARY KEY,
        name varchar(120) NOT NULL,
        slug varchar(140) NOT NULL UNIQUE,
        sequence integer NOT NULL DEFAULT 10,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.faq_items (
        id text PRIMARY KEY,
        question varchar(300) NOT NULL,
        answer_html text NOT NULL,
        category_id text REFERENCES ${schema}.faq_categories(id) ON DELETE SET NULL,
        status varchar(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'published', 'unpublished')),
        sequence integer NOT NULL DEFAULT 10,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.marketing_campaigns (
        id text PRIMARY KEY,
        name varchar(180) NOT NULL,
        channel varchar(40) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'active', 'paused', 'completed')),
        starts_at timestamptz,
        ends_at timestamptz,
        budget_fcfa numeric(14,2) NOT NULL DEFAULT 0,
        utm_source varchar(120),
        utm_medium varchar(120),
        utm_campaign varchar(160) NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.analytics_events (
        id bigserial PRIMARY KEY,
        event_name varchar(60) NOT NULL,
        visitor_id varchar(120) NOT NULL,
        session_id varchar(120) NOT NULL,
        path varchar(500),
        referrer varchar(1000),
        source varchar(120),
        medium varchar(120),
        campaign varchar(160),
        value_fcfa numeric(14,2),
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        happened_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS analytics_events_happened_at_idx
        ON ${schema}.analytics_events(happened_at);
      CREATE INDEX IF NOT EXISTS analytics_events_session_idx
        ON ${schema}.analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS analytics_events_campaign_idx
        ON ${schema}.analytics_events(campaign);
      CREATE INDEX IF NOT EXISTS cms_articles_status_publish_idx
        ON ${schema}.cms_articles(status, publish_at);
      CREATE INDEX IF NOT EXISTS faq_items_status_idx
        ON ${schema}.faq_items(status, sequence);

      INSERT INTO ${schema}.cms_categories (id, name, slug, description)
      VALUES ('category-lifestyle', 'Lifestyle', 'lifestyle', 'Articles lifestyle IMANA')
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO ${schema}.faq_categories (id, name, slug, sequence)
      VALUES ('faq-general', 'Questions générales', 'general', 10)
      ON CONFLICT (slug) DO NOTHING;
    `);
  }
}

export type PortalTable =
  | 'cms_categories'
  | 'cms_tags'
  | 'cms_media'
  | 'cms_articles'
  | 'cms_article_tags'
  | 'faq_categories'
  | 'faq_items'
  | 'marketing_campaigns'
  | 'analytics_events';

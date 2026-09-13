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
  private readonly config: ConfigService;
  private available = false;

  constructor(config: ConfigService) {
    this.config = config;
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

      ALTER TABLE ${schema}.cms_articles
        ADD COLUMN IF NOT EXISTS author varchar(160);
      ALTER TABLE ${schema}.cms_articles
        ADD COLUMN IF NOT EXISTS canonical_url varchar(500);
      ALTER TABLE ${schema}.cms_articles
        ADD COLUMN IF NOT EXISTS og_image_media_id text
          REFERENCES ${schema}.cms_media(id) ON DELETE SET NULL;
      ALTER TABLE ${schema}.cms_articles
        ADD COLUMN IF NOT EXISTS seo_index boolean NOT NULL DEFAULT true;
      ALTER TABLE ${schema}.cms_articles
        ADD COLUMN IF NOT EXISTS gallery_media_ids text[] NOT NULL DEFAULT ARRAY[]::text[];
      ALTER TABLE ${schema}.cms_articles DROP CONSTRAINT IF EXISTS cms_articles_status_check;
      ALTER TABLE ${schema}.cms_articles
        ADD CONSTRAINT cms_articles_status_check
        CHECK (status IN (
          'draft', 'in_review', 'scheduled', 'published', 'unpublished', 'archived'
        ));

      CREATE TABLE IF NOT EXISTS ${schema}.cms_preview_tokens (
        token_hash text PRIMARY KEY,
        article_id text NOT NULL REFERENCES ${schema}.cms_articles(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        created_by text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.portal_users (
        id text PRIMARY KEY,
        email varchar(180) NOT NULL UNIQUE,
        name varchar(160) NOT NULL,
        password_hash text NOT NULL,
        roles text[] NOT NULL DEFAULT ARRAY['MANAGER']::text[],
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.portal_sessions (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES ${schema}.portal_users(id) ON DELETE CASCADE,
        token_hash text NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.etl_jobs (
        id text PRIMARY KEY,
        object_type varchar(40) NOT NULL,
        file_name varchar(255) NOT NULL,
        status varchar(40) NOT NULL,
        user_id text,
        user_email varchar(180),
        environment varchar(40),
        mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
        summary jsonb NOT NULL DEFAULT '{}'::jsonb,
        strategy varchar(20) NOT NULL DEFAULT 'UPSERT',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE ${schema}.etl_jobs
        ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
      ALTER TABLE ${schema}.etl_jobs
        ADD COLUMN IF NOT EXISTS expires_at timestamptz;

      CREATE TABLE IF NOT EXISTS ${schema}.etl_job_events (
        id bigserial PRIMARY KEY,
        job_id text NOT NULL REFERENCES ${schema}.etl_jobs(id) ON DELETE CASCADE,
        event_type varchar(60) NOT NULL,
        details jsonb NOT NULL DEFAULT '{}'::jsonb,
        happened_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS etl_job_events_job_idx
        ON ${schema}.etl_job_events(job_id, happened_at);

      CREATE TABLE IF NOT EXISTS ${schema}.payment_transactions (
        id text PRIMARY KEY,
        order_id integer NOT NULL,
        provider varchar(40) NOT NULL,
        amount_fcfa numeric(14,2) NOT NULL,
        external_reference text,
        status varchar(40) NOT NULL,
        customer_phone varchar(40),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS payment_provider_order_idx
        ON ${schema}.payment_transactions(provider, order_id);

      CREATE TABLE IF NOT EXISTS ${schema}.audit_logs (
        id bigserial PRIMARY KEY,
        actor_id text,
        actor_email varchar(180),
        action varchar(80) NOT NULL,
        entity_type varchar(60) NOT NULL,
        entity_id text,
        details jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
        ON ${schema}.audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
        ON ${schema}.audit_logs(entity_type, entity_id);

      CREATE TABLE IF NOT EXISTS ${schema}.payment_methods (
        id text PRIMARY KEY,
        code varchar(40) NOT NULL UNIQUE,
        label varchar(120) NOT NULL,
        provider varchar(40) NOT NULL,
        collect_at varchar(20) NOT NULL DEFAULT 'order'
          CHECK (collect_at IN ('order', 'delivery')),
        active boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 10,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.delivery_zones (
        id text PRIMARY KEY,
        name varchar(120) NOT NULL,
        price_fcfa numeric(14,2) NOT NULL DEFAULT 0,
        odoo_shipping_product_id varchar(40),
        active boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 10,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ${schema}.social_publications (
        id text PRIMARY KEY,
        title varchar(220) NOT NULL,
        body text NOT NULL,
        platform varchar(40) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
        scheduled_at timestamptz,
        published_at timestamptz,
        media_id text REFERENCES ${schema}.cms_media(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      INSERT INTO ${schema}.cms_categories (id, name, slug, description)
      VALUES ('category-lifestyle', 'Lifestyle', 'lifestyle', 'Articles lifestyle IMANA')
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO ${schema}.faq_categories (id, name, slug, sequence)
      VALUES ('faq-general', 'Questions générales', 'general', 10)
      ON CONFLICT (slug) DO NOTHING;
    `);
    await this.seedDefaultCheckoutConfig();
  }

  private async seedDefaultCheckoutConfig(): Promise<void> {
    const schema = `"${this.schema}"`;
    await this.pool.query(
      `INSERT INTO ${schema}.payment_methods (id, code, label, provider, collect_at, active, sort_order)
       VALUES
         ('payment-cod', 'cod', 'Paiement à la livraison', 'cod', 'delivery', true, 10),
         ('payment-wave', 'wave', 'Wave', 'wave', 'order', true, 20)
       ON CONFLICT (code) DO NOTHING`,
    );
    await this.pool.query(
      `INSERT INTO ${schema}.delivery_zones
        (id, name, price_fcfa, odoo_shipping_product_id, active, sort_order)
       VALUES
         ('zone-standard', 'Livraison Standard', 3000, $1, true, 10),
         ('zone-express', 'Livraison Express', 7000, $2, true, 20)
       ON CONFLICT (id) DO NOTHING`,
      [
        this.config.get<string>('ODOO_SHIPPING_STANDARD_PRODUCT_ID') ?? null,
        this.config.get<string>('ODOO_SHIPPING_EXPRESS_PRODUCT_ID') ?? null,
      ],
    );
  }
}

export type PortalTable =
  | 'cms_categories'
  | 'cms_tags'
  | 'cms_media'
  | 'cms_articles'
  | 'cms_article_tags'
  | 'cms_preview_tokens'
  | 'faq_categories'
  | 'faq_items'
  | 'marketing_campaigns'
  | 'analytics_events'
  | 'portal_users'
  | 'portal_sessions'
  | 'etl_jobs'
  | 'etl_job_events'
  | 'payment_transactions'
  | 'audit_logs'
  | 'payment_methods'
  | 'delivery_zones'
  | 'social_publications';

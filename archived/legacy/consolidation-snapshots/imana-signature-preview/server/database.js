import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.env.DATABASE_PATH || "data/imana.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });
export const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL, password_hash TEXT NOT NULL, stripe_customer_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    email TEXT PRIMARY KEY COLLATE NOCASE, full_name TEXT, phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    subscribed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY, stripe_session_id TEXT NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, email TEXT,
    amount_total INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, paid_at TEXT
  );
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
    description TEXT, parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active', sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS catalog_products (
    id INTEGER PRIMARY KEY, category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, sku TEXT UNIQUE, description TEXT,
    status TEXT NOT NULL DEFAULT 'draft', price INTEGER NOT NULL DEFAULT 0,
    cost_price INTEGER NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5, image_url TEXT, seo_title TEXT,
    seo_description TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, sku TEXT NOT NULL UNIQUE, attributes_json TEXT NOT NULL DEFAULT '{}',
    price INTEGER, cost_price INTEGER, stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES catalog_products(id) ON DELETE SET NULL,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL, quantity INTEGER NOT NULL, unit_cost INTEGER,
    reference TEXT, note TEXT, created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    provider TEXT NOT NULL, payment_timing TEXT NOT NULL DEFAULT 'order',
    enabled INTEGER NOT NULL DEFAULT 1, configuration_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS payment_transactions (
    id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
    provider_reference TEXT, amount INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'xof',
    status TEXT NOT NULL DEFAULT 'pending', raw_response_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, paid_at TEXT
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE, subtotal INTEGER NOT NULL, tax_amount INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'xof',
    status TEXT NOT NULL DEFAULT 'draft', issued_at TEXT, due_at TEXT, paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS delivery_zones (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
    fee INTEGER NOT NULL DEFAULT 0, free_from INTEGER, estimated_days_min INTEGER NOT NULL DEFAULT 1,
    estimated_days_max INTEGER NOT NULL DEFAULT 3, payment_timing TEXT NOT NULL DEFAULT 'order',
    enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    zone_id INTEGER REFERENCES delivery_zones(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', recipient_name TEXT, phone TEXT, address TEXT,
    tracking_reference TEXT, delivery_fee INTEGER NOT NULL DEFAULT 0,
    scheduled_at TEXT, delivered_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, channel TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
    audience TEXT, subject TEXT, content TEXT, starts_at TEXT, ends_at TEXT,
    budget INTEGER NOT NULL DEFAULT 0, metrics_json TEXT NOT NULL DEFAULT '{}',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT,
    content TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
    seo_title TEXT, seo_description TEXT, published_at TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL,
    category TEXT, status TEXT NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS social_publications (
    id INTEGER PRIMARY KEY, network TEXT NOT NULL, content TEXT NOT NULL, media_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft', external_id TEXT, scheduled_at TEXT, published_at TEXT,
    error_message TEXT, campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT,
    details_json TEXT NOT NULL DEFAULT '{}', ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_provider_unique
    ON payment_transactions(payment_method_id, provider_reference)
    WHERE provider_reference IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
  CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_movements(product_id, variant_id);
`);

const userColumns = new Set(
  database.prepare("PRAGMA table_info(users)").all().map((column) => column.name),
);
if (!userColumns.has("role")) database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'client'");
if (!userColumns.has("status")) database.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
if (!userColumns.has("phone")) database.exec("ALTER TABLE users ADD COLUMN phone TEXT");

const orderColumns = new Set(
  database.prepare("PRAGMA table_info(orders)").all().map((column) => column.name),
);
if (!orderColumns.has("delivery_status")) database.exec("ALTER TABLE orders ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'pending'");
if (!orderColumns.has("payment_method")) database.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT");

database.exec(`
  INSERT OR IGNORE INTO payment_methods (code, name, provider, payment_timing) VALUES
    ('cash', 'Espèces', 'manual', 'delivery'),
    ('bank_transfer', 'Virement bancaire', 'manual', 'order'),
    ('wave', 'Wave', 'wave', 'order'),
    ('orange_money', 'Orange Money', 'orange_money', 'order'),
    ('stripe', 'Carte bancaire — Stripe', 'stripe', 'order');
`);

const newsletterColumns = new Set(
  database.prepare("PRAGMA table_info(newsletter_subscribers)").all().map((column) => column.name),
);
if (!newsletterColumns.has("full_name")) database.exec("ALTER TABLE newsletter_subscribers ADD COLUMN full_name TEXT");
if (!newsletterColumns.has("phone")) database.exec("ALTER TABLE newsletter_subscribers ADD COLUMN phone TEXT");

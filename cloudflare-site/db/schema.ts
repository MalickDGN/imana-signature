import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("manager"),
  status: text("status").notNull().default("active"),
  ...timestamps,
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), slug: text("slug").notNull().unique(),
  description: text("description"), status: text("status").notNull().default("active"),
  sortOrder: integer("sort_order").notNull().default(0), ...timestamps,
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id"), name: text("name").notNull(),
  slug: text("slug").notNull().unique(), sku: text("sku").unique(),
  description: text("description"), status: text("status").notNull().default("draft"),
  price: integer("price").notNull().default(0), costPrice: integer("cost_price").notNull().default(0),
  stock: integer("stock").notNull().default(0), lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  imageUrl: text("image_url"), seoTitle: text("seo_title"), seoDescription: text("seo_description"), ...timestamps,
});

export const variants = sqliteTable("variants", {
  id: integer("id").primaryKey({ autoIncrement: true }), productId: integer("product_id").notNull(),
  name: text("name").notNull(), sku: text("sku").notNull().unique(),
  attributesJson: text("attributes_json").notNull().default("{}"), price: integer("price"),
  costPrice: integer("cost_price"), stock: integer("stock").notNull().default(0),
  status: text("status").notNull().default("active"), ...timestamps,
});

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }), email: text("email").notNull().unique(),
  fullName: text("full_name"), phone: text("phone"), status: text("status").notNull().default("active"), ...timestamps,
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }), customerEmail: text("customer_email"),
  amountTotal: integer("amount_total").notNull().default(0), currency: text("currency").notNull().default("xof"),
  status: text("status").notNull().default("pending"), deliveryStatus: text("delivery_status").notNull().default("pending"),
  paymentMethod: text("payment_method"), ...timestamps,
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }), orderId: integer("order_id").notNull().unique(),
  invoiceNumber: text("invoice_number").notNull().unique(), subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").notNull().default(0), total: integer("total").notNull(),
  currency: text("currency").notNull().default("xof"), status: text("status").notNull().default("draft"),
  dueAt: text("due_at"), paidAt: text("paid_at"), ...timestamps,
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }), orderId: integer("order_id"),
  provider: text("provider").notNull(), providerReference: text("provider_reference"),
  amount: integer("amount").notNull(), currency: text("currency").notNull().default("xof"),
  status: text("status").notNull().default("pending"), paidAt: text("paid_at"), ...timestamps,
});

export const deliveryZones = sqliteTable("delivery_zones", {
  id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(),
  code: text("code").notNull().unique(), fee: integer("fee").notNull().default(0),
  freeFrom: integer("free_from"), estimatedDaysMin: integer("estimated_days_min").notNull().default(1),
  estimatedDaysMax: integer("estimated_days_max").notNull().default(3),
  paymentTiming: text("payment_timing").notNull().default("order"),
  enabled: integer("enabled").notNull().default(1), ...timestamps,
});

export const deliveries = sqliteTable("deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }), orderId: integer("order_id").notNull(),
  zoneId: integer("zone_id"), recipientName: text("recipient_name"), phone: text("phone"),
  address: text("address"), trackingReference: text("tracking_reference"),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  status: text("status").notNull().default("pending"), scheduledAt: text("scheduled_at"),
  deliveredAt: text("delivered_at"), ...timestamps,
});

export const paymentMethods = sqliteTable("payment_methods", {
  id: integer("id").primaryKey({ autoIncrement: true }), code: text("code").notNull().unique(),
  name: text("name").notNull(), provider: text("provider").notNull(),
  paymentTiming: text("payment_timing").notNull().default("order"),
  enabled: integer("enabled").notNull().default(1), ...timestamps,
});

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(),
  channel: text("channel").notNull(), audience: text("audience"), subject: text("subject"),
  content: text("content"), status: text("status").notNull().default("draft"),
  startsAt: text("starts_at"), endsAt: text("ends_at"), budget: integer("budget").notNull().default(0), ...timestamps,
});

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(),
  slug: text("slug").notNull().unique(), excerpt: text("excerpt"), content: text("content").notNull().default(""),
  status: text("status").notNull().default("draft"), seoTitle: text("seo_title"),
  seoDescription: text("seo_description"), publishedAt: text("published_at"), ...timestamps,
});

export const faqs = sqliteTable("faqs", {
  id: integer("id").primaryKey({ autoIncrement: true }), question: text("question").notNull(),
  answer: text("answer").notNull(), category: text("category"),
  status: text("status").notNull().default("draft"), sortOrder: integer("sort_order").notNull().default(0), ...timestamps,
});

export const socialPublications = sqliteTable("social_publications", {
  id: integer("id").primaryKey({ autoIncrement: true }), network: text("network").notNull(),
  content: text("content").notNull(), mediaUrl: text("media_url"),
  status: text("status").notNull().default("draft"), scheduledAt: text("scheduled_at"),
  publishedAt: text("published_at"), externalId: text("external_id"), ...timestamps,
});

export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }), productId: integer("product_id"),
  variantId: integer("variant_id"), movementType: text("movement_type").notNull(),
  quantity: integer("quantity").notNull(), unitCost: integer("unit_cost"),
  reference: text("reference"), note: text("note"), createdBy: text("created_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }), userEmail: text("user_email").notNull(),
  action: text("action").notNull(), entityType: text("entity_type").notNull(),
  entityId: text("entity_id"), detailsJson: text("details_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

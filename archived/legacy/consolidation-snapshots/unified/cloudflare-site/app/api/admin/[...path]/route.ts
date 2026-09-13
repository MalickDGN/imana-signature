import { env } from "cloudflare:workers";

type Context = { params: Promise<{ path: string[] }> };
type Row = Record<string, unknown>;

const resources: Record<string, { table: string; writable: string[] }> = {
  categories: { table: "categories", writable: ["name", "slug", "description", "status", "sort_order"] },
  products: { table: "products", writable: ["category_id", "name", "slug", "sku", "description", "status", "price", "cost_price", "stock", "low_stock_threshold", "image_url", "seo_title", "seo_description"] },
  variants: { table: "variants", writable: ["product_id", "name", "sku", "attributes_json", "price", "cost_price", "stock", "status"] },
  users: { table: "users", writable: ["name", "role", "status"] },
  members: { table: "members", writable: ["email", "full_name", "phone", "status"] },
  orders: { table: "orders", writable: ["customer_email", "amount_total", "currency", "status", "delivery_status", "payment_method"] },
  invoices: { table: "invoices", writable: ["order_id", "invoice_number", "subtotal", "tax_amount", "total", "currency", "status", "due_at", "paid_at"] },
  transactions: { table: "transactions", writable: ["order_id", "provider", "provider_reference", "amount", "currency", "status", "paid_at"] },
  deliveries: { table: "deliveries", writable: ["order_id", "zone_id", "recipient_name", "phone", "address", "tracking_reference", "delivery_fee", "status", "scheduled_at", "delivered_at"] },
  "payment-methods": { table: "payment_methods", writable: ["code", "name", "provider", "payment_timing", "enabled"] },
  "delivery-zones": { table: "delivery_zones", writable: ["name", "code", "fee", "free_from", "estimated_days_min", "estimated_days_max", "payment_timing", "enabled"] },
  campaigns: { table: "campaigns", writable: ["name", "channel", "audience", "subject", "content", "status", "starts_at", "ends_at", "budget"] },
  articles: { table: "articles", writable: ["title", "slug", "excerpt", "content", "status", "seo_title", "seo_description", "published_at"] },
  faqs: { table: "faqs", writable: ["question", "answer", "category", "status", "sort_order"] },
  "social-publications": { table: "social_publications", writable: ["network", "content", "media_url", "status", "scheduled_at", "published_at", "external_id"] },
  "audit-logs": { table: "audit_logs", writable: [] },
};

function emailFrom(request: Request) {
  return request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() || "";
}

async function currentUser(request: Request) {
  const email = emailFrom(request);
  if (!email) return null;
  const existing = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<Row>();
  if (existing) return existing;
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
  const nameHeader = request.headers.get("oai-authenticated-user-full-name");
  const name = nameHeader ? decodeURIComponent(nameHeader) : email.split("@")[0];
  await env.DB.prepare("INSERT INTO users (email, name, role) VALUES (?, ?, ?)")
    .bind(email, name, count?.count ? "manager" : "admin").run();
  return env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<Row>();
}

async function authorize(request: Request) {
  const user = await currentUser(request);
  if (!user || !["admin", "manager"].includes(String(user.role)) || user.status !== "active") return null;
  return user;
}

async function audit(user: Row, action: string, entityType: string, entityId?: string, details: Row = {}) {
  await env.DB.prepare("INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details_json) VALUES (?, ?, ?, ?, ?)")
    .bind(user.email, action, entityType, entityId || null, JSON.stringify(details)).run();
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur serveur";
  return Response.json({ error: message }, { status: message.includes("UNIQUE") ? 409 : 500 });
}

export async function GET(request: Request, context: Context) {
  try {
    const user = await authorize(request);
    if (!user) return Response.json({ error: "Accès interdit." }, { status: 403 });
    const { path } = await context.params;
    const [resource, id] = path;
    if (resource === "me") return Response.json({ user });
    if (resource === "dashboard") {
      const [sales, stock, customers, invoicing, payments, deliveries] = await env.DB.batch([
        env.DB.prepare("SELECT COUNT(*) orders, COALESCE(SUM(CASE WHEN status='paid' THEN amount_total ELSE 0 END),0) revenue, COALESCE(AVG(CASE WHEN status='paid' THEN amount_total END),0) average_order FROM orders"),
        env.DB.prepare("SELECT COUNT(*) products, COALESCE(SUM(stock),0) units, COALESCE(SUM(stock*cost_price),0) cost_value, COALESCE(SUM(stock*price),0) retail_value, COALESCE(SUM(CASE WHEN stock<=low_stock_threshold THEN 1 ELSE 0 END),0) low_stock FROM products"),
        env.DB.prepare("SELECT (SELECT COUNT(*) FROM users) users, (SELECT COUNT(*) FROM members WHERE status='active') members"),
        env.DB.prepare("SELECT COUNT(*) invoices, COALESCE(SUM(CASE WHEN status IN ('issued','overdue') THEN total ELSE 0 END),0) outstanding, COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) collected FROM invoices"),
        env.DB.prepare("SELECT status, COUNT(*) count, COALESCE(SUM(amount),0) amount FROM transactions GROUP BY status"),
        env.DB.prepare("SELECT status, COUNT(*) count FROM deliveries GROUP BY status"),
      ]);
      return Response.json({
        sales: sales.results[0], stock: stock.results[0], customers: customers.results[0],
        invoicing: invoicing.results[0], payments: payments.results, deliveries: deliveries.results,
      });
    }
    if (resource === "seo-analysis") {
      const [articles, products] = await env.DB.batch([
        env.DB.prepare("SELECT id,title,slug,content,seo_title,seo_description,status FROM articles"),
        env.DB.prepare("SELECT id,name,slug,description,seo_title,seo_description,image_url FROM products"),
      ]);
      const score = (item: Row, product = false) => {
        const checks = {
          title: Boolean(item.seo_title && String(item.seo_title).length <= 60),
          description: Boolean(item.seo_description && String(item.seo_description).length <= 160),
          content: String(product ? item.description || "" : item.content || "").length >= (product ? 100 : 300),
          media: product ? Boolean(item.image_url) : /^[a-z0-9-]+$/.test(String(item.slug)),
        };
        return { ...item, checks, score: Math.round(Object.values(checks).filter(Boolean).length * 25) };
      };
      return Response.json({ articles: articles.results.map((x) => score(x)), products: products.results.map((x) => score(x, true)) });
    }
    const config = resources[resource];
    if (!config) return Response.json({ error: "Ressource inconnue." }, { status: 404 });
    if (resource === "audit-logs" && user.role !== "admin") return Response.json({ error: "Rôle administrateur requis." }, { status: 403 });
    if (id) {
      const item = await env.DB.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).bind(Number(id)).first();
      return item ? Response.json({ item }) : Response.json({ error: "Introuvable." }, { status: 404 });
    }
    const result = await env.DB.prepare(`SELECT * FROM ${config.table} ORDER BY id DESC LIMIT 200`).all();
    return Response.json({ items: result.results });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await authorize(request);
    if (!user) return Response.json({ error: "Accès interdit." }, { status: 403 });
    const { path } = await context.params;
    const [resource, id, action] = path;
    if (resource === "stock" && id === "movements") {
      const body = await request.json() as Row;
      const productId = Number(body.product_id);
      const quantity = Number(body.quantity);
      const product = await env.DB.prepare("SELECT stock FROM products WHERE id=?").bind(productId).first<{stock:number}>();
      if (!product) return Response.json({ error: "Produit introuvable." }, { status: 404 });
      if (product.stock + quantity < 0) return Response.json({ error: "Stock insuffisant." }, { status: 409 });
      await env.DB.batch([
        env.DB.prepare("UPDATE products SET stock=stock+?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(quantity, productId),
        env.DB.prepare("INSERT INTO stock_movements (product_id,movement_type,quantity,unit_cost,reference,note,created_by) VALUES (?,?,?,?,?,?,?)")
          .bind(productId, body.movement_type, quantity, body.unit_cost || null, body.reference || null, body.note || null, user.email),
      ]);
      await audit(user, "create", "stock_movements", String(productId), body);
      return Response.json({ stock: product.stock + quantity }, { status: 201 });
    }
    if (resource === "social-publications" && id && action === "publish") {
      await env.DB.prepare("UPDATE social_publications SET status='published',published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(Number(id)).run();
      await audit(user, "publish", resource, id);
      return Response.json({ published: true });
    }
    const config = resources[resource];
    if (!config || !config.writable.length) return Response.json({ error: "Ressource inconnue." }, { status: 404 });
    const body = await request.json() as Row;
    const entries = Object.entries(body).filter(([key, value]) => config.writable.includes(key) && value !== undefined);
    if (!entries.length) return Response.json({ error: "Aucune donnée valide." }, { status: 400 });
    const keys = entries.map(([key]) => key);
    const result = await env.DB.prepare(`INSERT INTO ${config.table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`)
      .bind(...entries.map(([, value]) => value)).run();
    await audit(user, "create", resource, String(result.meta.last_row_id), body);
    const item = await env.DB.prepare(`SELECT * FROM ${config.table} WHERE id=?`).bind(result.meta.last_row_id).first();
    return Response.json({ item }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await authorize(request);
    if (!user) return Response.json({ error: "Accès interdit." }, { status: 403 });
    const { path } = await context.params;
    const [resource, id] = path;
    const config = resources[resource];
    if (!config || !id) return Response.json({ error: "Ressource inconnue." }, { status: 404 });
    if (resource === "users" && user.role !== "admin") return Response.json({ error: "Rôle administrateur requis." }, { status: 403 });
    const body = await request.json() as Row;
    const entries = Object.entries(body).filter(([key, value]) => config.writable.includes(key) && value !== undefined);
    await env.DB.prepare(`UPDATE ${config.table} SET ${entries.map(([key]) => `${key}=?`).join(",")},updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(...entries.map(([, value]) => value), Number(id)).run();
    await audit(user, "update", resource, id, body);
    const item = await env.DB.prepare(`SELECT * FROM ${config.table} WHERE id=?`).bind(Number(id)).first();
    return Response.json({ item });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await authorize(request);
    if (!user || user.role !== "admin") return Response.json({ error: "Rôle administrateur requis." }, { status: 403 });
    const { path } = await context.params;
    const [resource, id] = path;
    const config = resources[resource];
    if (!config || !id || resource === "audit-logs") return Response.json({ error: "Ressource inconnue." }, { status: 404 });
    await env.DB.prepare(`DELETE FROM ${config.table} WHERE id=?`).bind(Number(id)).run();
    await audit(user, "delete", resource, id);
    return new Response(null, { status: 204 });
  } catch (error) { return errorResponse(error); }
}

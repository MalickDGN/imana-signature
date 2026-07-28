import { Router } from "express";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

const roles = ["visitor", "client", "manager", "admin"];
const writeRoles = new Set(["manager", "admin"]);

const text = (min = 1, max = 255) => z.string().trim().min(min).max(max);
const nullableText = (max = 5000) => z.string().trim().max(max).nullable().optional();
const status = z.enum(["draft", "active", "inactive", "archived"]);

const resources = {
  categories: {
    table: "categories",
    searchable: ["name", "slug", "description"],
    schema: z.object({
      name: text(2, 120), slug: text(2, 120), description: nullableText(),
      parent_id: z.number().int().positive().nullable().optional(),
      status: z.enum(["active", "inactive"]).default("active"),
      sort_order: z.number().int().min(0).default(0),
    }),
  },
  products: {
    table: "catalog_products",
    searchable: ["name", "slug", "sku", "description"],
    schema: z.object({
      category_id: z.number().int().positive().nullable().optional(),
      name: text(2, 160), slug: text(2, 160), sku: nullableText(80),
      description: nullableText(10_000), status: status.default("draft"),
      price: z.number().int().min(0), cost_price: z.number().int().min(0).default(0),
      stock: z.number().int().min(0).default(0),
      low_stock_threshold: z.number().int().min(0).default(5),
      image_url: nullableText(500), seo_title: nullableText(70),
      seo_description: nullableText(170),
    }),
  },
  variants: {
    table: "product_variants",
    searchable: ["name", "sku"],
    schema: z.object({
      product_id: z.number().int().positive(), name: text(1, 120), sku: text(1, 80),
      attributes_json: z.record(z.string(), z.string()).default({}).transform(JSON.stringify),
      price: z.number().int().min(0).nullable().optional(),
      cost_price: z.number().int().min(0).nullable().optional(),
      stock: z.number().int().min(0).default(0),
      status: z.enum(["active", "inactive"]).default("active"),
    }),
  },
  "payment-methods": {
    table: "payment_methods",
    searchable: ["code", "name", "provider"],
    schema: z.object({
      code: text(2, 60), name: text(2, 120), provider: text(2, 60),
      payment_timing: z.enum(["order", "delivery"]),
      enabled: z.boolean().default(true).transform(Number),
      configuration_json: z.record(z.string(), z.unknown()).default({}).transform(JSON.stringify),
    }),
  },
  "delivery-zones": {
    table: "delivery_zones",
    searchable: ["name", "code"],
    schema: z.object({
      name: text(2, 120), code: text(2, 60), fee: z.number().int().min(0),
      free_from: z.number().int().min(0).nullable().optional(),
      estimated_days_min: z.number().int().min(0).default(1),
      estimated_days_max: z.number().int().min(0).default(3),
      payment_timing: z.enum(["order", "delivery"]),
      enabled: z.boolean().default(true).transform(Number),
    }).refine((value) => value.estimated_days_max >= value.estimated_days_min, {
      message: "La durée maximale doit être supérieure ou égale à la durée minimale.",
    }),
  },
  campaigns: {
    table: "campaigns",
    searchable: ["name", "channel", "audience", "subject"],
    schema: z.object({
      name: text(2, 160), channel: z.enum(["email", "sms", "whatsapp", "social", "mixed"]),
      status: z.enum(["draft", "scheduled", "active", "paused", "completed"]).default("draft"),
      audience: nullableText(500), subject: nullableText(200), content: nullableText(20_000),
      starts_at: nullableText(40), ends_at: nullableText(40),
      budget: z.number().int().min(0).default(0),
      metrics_json: z.record(z.string(), z.unknown()).default({}).transform(JSON.stringify),
    }),
  },
  articles: {
    table: "articles",
    searchable: ["title", "slug", "excerpt", "content"],
    schema: z.object({
      title: text(2, 200), slug: text(2, 180), excerpt: nullableText(500),
      content: z.string().max(100_000).default(""),
      status: z.enum(["draft", "scheduled", "published", "archived"]).default("draft"),
      seo_title: nullableText(70), seo_description: nullableText(170),
      published_at: nullableText(40),
    }),
  },
  faqs: {
    table: "faqs",
    searchable: ["question", "answer", "category"],
    schema: z.object({
      question: text(3, 500), answer: text(3, 10_000), category: nullableText(120),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
      sort_order: z.number().int().min(0).default(0),
    }),
  },
  "social-publications": {
    table: "social_publications",
    searchable: ["network", "content", "status"],
    schema: z.object({
      network: z.enum(["instagram", "facebook", "tiktok", "linkedin", "x"]),
      content: text(1, 5000), media_url: nullableText(500),
      status: z.enum(["draft", "scheduled"]).default("draft"),
      scheduled_at: nullableText(40),
      campaign_id: z.number().int().positive().nullable().optional(),
    }),
  },
};

function parseJsonFields(row) {
  if (!row) return row;
  const parsed = { ...row };
  for (const [key, value] of Object.entries(parsed)) {
    if (key.endsWith("_json") && typeof value === "string") {
      try { parsed[key.replace(/_json$/, "")] = JSON.parse(value); } catch { parsed[key.replace(/_json$/, "")] = {}; }
      delete parsed[key];
    }
  }
  return parsed;
}

function insert(database, table, data) {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const result = database.prepare(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
  ).run(...keys.map((key) => data[key] ?? null));
  return Number(result.lastInsertRowid);
}

function update(database, table, id, data) {
  const keys = Object.keys(data);
  if (!keys.length) return;
  const hasUpdatedAt = database.prepare(`PRAGMA table_info(${table})`).all()
    .some((column) => column.name === "updated_at");
  database.prepare(
    `UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(", ")}
     ${hasUpdatedAt ? ", updated_at = CURRENT_TIMESTAMP" : ""} WHERE id = ?`,
  ).run(...keys.map((key) => data[key] ?? null), id);
}

export function createAdminRouter({ database, getCurrentUser }) {
  const router = Router();

  router.use((request, response, next) => {
    const user = getCurrentUser(request);
    if (!user) return response.status(401).json({ error: "Authentification requise." });
    if (!writeRoles.has(user.role)) return response.status(403).json({ error: "Accès administration interdit." });
    request.adminUser = user;
    return next();
  });

  const audit = (request, action, entityType, entityId, details = {}) => {
    database.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(request.adminUser.id, action, entityType, String(entityId ?? ""), JSON.stringify(details), request.ip);
  };

  router.get("/me", (request, response) => response.json({ user: request.adminUser }));

  router.get("/dashboard", (_request, response) => {
    const sales = database.prepare(`
      SELECT COUNT(*) AS orders,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_total ELSE 0 END), 0) AS revenue,
        COALESCE(AVG(CASE WHEN status = 'paid' THEN amount_total END), 0) AS average_order
      FROM orders
    `).get();
    const payments = database.prepare(`
      SELECT status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
      FROM payment_transactions GROUP BY status
    `).all();
    const deliveries = database.prepare(`
      SELECT status, COUNT(*) AS count FROM deliveries GROUP BY status
    `).all();
    const stock = database.prepare(`
      SELECT COUNT(*) AS products, COALESCE(SUM(stock), 0) AS units,
        COALESCE(SUM(stock * cost_price), 0) AS cost_value,
        COALESCE(SUM(stock * price), 0) AS retail_value,
        COALESCE(SUM(CASE WHEN stock <= low_stock_threshold THEN 1 ELSE 0 END), 0) AS low_stock
      FROM catalog_products WHERE status != 'archived'
    `).get();
    const customers = database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'client') AS clients,
        (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'active') AS members
    `).get();
    const invoicing = database.prepare(`
      SELECT COUNT(*) AS invoices,
        COALESCE(SUM(CASE WHEN status IN ('issued', 'overdue') THEN total ELSE 0 END), 0) AS outstanding,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS collected
      FROM invoices
    `).get();
    return response.json({ sales, invoicing, payments, deliveries, stock, customers });
  });

  for (const [path, config] of Object.entries(resources)) {
    router.get(`/${path}`, (request, response) => {
      const page = Math.max(1, Number(request.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 25));
      const query = String(request.query.q || "").trim();
      const where = query
        ? `WHERE ${config.searchable.map((column) => `${column} LIKE ?`).join(" OR ")}`
        : "";
      const params = query ? config.searchable.map(() => `%${query}%`) : [];
      const total = database.prepare(`SELECT COUNT(*) AS count FROM ${config.table} ${where}`).get(...params).count;
      const items = database.prepare(
        `SELECT * FROM ${config.table} ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      ).all(...params, limit, (page - 1) * limit).map(parseJsonFields);
      return response.json({ items, pagination: { page, limit, total } });
    });

    router.get(`/${path}/:id`, (request, response) => {
      const item = database.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(request.params.id);
      return item
        ? response.json({ item: parseJsonFields(item) })
        : response.status(404).json({ error: "Ressource introuvable." });
    });

    router.post(`/${path}`, (request, response) => {
      const parsed = config.schema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ error: "Données invalides.", details: parsed.error.issues });
      const data = { ...parsed.data };
      if (["campaigns", "social-publications"].includes(path)) data.created_by = request.adminUser.id;
      if (path === "articles") data.author_id = request.adminUser.id;
      try {
        const id = insert(database, config.table, data);
        audit(request, "create", path, id, data);
        return response.status(201).json({ item: parseJsonFields(database.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(id)) });
      } catch (error) {
        if (String(error.message).includes("UNIQUE constraint")) {
          return response.status(409).json({ error: "Une ressource avec cet identifiant existe déjà." });
        }
        throw error;
      }
    });

    router.patch(`/${path}/:id`, (request, response) => {
      const existing = database.prepare(`SELECT id FROM ${config.table} WHERE id = ?`).get(request.params.id);
      if (!existing) return response.status(404).json({ error: "Ressource introuvable." });
      const parsed = config.schema.partial().safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ error: "Données invalides.", details: parsed.error.issues });
      update(database, config.table, request.params.id, parsed.data);
      audit(request, "update", path, request.params.id, parsed.data);
      return response.json({ item: parseJsonFields(database.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(request.params.id)) });
    });

    router.delete(`/${path}/:id`, (request, response) => {
      if (request.adminUser.role !== "admin") return response.status(403).json({ error: "Rôle administrateur requis." });
      const result = database.prepare(`DELETE FROM ${config.table} WHERE id = ?`).run(request.params.id);
      if (!result.changes) return response.status(404).json({ error: "Ressource introuvable." });
      audit(request, "delete", path, request.params.id);
      return response.status(204).end();
    });
  }

  router.get("/users", (request, response) => {
    const role = roles.includes(request.query.role) ? request.query.role : null;
    const users = role
      ? database.prepare("SELECT id, email, name, phone, role, status, created_at FROM users WHERE role = ? ORDER BY id DESC").all(role)
      : database.prepare("SELECT id, email, name, phone, role, status, created_at FROM users ORDER BY id DESC").all();
    return response.json({ items: users });
  });

  router.post("/users", async (request, response) => {
    if (request.adminUser.role !== "admin") return response.status(403).json({ error: "Rôle administrateur requis." });
    const parsed = z.object({
      email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
      name: text(2, 80), phone: nullableText(30),
      password: z.string().min(12).max(128),
      role: z.enum(roles).default("client"),
      status: z.enum(["active", "suspended"]).default("active"),
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Utilisateur invalide.", details: parsed.error.issues });
    const { password, ...data } = parsed.data;
    try {
      const id = insert(database, "users", { ...data, password_hash: await bcrypt.hash(password, 12) });
      audit(request, "create", "users", id, { ...data, password: "[REDACTED]" });
      return response.status(201).json({
        item: database.prepare("SELECT id, email, name, phone, role, status, created_at FROM users WHERE id = ?").get(id),
      });
    } catch (error) {
      if (String(error.message).includes("UNIQUE constraint failed: users.email")) {
        return response.status(409).json({ error: "Cette adresse e-mail est déjà utilisée." });
      }
      throw error;
    }
  });

  router.patch("/users/:id", (request, response) => {
    if (request.adminUser.role !== "admin") return response.status(403).json({ error: "Rôle administrateur requis." });
    const parsed = z.object({
      name: text(2, 80).optional(), phone: nullableText(30),
      role: z.enum(roles).optional(), status: z.enum(["active", "suspended"]).optional(),
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Données invalides.", details: parsed.error.issues });
    if (Number(request.params.id) === request.adminUser.id && parsed.data.role && parsed.data.role !== "admin") {
      return response.status(400).json({ error: "Vous ne pouvez pas retirer votre propre rôle administrateur." });
    }
    update(database, "users", request.params.id, parsed.data);
    audit(request, "update", "users", request.params.id, parsed.data);
    return response.json({
      item: database.prepare("SELECT id, email, name, phone, role, status, created_at FROM users WHERE id = ?").get(request.params.id),
    });
  });

  router.get("/members", (_request, response) => {
    const items = database.prepare(`
      SELECT email, full_name, phone, status, subscribed_at, updated_at
      FROM newsletter_subscribers ORDER BY subscribed_at DESC
    `).all();
    return response.json({ items });
  });

  router.patch("/members/:email", (request, response) => {
    const parsed = z.object({ status: z.enum(["active", "unsubscribed", "blocked"]) }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Statut invalide." });
    const result = database.prepare(`
      UPDATE newsletter_subscribers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?
    `).run(parsed.data.status, request.params.email);
    if (!result.changes) return response.status(404).json({ error: "Membre introuvable." });
    audit(request, "update", "members", request.params.email, parsed.data);
    return response.json({ updated: true });
  });

  router.get("/orders", (_request, response) => {
    const items = database.prepare(`
      SELECT orders.*, users.name AS customer_name,
        (SELECT status FROM payment_transactions WHERE order_id = orders.id ORDER BY id DESC LIMIT 1) AS transaction_status,
        (SELECT status FROM deliveries WHERE order_id = orders.id ORDER BY id DESC LIMIT 1) AS latest_delivery_status
      FROM orders LEFT JOIN users ON users.id = orders.user_id ORDER BY orders.id DESC
    `).all();
    return response.json({ items });
  });

  router.post("/orders", (request, response) => {
    const parsed = z.object({
      user_id: z.number().int().positive().nullable().optional(),
      email: z.email().max(254).nullable().optional(),
      amount_total: z.number().int().min(0),
      currency: z.string().trim().length(3).default("xof"),
      payment_method: z.string().trim().max(60).nullable().optional(),
      status: z.enum(["draft", "pending", "paid", "cancelled"]).default("pending"),
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Commande invalide.", details: parsed.error.issues });
    const id = insert(database, "orders", {
      stripe_session_id: `manual_${randomUUID()}`,
      ...parsed.data,
    });
    audit(request, "create", "orders", id, parsed.data);
    return response.status(201).json({ item: database.prepare("SELECT * FROM orders WHERE id = ?").get(id) });
  });

  router.patch("/orders/:id", (request, response) => {
    const parsed = z.object({
      status: z.enum(["draft", "creating", "pending", "paid", "cancelled", "refunded"]).optional(),
      delivery_status: z.enum(["pending", "preparing", "shipped", "delivered", "cancelled"]).optional(),
      payment_method: nullableText(60),
      email: z.email().max(254).nullable().optional(),
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Commande invalide.", details: parsed.error.issues });
    const data = { ...parsed.data };
    if (data.status === "paid") data.paid_at = new Date().toISOString();
    update(database, "orders", request.params.id, data);
    audit(request, "update", "orders", request.params.id, data);
    return response.json({ item: database.prepare("SELECT * FROM orders WHERE id = ?").get(request.params.id) });
  });

  router.get("/transactions", (_request, response) => {
    const items = database.prepare(`
      SELECT payment_transactions.*, payment_methods.name AS payment_method_name,
        payment_methods.provider FROM payment_transactions
      LEFT JOIN payment_methods ON payment_methods.id = payment_transactions.payment_method_id
      ORDER BY payment_transactions.id DESC
    `).all().map(parseJsonFields);
    return response.json({ items });
  });

  router.get("/invoices", (_request, response) => {
    const items = database.prepare(`
      SELECT invoices.*, orders.email AS customer_email
      FROM invoices JOIN orders ON orders.id = invoices.order_id
      ORDER BY invoices.id DESC
    `).all();
    return response.json({ items });
  });

  router.post("/invoices", (request, response) => {
    const parsed = z.object({
      order_id: z.number().int().positive(),
      invoice_number: text(2, 80),
      subtotal: z.number().int().min(0), tax_amount: z.number().int().min(0).default(0),
      total: z.number().int().min(0), currency: z.string().trim().length(3).default("xof"),
      status: z.enum(["draft", "issued", "paid", "cancelled", "overdue"]).default("draft"),
      issued_at: nullableText(40), due_at: nullableText(40),
    }).refine((value) => value.total === value.subtotal + value.tax_amount, {
      message: "Le total doit être égal au sous-total augmenté des taxes.",
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Facture invalide.", details: parsed.error.issues });
    try {
      const id = insert(database, "invoices", parsed.data);
      audit(request, "create", "invoices", id, parsed.data);
      return response.status(201).json({ item: database.prepare("SELECT * FROM invoices WHERE id = ?").get(id) });
    } catch (error) {
      if (String(error.message).includes("UNIQUE constraint")) {
        return response.status(409).json({ error: "Cette commande possède déjà une facture ou ce numéro existe." });
      }
      throw error;
    }
  });

  router.patch("/invoices/:id", (request, response) => {
    const parsed = z.object({
      status: z.enum(["draft", "issued", "paid", "cancelled", "overdue"]),
      due_at: nullableText(40),
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Facture invalide." });
    const data = { ...parsed.data };
    if (data.status === "paid") data.paid_at = new Date().toISOString();
    update(database, "invoices", request.params.id, data);
    audit(request, "update", "invoices", request.params.id, data);
    return response.json({ item: database.prepare("SELECT * FROM invoices WHERE id = ?").get(request.params.id) });
  });

  router.patch("/transactions/:id", (request, response) => {
    const parsed = z.object({
      status: z.enum(["pending", "paid", "failed", "refunded", "cancelled"]),
      provider_reference: nullableText(255),
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Transaction invalide." });
    const data = { ...parsed.data };
    if (data.status === "paid") data.paid_at = new Date().toISOString();
    update(database, "payment_transactions", request.params.id, data);
    audit(request, "update", "transactions", request.params.id, data);
    return response.json({ item: parseJsonFields(database.prepare("SELECT * FROM payment_transactions WHERE id = ?").get(request.params.id)) });
  });

  router.get("/deliveries", (_request, response) => {
    const items = database.prepare(`
      SELECT deliveries.*, delivery_zones.name AS zone_name
      FROM deliveries LEFT JOIN delivery_zones ON delivery_zones.id = deliveries.zone_id
      ORDER BY deliveries.id DESC
    `).all();
    return response.json({ items });
  });

  router.post("/deliveries", (request, response) => {
    const parsed = z.object({
      order_id: z.number().int().positive(),
      zone_id: z.number().int().positive().nullable().optional(),
      recipient_name: text(2, 120), phone: text(8, 30), address: text(5, 1000),
      tracking_reference: nullableText(120), delivery_fee: z.number().int().min(0).default(0),
      scheduled_at: nullableText(40),
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Livraison invalide.", details: parsed.error.issues });
    const id = insert(database, "deliveries", parsed.data);
    database.prepare("UPDATE orders SET delivery_status = 'pending' WHERE id = ?").run(parsed.data.order_id);
    audit(request, "create", "deliveries", id, parsed.data);
    return response.status(201).json({ item: database.prepare("SELECT * FROM deliveries WHERE id = ?").get(id) });
  });

  router.patch("/deliveries/:id", (request, response) => {
    const parsed = z.object({
      status: z.enum(["pending", "preparing", "shipped", "delivered", "cancelled"]),
      tracking_reference: nullableText(120), scheduled_at: nullableText(40),
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Livraison invalide." });
    const delivery = database.prepare("SELECT order_id FROM deliveries WHERE id = ?").get(request.params.id);
    if (!delivery) return response.status(404).json({ error: "Livraison introuvable." });
    const data = { ...parsed.data };
    if (data.status === "delivered") data.delivered_at = new Date().toISOString();
    update(database, "deliveries", request.params.id, data);
    if (data.status) database.prepare("UPDATE orders SET delivery_status = ? WHERE id = ?").run(data.status, delivery.order_id);
    audit(request, "update", "deliveries", request.params.id, data);
    return response.json({ item: database.prepare("SELECT * FROM deliveries WHERE id = ?").get(request.params.id) });
  });

  router.post("/stock/movements", (request, response) => {
    const parsed = z.object({
      product_id: z.number().int().positive().nullable().optional(),
      variant_id: z.number().int().positive().nullable().optional(),
      movement_type: z.enum(["purchase", "sale", "return", "adjustment", "damage"]),
      quantity: z.number().int().refine((value) => value !== 0),
      unit_cost: z.number().int().min(0).nullable().optional(),
      reference: nullableText(120), note: nullableText(1000),
    }).refine((value) => Boolean(value.product_id) !== Boolean(value.variant_id), {
      message: "Indiquez soit un produit, soit une variante.",
    }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Mouvement invalide.", details: parsed.error.issues });

    const target = parsed.data.variant_id
      ? { table: "product_variants", id: parsed.data.variant_id }
      : { table: "catalog_products", id: parsed.data.product_id };
    database.exec("BEGIN IMMEDIATE");
    try {
      const row = database.prepare(`SELECT stock FROM ${target.table} WHERE id = ?`).get(target.id);
      if (!row) throw new Error("STOCK_TARGET_NOT_FOUND");
      const nextStock = row.stock + parsed.data.quantity;
      if (nextStock < 0) throw new Error("INSUFFICIENT_STOCK");
      database.prepare(`UPDATE ${target.table} SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(nextStock, target.id);
      const id = insert(database, "stock_movements", { ...parsed.data, created_by: request.adminUser.id });
      database.exec("COMMIT");
      audit(request, "create", "stock_movements", id, parsed.data);
      return response.status(201).json({ id, stock: nextStock });
    } catch (error) {
      database.exec("ROLLBACK");
      if (error.message === "STOCK_TARGET_NOT_FOUND") return response.status(404).json({ error: "Produit ou variante introuvable." });
      if (error.message === "INSUFFICIENT_STOCK") return response.status(409).json({ error: "Stock insuffisant." });
      throw error;
    }
  });

  router.get("/seo-analysis", (_request, response) => {
    const articles = database.prepare(`
      SELECT id, title, slug, content, seo_title, seo_description, status FROM articles
    `).all().map((article) => {
      const checks = {
        title: Boolean(article.seo_title && article.seo_title.length <= 60),
        description: Boolean(article.seo_description && article.seo_description.length >= 120 && article.seo_description.length <= 160),
        content: article.content.length >= 300,
        slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug),
      };
      return { ...article, checks, score: Math.round(Object.values(checks).filter(Boolean).length / 4 * 100) };
    });
    const products = database.prepare(`
      SELECT id, name, slug, seo_title, seo_description, description, image_url FROM catalog_products
    `).all().map((product) => {
      const checks = {
        title: Boolean(product.seo_title && product.seo_title.length <= 60),
        description: Boolean(product.seo_description && product.seo_description.length <= 160),
        content: Boolean(product.description && product.description.length >= 100),
        image: Boolean(product.image_url),
      };
      return { ...product, checks, score: Math.round(Object.values(checks).filter(Boolean).length / 4 * 100) };
    });
    return response.json({ articles, products });
  });

  router.get("/integrations", (_request, response) => response.json({
    integrations: [
      { provider: "stripe", configured: Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("replace_me")) },
      { provider: "wave", configured: Boolean(process.env.WAVE_API_KEY) },
      { provider: "orange_money", configured: Boolean(process.env.ORANGE_MONEY_API_URL && process.env.ORANGE_MONEY_ACCESS_TOKEN) },
      { provider: "social", configured: Boolean(process.env.SOCIAL_PUBLISH_WEBHOOK_URL) },
    ],
  }));

  router.post("/social-publications/:id/publish", async (request, response) => {
    const publication = database.prepare("SELECT * FROM social_publications WHERE id = ?").get(request.params.id);
    if (!publication) return response.status(404).json({ error: "Publication introuvable." });
    if (!process.env.SOCIAL_PUBLISH_WEBHOOK_URL) {
      return response.status(503).json({
        error: "Connecteur réseaux sociaux non configuré.",
        required: "SOCIAL_PUBLISH_WEBHOOK_URL",
      });
    }
    try {
      const providerResponse = await fetch(process.env.SOCIAL_PUBLISH_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.SOCIAL_PUBLISH_WEBHOOK_TOKEN
            ? { Authorization: `Bearer ${process.env.SOCIAL_PUBLISH_WEBHOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          id: publication.id,
          network: publication.network,
          content: publication.content,
          mediaUrl: publication.media_url,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!providerResponse.ok) throw new Error(`HTTP ${providerResponse.status}`);
      const result = await providerResponse.json().catch(() => ({}));
      database.prepare(`
        UPDATE social_publications SET status = 'published', external_id = ?,
          published_at = CURRENT_TIMESTAMP, error_message = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(result.id || result.external_id || null, publication.id);
      audit(request, "publish", "social-publications", publication.id, { network: publication.network });
      return response.json({ published: true, externalId: result.id || result.external_id || null });
    } catch (error) {
      database.prepare(`
        UPDATE social_publications SET status = 'failed', error_message = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(error.message, publication.id);
      return response.status(502).json({ error: "Échec de publication sur le réseau social." });
    }
  });

  router.get("/audit-logs", (request, response) => {
    if (request.adminUser.role !== "admin") return response.status(403).json({ error: "Rôle administrateur requis." });
    return response.json({
      items: database.prepare(`
        SELECT audit_logs.*, users.email AS user_email FROM audit_logs
        LEFT JOIN users ON users.id = audit_logs.user_id ORDER BY audit_logs.id DESC LIMIT 500
      `).all().map(parseJsonFields),
    });
  });

  return router;
}

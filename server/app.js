import "dotenv/config";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Stripe from "stripe";
import { z } from "zod";
import { products } from "../assets/js/data/products.js";
import { createAdminRouter } from "./admin.js";
import { database } from "./database.js";
import { createOrangeMoneyPayment, createWavePayment } from "./payments.js";
import {
  createOpaqueToken, hashToken, normalizeEmail, SESSION_COOKIE,
  SESSION_DURATION_MS, sessionCookieOptions,
} from "./security.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || "127.0.0.1";
const origin = process.env.APP_ORIGIN || `http://127.0.0.1:${port}`;
const stripe = process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes("replace_me")
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const app = express();

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
    },
  },
}));
app.use(cookieParser());

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), (request, response) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return response.status(503).json({ error: "Stripe n’est pas configuré." });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      request.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return response.status(400).json({ error: "Signature Stripe invalide." });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    database.prepare(`
      UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP,
      email = COALESCE(?, email) WHERE stripe_session_id = ?
    `).run(session.customer_details?.email || null, session.id);
    const order = database.prepare("SELECT id, amount_total, currency FROM orders WHERE stripe_session_id = ?").get(session.id);
    const method = database.prepare("SELECT id FROM payment_methods WHERE code = 'stripe'").get();
    if (order && method) {
      database.prepare(`
        INSERT INTO payment_transactions
          (order_id, payment_method_id, provider_reference, amount, currency, status, raw_response_json, paid_at)
        VALUES (?, ?, ?, ?, ?, 'paid', ?, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING
      `).run(order.id, method.id, session.payment_intent || session.id, order.amount_total,
        order.currency, JSON.stringify({ checkout_session_id: session.id }));
    }
  }
  return response.json({ received: true });
});

app.use(express.json({ limit: "32kb" }));
app.use("/api", (request, response, next) => {
  const requestOrigin = request.get("origin");
  if (request.method !== "GET" && requestOrigin && requestOrigin !== origin) {
    return response.status(403).json({ error: "Origine non autorisée." });
  }
  return next();
});
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true }));
app.use("/api/auth", rateLimit({ windowMs: 900_000, limit: 20, standardHeaders: true }));

function getCurrentUser(request) {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) return null;
  return database.prepare(`
    SELECT users.id, users.email, users.name, users.phone, users.role, users.status,
      users.stripe_customer_id
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND julianday(sessions.expires_at) > julianday('now')
      AND users.status = 'active'
  `).get(hashToken(token)) || null;
}

async function ensureBootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL ? normalizeEmail(process.env.ADMIN_EMAIL) : null;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 12) throw new Error("ADMIN_PASSWORD doit contenir au moins 12 caractères.");
  const existing = database.prepare("SELECT id, role FROM users WHERE email = ?").get(email);
  if (existing) {
    if (existing.role !== "admin") database.prepare("UPDATE users SET role = 'admin', status = 'active' WHERE id = ?").run(existing.id);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  database.prepare(`
    INSERT INTO users (email, name, password_hash, role, status)
    VALUES (?, ?, ?, 'admin', 'active')
  `).run(email, process.env.ADMIN_NAME || "Administrateur", passwordHash);
}

await ensureBootstrapAdmin();

function seedInitialCatalog() {
  const count = database.prepare("SELECT COUNT(*) AS count FROM catalog_products").get().count;
  if (count) return;
  const categoryIds = new Map();
  for (const category of [
    { name: "Parfums", slug: "parfums" },
    { name: "Accessoires", slug: "accessoires" },
  ]) {
    const result = database.prepare(`
      INSERT INTO categories (name, slug, status) VALUES (?, ?, 'active')
    `).run(category.name, category.slug);
    categoryIds.set(category.slug, Number(result.lastInsertRowid));
  }
  const statement = database.prepare(`
    INSERT INTO catalog_products
      (id, category_id, name, slug, sku, description, status, price, cost_price,
       stock, low_stock_threshold, image_url, seo_title, seo_description)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 0, ?, 5, ?, ?, ?)
  `);
  for (const product of products) {
    const universe = product.category === "accessoire" ? "accessoires" : "parfums";
    statement.run(
      product.id,
      categoryIds.get(universe),
      product.name,
      product.slug,
      `IMANA-${String(product.id).padStart(4, "0")}`,
      product.description,
      product.price,
      product.stock,
      product.image,
      product.name,
      product.description.slice(0, 160),
    );
  }
}

seedInitialCatalog();
app.use("/api/admin", createAdminRouter({ database, getCurrentUser }));

function createSession(response, userId) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, expiresAt);
  response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
}

const credentialsSchema = z.object({
  email: z.email().max(254).transform(normalizeEmail),
  password: z.string().min(10).max(128),
});

app.post("/api/auth/register", async (request, response) => {
  const parsed = credentialsSchema.extend({
    name: z.string().trim().min(2).max(80),
  }).safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Informations de compte invalides." });
  }
  const { email, password, name } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  let result;
  try {
    result = database.prepare(
      "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
    ).run(email, name, passwordHash);
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint failed: users.email")) {
      return response.status(409).json({ error: "Un compte existe déjà pour cette adresse." });
    }
    throw error;
  }
  createSession(response, Number(result.lastInsertRowid));
  return response.status(201).json({
    user: { id: Number(result.lastInsertRowid), email, name },
  });
});

app.post("/api/auth/login", async (request, response) => {
  const parsed = credentialsSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Identifiants invalides." });
  const user = database.prepare("SELECT * FROM users WHERE email = ?").get(parsed.data.email);
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return response.status(401).json({ error: "E-mail ou mot de passe incorrect." });
  }
  database.prepare("DELETE FROM sessions WHERE julianday(expires_at) <= julianday('now')").run();
  createSession(response, user.id);
  return response.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.get("/api/auth/me", (request, response) => {
  const user = getCurrentUser(request);
  return response.status(user ? 200 : 401).json(
    user ? { user } : { error: "Non connecté." },
  );
});

app.post("/api/auth/logout", (request, response) => {
  const token = request.cookies[SESSION_COOKIE];
  if (token) database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  response.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  return response.status(204).end();
});

app.post("/api/newsletter", (request, response) => {
  const parsed = z.object({
    email: z.email().max(254).transform(normalizeEmail),
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(30).regex(/^[+()\d\s.-]+$/),
  }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Informations d’inscription invalides." });
  database.prepare(`
    INSERT INTO newsletter_subscribers (email, full_name, phone) VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      full_name = excluded.full_name, phone = excluded.phone,
      status = 'active', updated_at = CURRENT_TIMESTAMP
  `).run(parsed.data.email, parsed.data.fullName, parsed.data.phone);
  return response.status(201).json({ message: "Inscription confirmée." });
});

app.get("/api/catalog", (request, response) => {
  const category = String(request.query.category || "").trim();
  const query = String(request.query.q || "").trim();
  const conditions = ["catalog_products.status = 'active'"];
  const params = [];
  if (category) {
    conditions.push("categories.slug = ?");
    params.push(category);
  }
  if (query) {
    conditions.push("(catalog_products.name LIKE ? OR catalog_products.description LIKE ?)");
    params.push(`%${query}%`, `%${query}%`);
  }
  const items = database.prepare(`
    SELECT catalog_products.*, categories.name AS category_name, categories.slug AS category_slug
    FROM catalog_products
    LEFT JOIN categories ON categories.id = catalog_products.category_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY catalog_products.id DESC
  `).all(...params).map((product) => ({
    ...product,
    variants: database.prepare(`
      SELECT id, name, sku, attributes_json, price, cost_price, stock, status
      FROM product_variants WHERE product_id = ? AND status = 'active' ORDER BY id
    `).all(product.id).map((variant) => ({
      ...variant,
      attributes: JSON.parse(variant.attributes_json || "{}"),
      attributes_json: undefined,
    })),
  }));
  return response.json({ items });
});

app.post("/api/checkout", async (request, response) => {
  if (!stripe) {
    return response.status(503).json({
      error: "Paiement non configuré. Ajoutez les clés Stripe dans .env.",
    });
  }
  const parsed = z.object({
    items: z.array(z.object({
      id: z.number().int().positive(),
      quantity: z.number().int().min(1).max(10),
    })).min(1).max(20),
  }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Panier invalide." });

  const user = getCurrentUser(request);
  let orderId = null;
  let stripeSession = null;
  try {
    const lineItems = parsed.data.items.map((item) => {
      const product = database.prepare(`
        SELECT id, name, description, price, stock FROM catalog_products
        WHERE id = ? AND status = 'active'
      `).get(item.id);
      if (!product) throw new Error("Produit inconnu");
      if (product.stock < item.quantity) throw new Error("Stock insuffisant");
      return {
        quantity: item.quantity,
        price_data: {
          currency: "xof",
          unit_amount: product.price,
          product_data: { name: product.name, description: product.description },
        },
      };
    });
    const total = lineItems.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0,
    );
    const pendingReference = `pending_${randomUUID()}`;
    const order = database.prepare(`
      INSERT INTO orders (stripe_session_id, user_id, email, amount_total, currency, status)
      VALUES (?, ?, ?, ?, 'xof', 'creating')
    `).run(pendingReference, user?.id || null, user?.email || null, total);
    orderId = Number(order.lastInsertRowid);

    stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      customer_email: user?.email,
      client_reference_id: user ? String(user.id) : randomUUID(),
      metadata: {
        order_id: String(orderId),
        ...(user ? { user_id: String(user.id) } : {}),
      },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
    });
    database.prepare(`
      UPDATE orders SET stripe_session_id = ?, status = 'pending' WHERE id = ?
    `).run(stripeSession.id, orderId);
    return response.status(201).json({ url: stripeSession.url });
  } catch (error) {
    if (stripeSession?.id) {
      try {
        await stripe.checkout.sessions.expire(stripeSession.id);
      } catch (expirationError) {
        console.error("Stripe session cleanup error:", expirationError.message);
      }
    }
    if (orderId) database.prepare("DELETE FROM orders WHERE id = ? AND status = 'creating'").run(orderId);
    if (["Produit inconnu", "Stock insuffisant"].includes(error.message)) {
      return response.status(400).json({ error: error.message });
    }
    console.error("Stripe checkout error:", error.message);
    return response.status(502).json({ error: "Impossible d’ouvrir le paiement." });
  }
});

app.post("/api/payments/create", async (request, response) => {
  const parsed = z.object({
    checkoutSessionId: z.string().trim().min(10).max(255),
    method: z.enum(["cash", "bank_transfer", "wave", "orange_money"]),
  }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Demande de paiement invalide." });
  const order = database.prepare(`
    SELECT id, user_id, amount_total, currency, status FROM orders WHERE stripe_session_id = ?
  `).get(parsed.data.checkoutSessionId);
  if (!order) return response.status(404).json({ error: "Commande introuvable." });
  const user = getCurrentUser(request);
  if (order.user_id && user?.id !== order.user_id) return response.status(403).json({ error: "Commande non autorisée." });
  if (order.status === "paid") return response.status(409).json({ error: "Cette commande est déjà payée." });

  const method = database.prepare(`
    SELECT id, code, enabled, payment_timing FROM payment_methods WHERE code = ?
  `).get(parsed.data.method);
  if (!method?.enabled) return response.status(409).json({ error: "Ce moyen de paiement est indisponible." });

  const transaction = database.prepare(`
    INSERT INTO payment_transactions (order_id, payment_method_id, amount, currency, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(order.id, method.id, order.amount_total, order.currency);
  const transactionId = Number(transaction.lastInsertRowid);
  try {
    let providerResult = null;
    const successUrl = `${origin}/?payment=success&session_id=${encodeURIComponent(parsed.data.checkoutSessionId)}`;
    if (method.code === "wave") {
      providerResult = await createWavePayment({
        amount: order.amount_total,
        currency: order.currency,
        successUrl,
        errorUrl: `${origin}/?payment=cancelled`,
        reference: String(transactionId),
      });
    } else if (method.code === "orange_money") {
      providerResult = await createOrangeMoneyPayment({
        amount: order.amount_total,
        currency: order.currency,
        successUrl,
        reference: String(transactionId),
      });
    }
    database.prepare(`
      UPDATE payment_transactions SET provider_reference = ?, raw_response_json = ?,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(providerResult?.providerReference || `manual_${transactionId}`,
      JSON.stringify(providerResult?.raw || { payment_timing: method.payment_timing }), transactionId);
    database.prepare("UPDATE orders SET payment_method = ? WHERE id = ?").run(method.code, order.id);
    return response.status(201).json({
      transactionId,
      status: "pending",
      paymentUrl: providerResult?.paymentUrl || null,
      paymentTiming: method.payment_timing,
    });
  } catch (error) {
    database.prepare(`
      UPDATE payment_transactions SET status = 'failed', raw_response_json = ?,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(JSON.stringify({ error: error.message }), transactionId);
    if (["WAVE_NOT_CONFIGURED", "ORANGE_MONEY_NOT_CONFIGURED"].includes(error.message)) {
      return response.status(503).json({ error: "Ce fournisseur de paiement n’est pas configuré." });
    }
    console.error("Alternative payment error:", error.message);
    return response.status(502).json({ error: "Le fournisseur de paiement est indisponible." });
  }
});

app.get("/api/orders/status", (request, response) => {
  const parsed = z.object({
    session_id: z.string().trim().min(10).max(255),
  }).safeParse(request.query);
  if (!parsed.success) return response.status(400).json({ error: "Session de paiement invalide." });

  const order = database.prepare(`
    SELECT id, user_id, status, amount_total, currency, paid_at
    FROM orders WHERE stripe_session_id = ?
  `).get(parsed.data.session_id);
  if (!order) return response.status(404).json({ error: "Commande introuvable." });

  const user = getCurrentUser(request);
  if (order.user_id && user?.id !== order.user_id) {
    return response.status(403).json({ error: "Commande non autorisée." });
  }
  return response.json({
    order: {
      id: order.id,
      status: order.status,
      amountTotal: order.amount_total,
      currency: order.currency,
      paidAt: order.paid_at,
    },
  });
});

app.use("/assets", express.static(resolve(root, "assets"), {
  extensions: ["html"],
  etag: true,
  maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  setHeaders(response, path) {
    if (path.endsWith(".html")) response.setHeader("Cache-Control", "no-cache");
  },
}));
const sendHome = (_request, response) =>
  response.sendFile(resolve(root, "index.html"));
app.get(["/", "/index.html"], sendHome);
app.get(["/admin", "/admin.html"], (_request, response) =>
  response.sendFile(resolve(root, "admin.html")));
app.get("/index-preview.html", (_request, response) => response.redirect(301, "/index.html"));
for (const page of ["la-maison.html", "catalogue.html", "magazine.html"]) {
  app.get(`/${page}`, (_request, response) => response.sendFile(resolve(root, page)));
}
app.use((request, response) => response.status(404).json({ error: "Ressource introuvable." }));

if (process.env.NODE_ENV !== "test") {
  app.listen(port, host, () => {
    console.log(`IMANA SIGNATURE disponible sur ${origin}`);
  });
}

export { app };

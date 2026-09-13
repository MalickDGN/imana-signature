import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import test, { after, before } from "node:test";

const databasePath = resolve(`data/unit-${process.pid}.sqlite`);
process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = databasePath;
process.env.APP_ORIGIN = "http://127.0.0.1";
process.env.ADMIN_EMAIL = `admin-${process.pid}@example.com`;
process.env.ADMIN_PASSWORD = "AdminSecure!2026";
process.env.ADMIN_NAME = "Admin Test";

const { app } = await import("../../server/app.js");
const { database } = await import("../../server/database.js");
const { hashToken } = await import("../../server/security.js");

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolveServer) => {
    const instance = app.listen(0, "127.0.0.1", () => resolveServer(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolveClose, reject) => {
    server.close((error) => error ? reject(error) : resolveClose());
  });
  database.close();
  for (const suffix of ["", "-shm", "-wal"]) {
    const path = `${databasePath}${suffix}`;
    if (existsSync(path)) rmSync(path);
  }
});

function post(path, body, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function adminCookie() {
  const response = await post("/api/auth/login", {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie").split(";")[0];
}

test("retourne 409 pour deux inscriptions concurrentes avec le même e-mail", async () => {
  const credentials = {
    name: "Awa Test",
    email: `race-${process.pid}@example.com`,
    password: "MotDePasse!2026",
  };
  const responses = await Promise.all([
    post("/api/auth/register", credentials),
    post("/api/auth/register", credentials),
  ]);
  assert.deepEqual(responses.map(({ status }) => status).sort(), [201, 409]);
});

test("refuse une session expirée au format ISO", async () => {
  const user = database.prepare(
    "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
  ).run(`expired-${process.pid}@example.com`, "Session Expirée", "unused");
  const token = "expired-session-token";
  database.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashToken(token), Number(user.lastInsertRowid), new Date(Date.now() - 60_000).toISOString());

  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: `imana_session=${token}` },
  });
  assert.equal(response.status, 401);
});

test("protège les mutations API contre une origine tierce", async () => {
  const response = await post("/api/newsletter", {
    fullName: "Awa Test",
    email: `origin-${process.pid}@example.com`,
    phone: "+221 77 123 45 67",
  }, { Origin: "https://example.net" });
  assert.equal(response.status, 403);
});

test("ne confirme que le statut réellement stocké de la commande", async () => {
  database.prepare(`
    INSERT INTO orders (stripe_session_id, amount_total, currency, status)
    VALUES (?, ?, 'xof', ?)
  `).run("cs_test_pending_unit", 59900, "pending");
  database.prepare(`
    INSERT INTO orders (stripe_session_id, amount_total, currency, status, paid_at)
    VALUES (?, ?, 'xof', 'paid', CURRENT_TIMESTAMP)
  `).run("cs_test_paid_unit", 59900);

  const pending = await fetch(`${baseUrl}/api/orders/status?session_id=cs_test_pending_unit`);
  const paid = await fetch(`${baseUrl}/api/orders/status?session_id=cs_test_paid_unit`);
  const unknown = await fetch(`${baseUrl}/api/orders/status?session_id=cs_test_unknown_unit`);

  assert.equal((await pending.json()).order.status, "pending");
  assert.equal((await paid.json()).order.status, "paid");
  assert.equal(unknown.status, 404);
});

test("interdit l’administration aux clients et autorise l’administrateur", async () => {
  const clientLogin = await post("/api/auth/login", {
    email: `race-${process.pid}@example.com`,
    password: "MotDePasse!2026",
  });
  const clientCookie = clientLogin.headers.get("set-cookie").split(";")[0];
  const forbidden = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Cookie: clientCookie },
  });
  assert.equal(forbidden.status, 403);

  const allowed = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Cookie: await adminCookie() },
  });
  assert.equal(allowed.status, 200);
  const dashboard = await allowed.json();
  assert.ok("revenue" in dashboard.sales);
  assert.ok("cost_value" in dashboard.stock);
});

test("gère le catalogue, les variantes et le stock avec audit", async () => {
  const cookie = await adminCookie();
  const categoryResponse = await post("/api/admin/categories", {
    name: "Parfums",
    slug: `parfums-${process.pid}`,
    status: "active",
    sort_order: 1,
  }, { Cookie: cookie });
  assert.equal(categoryResponse.status, 201);
  const category = (await categoryResponse.json()).item;

  const productResponse = await post("/api/admin/products", {
    category_id: category.id,
    name: "Parfum de test",
    slug: `parfum-test-${process.pid}`,
    sku: `TEST-${process.pid}`,
    price: 50000,
    cost_price: 20000,
    stock: 10,
    status: "active",
  }, { Cookie: cookie });
  assert.equal(productResponse.status, 201);
  const product = (await productResponse.json()).item;

  const movement = await post("/api/admin/stock/movements", {
    product_id: product.id,
    movement_type: "sale",
    quantity: -2,
    reference: "UNIT-ORDER",
  }, { Cookie: cookie });
  assert.equal(movement.status, 201);
  assert.equal((await movement.json()).stock, 8);

  const audit = await fetch(`${baseUrl}/api/admin/audit-logs`, { headers: { Cookie: cookie } });
  assert.equal(audit.status, 200);
  assert.ok((await audit.json()).items.length >= 3);
});

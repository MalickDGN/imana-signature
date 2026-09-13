import { existsSync, rmSync } from "node:fs";

export default async function globalSetup() {
  process.env.NODE_ENV = "test";
  process.env.PORT = "8090";
  process.env.APP_ORIGIN = "http://127.0.0.1:8090";
  process.env.DATABASE_PATH = "data/e2e.sqlite";
  process.env.ADMIN_EMAIL = "admin-e2e@example.com";
  process.env.ADMIN_PASSWORD = "AdminSecure!2026";
  process.env.ADMIN_NAME = "Admin E2E";
  for (const suffix of ["", "-shm", "-wal"]) {
    const path = `${process.env.DATABASE_PATH}${suffix}`;
    if (existsSync(path)) rmSync(path);
  }
  const { app } = await import("../../server/app.js");
  const server = await new Promise((resolve) => {
    const instance = app.listen(8090, "127.0.0.1", () => resolve(instance));
  });
  return () => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

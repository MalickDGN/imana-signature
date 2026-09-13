import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("compile le portail et son Worker D1", async () => {
  await access(new URL("../dist/server/index.js", import.meta.url));
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const api = await readFile(new URL("../app/api/admin/[...path]/route.ts", import.meta.url), "utf8");
  assert.match(page, /Vue d’ensemble/);
  assert.match(page, /Analyse SEO/);
  assert.match(page, /Stock réel/);
  assert.match(api, /oai-authenticated-user-email/);
  assert.match(api, /env\.DB/);
});

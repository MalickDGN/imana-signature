import assert from "node:assert/strict";
import test from "node:test";
import {
  createOpaqueToken, hashToken, normalizeEmail, sessionCookieOptions,
} from "../../server/security.js";

test("normalise les adresses e-mail", () => {
  assert.equal(normalizeEmail("  CLIENT@EXAMPLE.COM "), "client@example.com");
});

test("génère des jetons opaques et ne stocke que leur empreinte", () => {
  const first = createOpaqueToken();
  const second = createOpaqueToken();
  assert.notEqual(first, second);
  assert.equal(hashToken(first).length, 64);
  assert.notEqual(hashToken(first), first);
});

test("configure un cookie de session protégé", () => {
  const options = sessionCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "strict");
});

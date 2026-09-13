import { describe, expect, it } from 'vitest';
import { hashPassword, LoginRateLimiter, verifyPassword } from './admin-auth.service';
import { hasAnyRole } from './roles';

describe('admin auth helpers', () => {
  it('verifies a scrypt password hash', async () => {
    const stored = await hashPassword('une-phrase-secrete');
    await expect(verifyPassword('une-phrase-secrete', stored)).resolves.toBe(
      true,
    );
    await expect(verifyPassword('autre-secret-xx', stored)).resolves.toBe(
      false,
    );
  });

  it('rejects malformed password hashes', async () => {
    await expect(verifyPassword('secret-password', 'plain')).resolves.toBe(
      false,
    );
  });

  it('grants access when a required role is present', () => {
    expect(hasAnyRole(['CMS_EDITOR', 'ETL_VIEWER'], ['ADMIN', 'CMS_EDITOR'])).toBe(
      true,
    );
    expect(hasAnyRole(['ETL_VIEWER'], ['ADMIN', 'CMS_PUBLISHER'])).toBe(false);
  });

  it('temporarily blocks a login key after five failures', () => {
    const limiter = new LoginRateLimiter();
    for (let attempt = 0; attempt < 5; attempt += 1) limiter.recordFailure('ip:account', 1_000);
    expect(() => limiter.assertAllowed('ip:account', 1_001)).toThrow(/Trop de tentatives/);
    expect(() => limiter.assertAllowed('other-ip:account', 1_001)).not.toThrow();
    expect(() => limiter.assertAllowed('ip:account', 1_000 + 15 * 60 * 1000)).not.toThrow();
  });
});

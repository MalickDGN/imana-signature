import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnApplicationBootstrap,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { ADMIN_ROLES, AdminRole } from './roles';

const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: AdminRole[];
}

@Injectable()
export class AdminAuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminAuthService.name);
  private readonly loginLimiter = new LoginRateLimiter();

  constructor(
    private readonly db: PortalDatabaseService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    // Runs after every module's onModuleInit() has settled, so
    // PortalDatabaseService.isAvailable() is guaranteed to be final here —
    // unlike onModuleInit(), Nest does not guarantee this module initializes
    // after PortalDatabaseModule even though it is @Global().
    if (!this.db.isAvailable()) return;
    await this.seedBootstrapAdmin();
  }

  assertImportToken(token?: string): void {
    const expected = this.config.get<string>('ADMIN_IMPORT_TOKEN');
    if (!expected || !token) throw new UnauthorizedException();
    const left = Buffer.from(expected);
    const right = Buffer.from(token);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      throw new UnauthorizedException();
    }
  }

  async login(email: string, password: string, clientAddress = 'unknown'): Promise<{ token: string; user: AdminUser }> {
    this.ensureDatabase();
    const loginKey = `${clientAddress}:${email.trim().toLowerCase()}`;
    this.loginLimiter.assertAllowed(loginKey);
    const result = await this.db.query<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      roles: string[];
    }>(
      `SELECT id, email, name, password_hash, roles
       FROM ${this.db.table('portal_users')}
       WHERE lower(email) = lower($1) AND active = true`,
      [email.trim()],
    );
    const row = result.rows[0];
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      const retryAfter = this.loginLimiter.recordFailure(loginKey);
      this.logger.warn(`Échec de connexion admin (${hashToken(loginKey).slice(0, 12)}), reprise dans ${retryAfter}s.`);
      throw new UnauthorizedException('Identifiants invalides.');
    }
    this.loginLimiter.clear(loginKey);
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + SESSION_TTL_MS);
    await this.db.query(
      `INSERT INTO ${this.db.table('portal_sessions')}
        (id, user_id, token_hash, expires_at)
       VALUES ($1,$2,$3,$4)`,
      [randomBytes(16).toString('hex'), row.id, hashToken(token), expires.toISOString()],
    );
    return { token, user: mapUser(row) };
  }

  async logout(token?: string): Promise<{ closed: boolean }> {
    if (!token || !this.db.isAvailable()) return { closed: false };
    await this.db.query(
      `DELETE FROM ${this.db.table('portal_sessions')} WHERE token_hash = $1`,
      [hashToken(token)],
    );
    return { closed: true };
  }

  async resolveSession(token?: string): Promise<AdminUser> {
    this.ensureDatabase();
    if (!token) throw new UnauthorizedException();
    const result = await this.db.query<{
      id: string;
      email: string;
      name: string;
      roles: string[];
    }>(
      `SELECT u.id, u.email, u.name, u.roles
       FROM ${this.db.table('portal_sessions')} s
       JOIN ${this.db.table('portal_users')} u ON u.id = s.user_id
       WHERE s.token_hash = $1
         AND s.expires_at > now()
         AND u.active = true`,
      [hashToken(token)],
    );
    const row = result.rows[0];
    if (!row) throw new UnauthorizedException();
    return mapUser(row);
  }

  private ensureDatabase() {
    if (!this.db.isAvailable()) {
      throw new ServiceUnavailableException(
        'Le service d’authentification est indisponible.',
      );
    }
  }

  private async seedBootstrapAdmin() {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    const name = this.config.get<string>('ADMIN_NAME') ?? 'Administrateur';
    if (!email || !password) {
      this.logger.warn('ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun compte bootstrap.');
      return;
    }
    if (password.length < 12) {
      this.logger.warn('ADMIN_PASSWORD trop court : bootstrap ignoré.');
      return;
    }
    const existing = await this.db.query<{ id: string }>(
      `SELECT id FROM ${this.db.table('portal_users')} WHERE lower(email) = lower($1)`,
      [email],
    );
    if (existing.rowCount) {
      await this.db.query(
        `UPDATE ${this.db.table('portal_users')}
         SET roles = $2, active = true
         WHERE id = $1`,
        [existing.rows[0].id, [...ADMIN_ROLES]],
      );
      return;
    }
    const hash = await hashPassword(password);
    await this.db.query(
      `INSERT INTO ${this.db.table('portal_users')}
        (id, email, name, password_hash, roles, active)
       VALUES ($1,$2,$3,$4,$5,true)`,
      [randomBytes(16).toString('hex'), email.toLowerCase(), name, hash, [...ADMIN_ROLES]],
    );
    this.logger.log(`Compte administrateur bootstrap créé pour ${email}.`);
  }
}

interface LoginAttempt {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
}

export class LoginRateLimiter {
  private readonly attempts = new Map<string, LoginAttempt>();

  assertAllowed(key: string, now = Date.now()): void {
    const attempt = this.attempts.get(key);
    if (!attempt) return;
    if (attempt.blockedUntil > now) {
      const retryAfter = Math.ceil((attempt.blockedUntil - now) / 1000);
      throw new HttpException(
        { statusCode: 429, message: 'Trop de tentatives. Réessayez plus tard.', retryAfter },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (now - attempt.windowStartedAt >= LOGIN_WINDOW_MS) this.attempts.delete(key);
  }

  recordFailure(key: string, now = Date.now()): number {
    const previous = this.attempts.get(key);
    const attempt = !previous || now - previous.windowStartedAt >= LOGIN_WINDOW_MS
      ? { failures: 0, windowStartedAt: now, blockedUntil: 0 }
      : previous;
    attempt.failures += 1;
    if (attempt.failures >= MAX_LOGIN_FAILURES) {
      const multiplier = 2 ** Math.min(attempt.failures - MAX_LOGIN_FAILURES, 5);
      attempt.blockedUntil = now + LOGIN_WINDOW_MS * multiplier;
    }
    this.attempts.set(key, attempt);
    return Math.max(0, Math.ceil((attempt.blockedUntil - now) / 1000));
  }

  clear(key: string): void {
    this.attempts.delete(key);
  }
}

function mapUser(row: {
  id: string;
  email: string;
  name: string;
  roles: string[];
}): AdminUser {
  const roles = (row.roles ?? []).filter((role): role is AdminRole =>
    (ADMIN_ROLES as readonly string[]).includes(role),
  );
  return { id: row.id, email: row.email, name: row.name, roles };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 32)) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const derived = (await scrypt(password, Buffer.from(saltHex, 'hex'), 32)) as Buffer;
  const expected = Buffer.from(hashHex, 'hex');
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { hashPassword } from '../admin-auth/admin-auth.service';
import { AdminRole } from '../admin-auth/roles';
import { CreateAdminUserDto, UpdateAdminUserDto } from './admin-users.dto';

export interface AdminUserView {
  id: string;
  email: string;
  name: string;
  roles: AdminRole[];
  active: boolean;
  created_at: string;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly db: PortalDatabaseService) {}

  async list(): Promise<AdminUserView[]> {
    const result = await this.db.query<AdminUserView>(
      `SELECT id, email, name, roles, active, created_at
       FROM ${this.db.table('portal_users')}
       ORDER BY created_at ASC`,
    );
    return result.rows;
  }

  async create(dto: CreateAdminUserDto): Promise<AdminUserView> {
    const existing = await this.db.query(
      `SELECT id FROM ${this.db.table('portal_users')} WHERE lower(email) = lower($1)`,
      [dto.email],
    );
    if (existing.rowCount) {
      throw new BadRequestException('Un compte existe déjà avec cette adresse e-mail.');
    }
    const id = randomBytes(16).toString('hex');
    const hash = await hashPassword(dto.password);
    const result = await this.db.query<AdminUserView>(
      `INSERT INTO ${this.db.table('portal_users')}
        (id, email, name, password_hash, roles, active)
       VALUES ($1,$2,$3,$4,$5,true)
       RETURNING id, email, name, roles, active, created_at`,
      [id, dto.email.toLowerCase().trim(), dto.name.trim(), hash, dto.roles],
    );
    return result.rows[0];
  }

  async update(
    id: string,
    dto: UpdateAdminUserDto,
    actorId: string,
  ): Promise<AdminUserView> {
    if (dto.active === false && id === actorId) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
    }
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };
    if (dto.name !== undefined) add('name', dto.name.trim());
    if (dto.roles !== undefined) add('roles', dto.roles);
    if (dto.active !== undefined) add('active', dto.active);
    if (dto.password !== undefined) add('password_hash', await hashPassword(dto.password));
    if (fields.length === 0) {
      throw new BadRequestException('Aucune modification fournie.');
    }
    values.push(id);
    const result = await this.db.query<AdminUserView>(
      `UPDATE ${this.db.table('portal_users')}
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, email, name, roles, active, created_at`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException('Compte introuvable.');
    return result.rows[0];
  }
}

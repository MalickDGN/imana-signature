import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import {
  CreateSocialPublicationDto,
  UpdateSocialPublicationDto,
} from './social-publications.dto';

@Injectable()
export class SocialPublicationsService {
  constructor(
    private readonly db: PortalDatabaseService,
    private readonly config: ConfigService,
  ) {}

  async list() {
    const result = await this.db.query(
      `SELECT * FROM ${this.db.table('social_publications')} ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  async create(dto: CreateSocialPublicationDto) {
    const result = await this.db.query(
      `INSERT INTO ${this.db.table('social_publications')}
        (id, title, body, platform, status, scheduled_at, media_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        randomUUID(),
        dto.title.trim(),
        dto.body,
        dto.platform,
        dto.status,
        dto.scheduledAt ?? null,
        dto.mediaId ?? null,
      ],
    );
    return result.rows[0];
  }

  async update(id: string, dto: UpdateSocialPublicationDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };
    if (dto.title !== undefined) add('title', dto.title.trim());
    if (dto.body !== undefined) add('body', dto.body);
    if (dto.platform !== undefined) add('platform', dto.platform);
    if (dto.status !== undefined) add('status', dto.status);
    if (dto.scheduledAt !== undefined) add('scheduled_at', dto.scheduledAt || null);
    if (dto.mediaId !== undefined) add('media_id', dto.mediaId || null);
    if (fields.length === 0) throw new BadRequestException('Aucune modification fournie.');
    add('updated_at', new Date());
    values.push(id);
    const result = await this.db.query(
      `UPDATE ${this.db.table('social_publications')}
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException('Publication introuvable.');
    return result.rows[0];
  }

  async delete(id: string) {
    const result = await this.db.query(
      `DELETE FROM ${this.db.table('social_publications')} WHERE id = $1`,
      [id],
    );
    if (result.rowCount === 0) throw new NotFoundException('Publication introuvable.');
    return { deleted: true };
  }

  async publish(id: string) {
    const webhookUrl = this.config.get<string>('SOCIAL_PUBLISH_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new ServiceUnavailableException('La publication sociale automatique n’est pas configurée.');
    }
    const result = await this.db.query<{
      id: string;
      title: string;
      body: string;
      platform: string;
    }>(
      `SELECT id, title, body, platform FROM ${this.db.table('social_publications')} WHERE id = $1`,
      [id],
    );
    const publication = result.rows[0];
    if (!publication) throw new NotFoundException('Publication introuvable.');

    const webhookToken = this.config.get<string>('SOCIAL_PUBLISH_WEBHOOK_TOKEN');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
      },
      body: JSON.stringify(publication),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);

    if (!response?.ok) {
      await this.db.query(
        `UPDATE ${this.db.table('social_publications')}
         SET status = 'failed', updated_at = now() WHERE id = $1`,
        [id],
      );
      throw new ServiceUnavailableException('Le connecteur de publication a refusé la demande.');
    }

    const updated = await this.db.query(
      `UPDATE ${this.db.table('social_publications')}
       SET status = 'published', published_at = now(), updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return updated.rows[0];
  }
}

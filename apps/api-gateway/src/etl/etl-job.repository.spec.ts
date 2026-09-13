import { describe, expect, it, vi } from 'vitest';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { EtlJobRepository } from './etl-job.repository';

describe('EtlJobRepository', () => {
  it('records the authenticated actor in event details', async () => {
    const db = {
      isAvailable: () => true,
      table: (name: string) => `portal.${name}`,
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    const repository = new EtlJobRepository(db as unknown as PortalDatabaseService);
    await repository.save(
      'catalog',
      { id: 'job-1', fileName: 'catalogue.csv', status: 'dry_run', expiresAt: new Date('2030-01-01') },
      'DRY_RUN_EXECUTED',
      { id: 'user-1', email: 'admin@example.com' },
    );

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[1][1]).toEqual([
      'job-1',
      'DRY_RUN_EXECUTED',
      { status: 'dry_run', actor: { id: 'user-1', email: 'admin@example.com' } },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { canAccessModule } from './access';

describe('admin module visibility', () => {
  it('allows an administrator to open every module', () => {
    expect(['operations', 'analytics', 'etl', 'cms'].every((module) => canAccessModule(['ADMIN'], module as never))).toBe(true);
  });

  it('keeps an ETL viewer outside CMS and operations', () => {
    expect(canAccessModule(['ETL_VIEWER'], 'etl')).toBe(true);
    expect(canAccessModule(['ETL_VIEWER'], 'cms')).toBe(false);
    expect(canAccessModule(['ETL_VIEWER'], 'operations')).toBe(false);
  });

  it('shows CMS to editors without exposing ETL', () => {
    expect(canAccessModule(['CMS_EDITOR'], 'cms')).toBe(true);
    expect(canAccessModule(['CMS_EDITOR'], 'etl')).toBe(false);
  });
});

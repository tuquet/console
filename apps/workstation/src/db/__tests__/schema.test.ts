import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
  assets,
  browserProfiles,
  browserProfilesRelations,
  devices,
  executionLogs,
  jobs,
  jobsRelations,
  proxies,
  systemSettings,
  workflows,
  workflowsRelations,
} from '../schema';

describe('drizzle sqlite schema contract', () => {
  it('defines all canonical local-first tables', () => {
    expect(workflows).toBeDefined();
    expect(browserProfiles).toBeDefined();
    expect(proxies).toBeDefined();
    expect(devices).toBeDefined();
    expect(jobs).toBeDefined();
    expect(executionLogs).toBeDefined();
    expect(systemSettings).toBeDefined();
    expect(assets).toBeDefined();
  });

  it('declares correct column definitions on workflows', () => {
    const cols = getTableColumns(workflows);
    expect(cols.id).toBeDefined();
    expect(cols.name).toBeDefined();
    expect(cols.description).toBeDefined();
    expect(cols.version).toBeDefined();
    expect(cols.nodes).toBeDefined();
    expect(cols.edges).toBeDefined();
    expect(cols.settings).toBeDefined();
    expect(cols.isActive).toBeDefined();
    expect(cols.tenantId).toBeDefined();
    expect(cols.deletedAt).toBeDefined();
    expect(cols.lastSyncedAt).toBeDefined();
    expect(cols.createdAt).toBeDefined();
    expect(cols.updatedAt).toBeDefined();
  });

  it('declares correct column definitions on browser_profiles', () => {
    const cols = getTableColumns(browserProfiles);
    expect(cols.id).toBeDefined();
    expect(cols.name).toBeDefined();
    expect(cols.releaseId).toBeDefined();
    expect(cols.templateId).toBeDefined();
    expect(cols.proxyId).toBeDefined();
    expect(cols.fingerprint).toBeDefined();
    expect(cols.cookies).toBeDefined();
    expect(cols.storageState).toBeDefined();
    expect(cols.isLocked).toBeDefined();
    expect(cols.tenantId).toBeDefined();
    expect(cols.deletedAt).toBeDefined();
    expect(cols.lastSyncedAt).toBeDefined();
  });

  it('declares correct column definitions on jobs and logs', () => {
    const jobCols = getTableColumns(jobs);
    expect(jobCols.id).toBeDefined();
    expect(jobCols.workflowId).toBeDefined();
    expect(jobCols.profileId).toBeDefined();
    expect(jobCols.deviceId).toBeDefined();
    expect(jobCols.status).toBeDefined();

    const logCols = getTableColumns(executionLogs);
    expect(logCols.id).toBeDefined();
    expect(logCols.jobId).toBeDefined();
    expect(logCols.level).toBeDefined();
    expect(logCols.message).toBeDefined();
  });

  it('declares relational connections between entities', () => {
    expect(workflowsRelations).toBeDefined();
    expect(browserProfilesRelations).toBeDefined();
    expect(jobsRelations).toBeDefined();
  });
});

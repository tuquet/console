import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildAutomationFilterQuery,
  calculateProgressPercentage,
  cancelCampaignRunApi,
  getCampaignRunDetailApi,
  getCampaignRunsApi,
  getExecutionLogsApi,
  getWorkflowsApi,
  isRunActive,
} from '../automation';
import { supabaseRequest } from '../supabase-client';

vi.mock('../supabase-client', () => ({
  supabaseRequest: vi.fn(),
}));

describe('automation core api & helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isRunActive', () => {
    it('should return true for active campaign states', () => {
      expect(isRunActive('pending')).toBe(true);
      expect(isRunActive('queued')).toBe(true);
      expect(isRunActive('running')).toBe(true);
    });

    it('should return false for terminal or paused states', () => {
      expect(isRunActive('completed')).toBe(false);
      expect(isRunActive('failed')).toBe(false);
      expect(isRunActive('cancelled')).toBe(false);
      expect(isRunActive('paused')).toBe(false);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('should safely return 0 when total is 0 or negative', () => {
      expect(calculateProgressPercentage(0, 0)).toBe(0);
      expect(calculateProgressPercentage(5, -1)).toBe(0);
    });

    it('should return rounded percentage for normal task values', () => {
      expect(calculateProgressPercentage(25, 100)).toBe(25);
      expect(calculateProgressPercentage(1, 3)).toBe(33);
      expect(calculateProgressPercentage(2, 3)).toBe(67);
    });

    it('should cap at 100% if completed exceeds total', () => {
      expect(calculateProgressPercentage(150, 100)).toBe(100);
    });
  });

  describe('buildAutomationFilterQuery', () => {
    it('should return base query when no filters are provided', () => {
      const query = buildAutomationFilterQuery('/rest/v1/workflows?select=*');
      expect(query).toBe('/rest/v1/workflows?select=*');
    });

    it('should append tenantId, status, and workflowId correctly', () => {
      const query = buildAutomationFilterQuery(
        '/rest/v1/campaign_runs?select=*',
        {
          status: 'running',
          tenantId: 'tenant-123',
          workflowId: 'wf-456',
        },
      );
      expect(query).toBe(
        '/rest/v1/campaign_runs?select=*&tenant_id=eq.tenant-123&status=eq.running&workflow_id=eq.wf-456',
      );
    });

    it('should ignore filters set to all', () => {
      const query = buildAutomationFilterQuery('/rest/v1/workflows?select=*', {
        status: 'all',
        tenantId: 'tenant-123',
        workflowId: 'all',
      });
      expect(query).toBe('/rest/v1/workflows?select=*&tenant_id=eq.tenant-123');
    });
  });

  describe('api functions with automa schema header', () => {
    it('should call getWorkflowsApi with schema automa', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          created_at: '2026-10-13T00:00:00Z',
          description: 'Test WF',
          id: 'wf-1',
          name: 'Scraper Workflow',
          status: 'published',
          tenant_id: 't1',
          updated_at: '2026-10-13T00:00:00Z',
          version: '1.0.0',
        },
      ]);

      const result = await getWorkflowsApi({ tenantId: 't1' });

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/workflows?select='),
        { schema: 'automa' },
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Scraper Workflow');
    });

    it('should call getCampaignRunsApi with schema automa', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          completed_tasks: 10,
          created_at: '2026-10-13T00:00:00Z',
          ended_at: null,
          error_message: null,
          failed_tasks: 0,
          id: 'run-1',
          name: 'Morning Batch Run',
          runner_id: 'runner-1',
          started_at: '2026-10-13T00:01:00Z',
          status: 'running',
          tenant_id: 't1',
          total_tasks: 50,
          workflow_id: 'wf-1',
        },
      ]);

      const runs = await getCampaignRunsApi({ status: 'running' });

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/campaign_runs?select='),
        { schema: 'automa' },
      );
      expect(runs).toHaveLength(1);
      expect(runs[0]?.name).toBe('Morning Batch Run');
    });

    it('should call getCampaignRunDetailApi and return single run', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          completed_tasks: 50,
          created_at: '2026-10-13T00:00:00Z',
          ended_at: '2026-10-13T00:05:00Z',
          error_message: null,
          failed_tasks: 0,
          id: 'run-99',
          name: 'Done Run',
          runner_id: 'runner-1',
          started_at: '2026-10-13T00:01:00Z',
          status: 'completed',
          tenant_id: 't1',
          total_tasks: 50,
          workflow_id: 'wf-1',
        },
      ]);

      const run = await getCampaignRunDetailApi('run-99');

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/campaign_runs?id=eq.run-99'),
        { schema: 'automa' },
      );
      expect(run?.id).toBe('run-99');
    });

    it('should call getExecutionLogsApi with sinceId pagination', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce([
        {
          campaign_run_id: 'run-1',
          id: 15,
          level: 'info',
          logged_at: '2026-10-13T00:02:00Z',
          message: 'Task executed',
          node_id: 'n1',
          payload: {},
          step_name: 'click_button',
          tenant_id: 't1',
        },
      ]);

      const logs = await getExecutionLogsApi('run-1', {
        limit: 100,
        sinceId: 10,
      });

      expect(supabaseRequest).toHaveBeenCalledWith(
        expect.stringContaining('&id=gt.10'),
        { schema: 'automa' },
      );
      expect(logs).toHaveLength(1);
      expect(logs[0]?.id).toBe(15);
    });

    it('should call cancelCampaignRunApi with PATCH method and cancelled status', async () => {
      vi.mocked(supabaseRequest).mockResolvedValueOnce(undefined);

      await cancelCampaignRunApi('run-active-1');

      expect(supabaseRequest).toHaveBeenCalledWith(
        '/rest/v1/campaign_runs?id=eq.run-active-1',
        expect.objectContaining({
          body: expect.stringContaining('"status":"cancelled"'),
          method: 'PATCH',
          schema: 'automa',
        }),
      );
    });
  });
});

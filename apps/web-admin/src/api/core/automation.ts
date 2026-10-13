import { supabaseRequest } from './supabase-client';

export type WorkflowStatus = 'archived' | 'draft' | 'published';

export type CampaignStatus =
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'pending'
  | 'queued'
  | 'running';

export type LogLevel = 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';

export interface AutomaWorkflowItem {
  created_at: string;
  description: null | string;
  id: string;
  name: string;
  status: WorkflowStatus;
  tenant_id: string;
  updated_at: string;
  version: string;
}

export interface AutomaCampaignRunItem {
  completed_tasks: number;
  created_at: string;
  ended_at: null | string;
  error_message: null | string;
  failed_tasks: number;
  id: string;
  name: string;
  parameters?: Record<string, any>;
  result_summary?: Record<string, any>;
  runner?: null | {
    id?: string;
    name: string;
  };
  runner_id: null | string;
  started_at: null | string;
  status: CampaignStatus;
  tenant_id: string;
  total_tasks: number;
  workflow?: null | {
    id?: string;
    name: string;
  };
  workflow_id: null | string;
}

export interface AutomaExecutionLogItem {
  campaign_run_id: string;
  id: number;
  level: LogLevel;
  logged_at: string;
  message: string;
  node_id: null | string;
  payload: Record<string, any>;
  step_name: null | string;
  tenant_id: string;
}

/**
 * Pure function: Kiểm tra xem phiên chạy có đang trong trạng thái cần live polling hay không
 */
export function isRunActive(status: CampaignStatus): boolean {
  return status === 'pending' || status === 'queued' || status === 'running';
}

/**
 * Pure function: Tính toán phần trăm tiến độ của một campaign run
 */
export function calculateProgressPercentage(
  completed: number,
  total: number,
): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

/**
 * Pure helper: Xây dựng query string lọc quy trình hoặc phiên chạy
 */
export function buildAutomationFilterQuery(
  baseQuery: string,
  params?: { status?: string; tenantId?: string; workflowId?: string },
): string {
  const queryParts: string[] = [];

  if (params?.tenantId) {
    queryParts.push(`tenant_id=eq.${encodeURIComponent(params.tenantId)}`);
  }

  if (params?.status && params.status !== 'all') {
    queryParts.push(`status=eq.${encodeURIComponent(params.status)}`);
  }

  if (params?.workflowId && params.workflowId !== 'all') {
    queryParts.push(`workflow_id=eq.${encodeURIComponent(params.workflowId)}`);
  }

  if (queryParts.length === 0) {
    return baseQuery;
  }

  const delimiter = baseQuery.includes('?') ? '&' : '?';
  return `${baseQuery}${delimiter}${queryParts.join('&')}`;
}

/**
 * Lấy danh sách quy trình tự động từ schema automa.workflows
 */
export async function getWorkflowsApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<AutomaWorkflowItem[]> {
  try {
    const query = buildAutomationFilterQuery(
      '/rest/v1/workflows?select=id,tenant_id,name,description,version,status,created_at,updated_at&order=created_at.desc',
      params,
    );
    const data = await supabaseRequest<AutomaWorkflowItem[]>(query, {
      schema: 'automa',
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Automa] Failed to load workflows:', error);
    return [];
  }
}

/**
 * Lấy danh sách các phiên chạy chiến dịch từ schema automa.campaign_runs
 */
export async function getCampaignRunsApi(params?: {
  status?: string;
  tenantId?: string;
  workflowId?: string;
}): Promise<AutomaCampaignRunItem[]> {
  try {
    const query = buildAutomationFilterQuery(
      '/rest/v1/campaign_runs?select=id,tenant_id,workflow_id,runner_id,name,status,total_tasks,completed_tasks,failed_tasks,started_at,ended_at,created_at,error_message,workflow:workflow_id(name),runner:runner_id(name)&order=created_at.desc',
      params,
    );
    const data = await supabaseRequest<AutomaCampaignRunItem[]>(query, {
      schema: 'automa',
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Automa] Failed to load campaign runs:', error);
    return [];
  }
}

/**
 * Lấy chi tiết của một phiên chạy chiến dịch cụ thể
 */
export async function getCampaignRunDetailApi(
  runId: string,
): Promise<AutomaCampaignRunItem | null> {
  try {
    const query = `/rest/v1/campaign_runs?id=eq.${encodeURIComponent(runId)}&select=id,tenant_id,workflow_id,runner_id,name,status,total_tasks,completed_tasks,failed_tasks,started_at,ended_at,created_at,error_message,result_summary,parameters,workflow:workflow_id(name),runner:runner_id(name)`;
    const data = await supabaseRequest<AutomaCampaignRunItem[]>(query, {
      schema: 'automa',
    });
    return Array.isArray(data) && data.length > 0 ? (data[0] ?? null) : null;
  } catch (error) {
    console.error('[Automa] Failed to load campaign run detail:', error);
    return null;
  }
}

/**
 * Lấy nhật ký thực thi của một phiên chạy từ schema automa.execution_logs
 */
export async function getExecutionLogsApi(
  runId: string,
  params?: { limit?: number; sinceId?: number },
): Promise<AutomaExecutionLogItem[]> {
  try {
    let query = `/rest/v1/execution_logs?campaign_run_id=eq.${encodeURIComponent(runId)}`;
    if (params?.sinceId) {
      query += `&id=gt.${params.sinceId}`;
    }
    const limit = params?.limit ?? 200;
    query += `&order=id.asc&limit=${limit}`;

    const data = await supabaseRequest<AutomaExecutionLogItem[]>(query, {
      schema: 'automa',
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[Automa] Failed to load execution logs:', error);
    return [];
  }
}

/**
 * Hủy một phiên chạy đang thực thi
 */
export async function cancelCampaignRunApi(runId: string): Promise<void> {
  await supabaseRequest(
    `/rest/v1/campaign_runs?id=eq.${encodeURIComponent(runId)}`,
    {
      body: JSON.stringify({
        ended_at: new Date().toISOString(),
        status: 'cancelled',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      schema: 'automa',
    },
  );
}

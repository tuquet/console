/**
 * Workspace Lifecycle Status (`public.workspaces.status`)
 */
export const WORKSPACE_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  SUSPENDED: 'suspended',
} as const;

export type WorkspaceStatus =
  (typeof WORKSPACE_STATUS)[keyof typeof WORKSPACE_STATUS];

export const WORKSPACE_STATUS_VALUES = Object.values(
  WORKSPACE_STATUS,
) as readonly WorkspaceStatus[];

/**
 * Workspace Service Plan Tier (`public.workspaces.metadata.plan`)
 */
export const WORKSPACE_PLAN = {
  ENTERPRISE: 'enterprise',
  FREE: 'free',
  PRO: 'pro',
} as const;

export type WorkspacePlan =
  (typeof WORKSPACE_PLAN)[keyof typeof WORKSPACE_PLAN];

export const WORKSPACE_PLAN_VALUES = Object.values(
  WORKSPACE_PLAN,
) as readonly WorkspacePlan[];

/**
 * Workspace Member Invitation Status (`public.workspace_invitations.status`)
 */
export const INVITATION_STATUS = {
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  PENDING: 'pending',
  REVOKED: 'revoked',
} as const;

export type InvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

export const INVITATION_STATUS_VALUES = Object.values(
  INVITATION_STATUS,
) as readonly InvitationStatus[];

import type { Component } from 'vue';

import type { SupabaseResourceKey } from '#/api/core/supabase-schema-registry';

export interface VxeDetailSheetAction<T = Record<string, any>> {
  disabled?: (row: T) => boolean;
  handler?: (row: T) => any;
  icon?: Component;
  label: string;
  onClick?: (row: T) => any;
  variant?: 'default' | 'destructive' | 'ghost' | 'outline' | 'secondary';
}

export interface VxeDetailSheetOptions<T = Record<string, any>> {
  /**
   * Optional explicit slot name used by the grid's action column
   * (auto-detected from `actions-cell`, `action-cell`, `role-actions-cell`, `detail-cell` if omitted)
   */
  actionSlotName?: string;
  /**
   * Extra declarative action buttons to display inside the Detail Sheet footer
   */
  actions?: VxeDetailSheetAction<T>[];
  /**
   * Whether clicking a row opens the Detail Sheet (defaults to `true`)
   */
  enabled?: boolean;
  /**
   * Whether to forward the grid's action column slot into the sheet footer (defaults to `true`).
   * Set to `false` when the grid's action column only contains a "Detail" trigger button.
   */
  forwardActionSlot?: boolean;
  /**
   * Optional custom save handler overriding or augmenting the default PostgREST PATCH
   */
  onSave?: (params: {
    dirtyPayload: Record<string, any>;
    formData: Record<string, any>;
    resource: SupabaseResourceKey;
    row: T;
  }) => Promise<void> | void;
  /**
   * Optional callback invoked after a row is saved via the Detail Sheet
   */
  onSaved?: (row?: T) => any;
  /**
   * Canonical Supabase table resource (`schema.table`).
   * Automatically inferred from route and row shape when omitted.
   */
  resource?: SupabaseResourceKey;
  /**
   * Optional field name from the row to display as subtitle metadata
   */
  subtitleField?: keyof T | string;
  /**
   * Optional field name from the row to display as primary sheet title
   */
  titleField?: keyof T | string;
}

/**
 * Checks whether a DOM click event originated inside an interactive element
 * (button, link, input, switch, or `[data-stop-row-click]`) so row-click
 * does not double-trigger when clicking inline action buttons.
 */
export function isInteractiveCellClick(event?: Event | null): boolean {
  if (!event) {
    return false;
  }
  const target = event.target as HTMLElement | null;
  if (!target || typeof target.closest !== 'function') {
    return false;
  }
  return Boolean(
    target.closest(
      'button, a, input, select, textarea, [role="button"], [role="switch"], [role="checkbox"], [data-stop-row-click], .vxe-checkbox--icon',
    ),
  );
}

const DETAIL_TRIGGER_LABELS = new Set([
  'chi tiet',
  'common.detail',
  'detail',
  'details',
  'page.workspace.action_detail',
  'view detail',
  'view details',
  'xem chi tiet',
]);

export function isDetailTriggerLabel(raw?: null | string): boolean {
  if (!raw || typeof raw !== 'string') {
    return false;
  }
  const normalized = raw
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .replaceAll('\u0111', 'd')
    .replaceAll('\u0110', 'D')
    .trim()
    .toLowerCase();
  return DETAIL_TRIGGER_LABELS.has(normalized);
}

function extractVNodeText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((child) => extractVNodeText(child)).join(' ');
  }
  if (typeof node === 'object') {
    if (typeof node.children === 'string') {
      return node.children;
    }
    if (Array.isArray(node.children)) {
      return node.children
        .map((child: any) => extractVNodeText(child))
        .join(' ');
    }
    if (
      node.children &&
      typeof node.children === 'object' &&
      typeof node.children.default === 'function'
    ) {
      try {
        return extractVNodeText(node.children.default());
      } catch {
        return '';
      }
    }
  }
  return '';
}

function isDetailTriggerVNode(node: any): boolean {
  if (!node || typeof node !== 'object') {
    return false;
  }
  const props = node.props ?? {};
  if (
    props['data-detail-trigger'] !== undefined &&
    props['data-detail-trigger'] !== false
  ) {
    return true;
  }
  const isButtonLike =
    node.type === 'button' ||
    typeof props.onClick === 'function' ||
    (typeof node.type === 'object' &&
      (node.type?.name === 'Button' || node.type?.__name === 'Button'));

  if (!isButtonLike) {
    return false;
  }
  if (isDetailTriggerLabel(props.title)) {
    return true;
  }
  const text = extractVNodeText(node);
  return isDetailTriggerLabel(text);
}

/**
 * Automatically strips self-referential "Detail / Chi tiết" trigger buttons
 * when forwarding a table's `#actions-cell` slot into the Detail Sheet footer,
 * while preserving sibling business actions (Copy, Revoke, CLI, Activate, etc.).
 */
export function stripRedundantDetailTriggerVNodes(nodes: any): any[] {
  if (!nodes) return [];
  const list = Array.isArray(nodes) ? nodes : [nodes];
  const result: any[] = [];

  for (const node of list) {
    if (!node) continue;
    if (isDetailTriggerVNode(node)) {
      continue;
    }
    if (typeof node === 'object' && Array.isArray(node.children)) {
      const filteredChildren = stripRedundantDetailTriggerVNodes(node.children);
      if (filteredChildren.length === 0) {
        continue;
      }
      result.push({
        ...node,
        children: filteredChildren,
      });
      continue;
    }
    result.push(node);
  }

  return result;
}

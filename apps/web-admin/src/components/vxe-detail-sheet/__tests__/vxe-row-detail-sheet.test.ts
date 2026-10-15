import { Fragment, h } from 'vue';

import { describe, expect, it } from 'vitest';

import {
  isDetailTriggerLabel,
  isInteractiveCellClick,
  stripRedundantDetailTriggerVNodes,
} from '../types';

describe('vxe-detail-sheet — isInteractiveCellClick & slot deduplication', () => {
  it('returns false when clicking a standard table cell or span', () => {
    const cell = document.createElement('td');
    const span = document.createElement('span');
    cell.append(span);

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: span });

    expect(isInteractiveCellClick(event)).toBe(false);
    expect(isInteractiveCellClick(null)).toBe(false);
  });

  it('returns true when clicking inside a button, link, input, or [data-stop-row-click]', () => {
    const button = document.createElement('button');
    const icon = document.createElement('svg');
    button.append(icon);

    const btnEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(btnEvent, 'target', { value: icon });
    expect(isInteractiveCellClick(btnEvent)).toBe(true);

    const stopContainer = document.createElement('div');
    stopContainer.dataset.stopRowClick = 'true';
    const innerSpan = document.createElement('span');
    stopContainer.append(innerSpan);

    const stopEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(stopEvent, 'target', { value: innerSpan });
    expect(isInteractiveCellClick(stopEvent)).toBe(true);
  });

  it('identifies redundant detail trigger labels in Vietnamese and English while preserving business actions', () => {
    expect(isDetailTriggerLabel('Chi tiết')).toBe(true);
    expect(isDetailTriggerLabel('Xem chi tiết')).toBe(true);
    expect(isDetailTriggerLabel('Detail')).toBe(true);
    expect(isDetailTriggerLabel('View details')).toBe(true);

    expect(isDetailTriggerLabel('Thu hồi')).toBe(false);
    expect(isDetailTriggerLabel('Sao chép')).toBe(false);
    expect(isDetailTriggerLabel('Xem log')).toBe(false);
    expect(isDetailTriggerLabel('Nhận bàn giao')).toBe(false);
  });

  it('strips self-referential detail buttons from forwarded action slot VNodes while preserving sibling action buttons', () => {
    const wrapperVNode = h(
      'div',
      { class: 'flex items-center justify-end gap-1.5' },
      [
        h('button', { title: 'Chi tiết' }, [h('span', 'Chi tiết')]),
        h('button', { title: 'Thu hồi' }, [h('span', 'Thu hồi')]),
      ],
    );

    const stripped = stripRedundantDetailTriggerVNodes([wrapperVNode]);
    expect(stripped).toHaveLength(1);
    const children = stripped[0]?.children as any[];
    expect(children).toHaveLength(1);
    expect(children[0]?.props?.title).toBe('Thu hồi');

    // If an action slot ONLY has a single "Chi tiết" button, stripping returns an empty array
    const singleDetailFragment = h(Fragment, null, [
      h('button', { title: 'View details' }, 'Details'),
    ]);
    expect(stripRedundantDetailTriggerVNodes([singleDetailFragment])).toEqual(
      [],
    );
  });
});

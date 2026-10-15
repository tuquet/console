import { describe, expect, it } from 'vitest';

import { isInteractiveCellClick } from '../types';

describe('vxe-detail-sheet — isInteractiveCellClick guard', () => {
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
});

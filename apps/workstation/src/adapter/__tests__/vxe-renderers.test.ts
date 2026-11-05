import { describe, expect, it } from 'vitest';

import { getVxeUI } from '#/adapter/vxe-table';

describe('vxe standard cell renderers', () => {
  it('registers CellDate, CellIdCopy, and CellStatus renderers in vxeUI', () => {
    const vxeUI = getVxeUI();
    const cellDate = vxeUI?.renderer?.get('CellDate');
    const cellIdCopy = vxeUI?.renderer?.get('CellIdCopy');
    const cellStatus = vxeUI?.renderer?.get('CellStatus');

    expect(cellDate).toBeDefined();
    expect(cellDate?.renderTableDefault).toBeTypeOf('function');

    expect(cellIdCopy).toBeDefined();
    expect(cellIdCopy?.renderTableDefault).toBeTypeOf('function');

    expect(cellStatus).toBeDefined();
    expect(cellStatus?.renderTableDefault).toBeTypeOf('function');

    const cellActions = vxeUI?.renderer?.get('CellActions');
    const cellProgress = vxeUI?.renderer?.get('CellProgress');
    const cellDuration = vxeUI?.renderer?.get('CellDuration');

    expect(cellActions).toBeDefined();
    expect(cellActions?.renderTableDefault).toBeTypeOf('function');

    expect(cellProgress).toBeDefined();
    expect(cellProgress?.renderTableDefault).toBeTypeOf('function');

    expect(cellDuration).toBeDefined();
    expect(cellDuration?.renderTableDefault).toBeTypeOf('function');
  });

  it('renders CellDate correctly with date string and fallback', () => {
    const cellDate = getVxeUI()?.renderer?.get('CellDate');

    // Empty date
    const emptyVNode = cellDate?.renderTableDefault?.(
      {} as any,
      { column: { field: 'date' }, row: { date: null } } as any,
    );
    expect(emptyVNode).toBeDefined();
    expect(emptyVNode?.children).toBe('—');

    // Valid date string
    const validVNode = cellDate?.renderTableDefault?.(
      {} as any,
      {
        column: { field: 'date' },
        row: { date: '2026-01-01T12:00:00Z' },
      } as any,
    );
    expect(validVNode).toBeDefined();
    expect(typeof validVNode?.children).toBe('string');
    expect(validVNode?.children).not.toBe('—');
  });

  it('renders CellIdCopy correctly with short id', () => {
    const cellIdCopy = getVxeUI()?.renderer?.get('CellIdCopy');
    const testUuid = '12345678-abcd-ef01-2345-6789abcdef01';

    const vnode = cellIdCopy?.renderTableDefault?.(
      {} as any,
      { column: { field: 'id' }, row: { id: testUuid } } as any,
    );
    expect(vnode).toBeDefined();
    expect(Array.isArray(vnode?.children)).toBe(true);

    const children = vnode?.children as any[];
    const codeNode = children[0];
    const text =
      typeof codeNode.children === 'function'
        ? codeNode.children()
        : codeNode.children?.default?.();
    expect(text).toBe('12345678...ef01');
  });

  it('renders CellStatus correctly according to statusMap', () => {
    const cellStatus = getVxeUI()?.renderer?.get('CellStatus');
    const renderOpts = {
      props: {
        statusMap: {
          installed: { label: 'Đã cài đặt', variant: 'success' },
          disabled: { label: 'Tạm dừng', variant: 'muted' },
        },
      },
    };

    const vnode = cellStatus?.renderTableDefault?.(
      renderOpts as any,
      { column: { field: 'status' }, row: { status: 'installed' } } as any,
    );
    expect(vnode).toBeDefined();
  });

  it('renders CellProgress correctly with percentage and tone', () => {
    const cellProgress = getVxeUI()?.renderer?.get('CellProgress');
    const vnode = cellProgress?.renderTableDefault?.(
      { props: { max: 100, showText: true, tone: 'success' } } as any,
      { column: { field: 'pct' }, row: { pct: 75 } } as any,
    );
    expect(vnode).toBeDefined();
    expect(Array.isArray(vnode?.children)).toBe(true);
    const children = vnode?.children as any[];
    expect(children[1]?.children).toBe('75%');
  });

  it('renders CellDuration correctly in human format', () => {
    const cellDuration = getVxeUI()?.renderer?.get('CellDuration');

    // 45 seconds
    const vnodeSec = cellDuration?.renderTableDefault?.(
      { props: { unit: 's' } } as any,
      { column: { field: 'dur' }, row: { dur: 45 } } as any,
    );
    expect(vnodeSec?.children).toBe('45s');

    // 125 seconds -> 2m 5s
    const vnodeMin = cellDuration?.renderTableDefault?.(
      { props: { unit: 's' } } as any,
      { column: { field: 'dur' }, row: { dur: 125 } } as any,
    );
    expect(vnodeMin?.children).toBe('2m 5s');

    // empty fallback
    const vnodeEmpty = cellDuration?.renderTableDefault?.(
      { props: { unit: 's' } } as any,
      { column: { field: 'dur' }, row: { dur: null } } as any,
    );
    expect(vnodeEmpty?.children).toBe('—');
  });

  it('renders CellActions dropdown menu with actions', () => {
    const cellActions = getVxeUI()?.renderer?.get('CellActions');
    const actions = [
      { code: 'edit', label: 'Chỉnh sửa' },
      { code: 'delete', danger: true, label: 'Xóa' },
    ];
    const vnode = cellActions?.renderTableDefault?.(
      { props: { actions } } as any,
      { column: { field: 'actions' }, row: { id: '1' } } as any,
    );
    expect(vnode).toBeDefined();
  });
});

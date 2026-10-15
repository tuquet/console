# Implementation Plan - Standardized VXE Cell Renderers

## Context & Motivation
Thay thế các template slot (`<template #date-cell>`, `<template #id-cell>`, v.v.) bị lặp đi lặp lại ở nhiều màn hình bằng cơ chế `vxeUI.renderer.add` tập trung trong `apps/web-admin/src/adapter/vxe-table.ts`.

## Step 1: Implement Shared Renderers in `vxe-table.ts`
1. **`CellDate`**:
   - Nhận `row[column.field]` hoặc `cellValue`.
   - Format sang `YYYY-MM-DD HH:mm:ss` (hoặc `YYYY-MM-DD` tùy props).
   - Render `h('span', { class: 'font-mono text-xs text-muted-foreground' }, formattedText)`.
2. **`CellIdCopy`**:
   - Nhận `id` từ field.
   - Hiển thị short id: `xxxx...xxxx`.
   - Có nút copy kèm icon `Copy` và thông báo toast / copy state bằng `navigator.clipboard.writeText`.
   - Ngăn sự kiện click lan ra ngoài dòng (`e.stopPropagation()`).
3. **`CellStatus`**:
   - Nhận status string, tra cứu badge style và dot color từ `props.statusMap` hoặc default fallback.
   - Render badge với dot nhỏ và label.

## Step 2: Refactor Views
1. **`system/plugins/index.vue`**:
   - Thay `slots: { default: 'date-cell' }` bằng `cellRender: { name: 'CellDate' }`.
   - Xóa bỏ `<template #date-cell>` trong template.
2. **`system/users/index.vue`**:
   - Thay `slots: { default: 'date-cell' }` và `slots: { default: 'id-cell' }` bằng `CellDate` và `CellIdCopy`.
   - Xóa bỏ `<template #date-cell>` và `<template #id-cell>`.

## Step 3: Verification Checkpoints
- Unit tests & Typecheck: `pnpm check:type`
- Linting: `npx oxlint apps/web-admin/src/`
- Build check: `pnpm run build:admin`

# @operon/playground

Micro-app độc lập quản lý miền nghiệp vụ **Playground** trong kiến trúc Operon Console.

## Chế độ hoạt động

1. **Phát triển độc lập (Standalone Sandbox):**

   ```bash
   pnpm --filter @operon/playground dev
   ```

   Chạy tại `http://localhost:5324` với Mock Kernel đầy đủ.

2. **Chạy tích hợp cùng Host Shell:**
   ```bash
   pnpm dev:shell
   ```
   Nạp động qua remote-entry tại route `/playground`.

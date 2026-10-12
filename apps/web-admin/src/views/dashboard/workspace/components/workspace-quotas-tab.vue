<script lang="ts" setup>
import type { WorkspaceQuota } from '#/api';

import { Progress } from '@tuquet/vue-ui';

interface Props {
  planName?: string;
  quota: WorkspaceQuota;
}

const props = withDefaults(defineProps<Props>(), {
  planName: 'Pro',
});
</script>

<template>
  <div class="space-y-4 pt-1">
    <h3 class="text-base font-semibold text-foreground">
      Hạn Ngạch Tài Nguyên (Gói {{ props.planName }})
    </h3>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <!-- Quota 1: Members -->
      <div class="rounded-xl border border-border/60 bg-muted/20 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-foreground">Thành Viên</span>
          <span class="text-xs text-muted-foreground">
            {{ props.quota.used_members }} / {{ props.quota.max_members }}
          </span>
        </div>
        <div class="mt-2">
          <Progress
            :model-value="
              Math.min(
                100,
                Math.round(
                  ((props.quota.used_members || 1) /
                    (props.quota.max_members || 10)) *
                    100,
                ),
              )
            "
            class="h-2"
          />
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          Số thành viên tối đa trong Workspace
        </div>
      </div>

      <!-- Quota 2: Devices -->
      <div class="rounded-xl border border-border/60 bg-muted/20 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-foreground">Thiết Bị Trạm</span>
          <span class="text-xs text-muted-foreground">
            {{ props.quota.used_devices }} / {{ props.quota.max_devices }}
          </span>
        </div>
        <div class="mt-2">
          <Progress
            :model-value="
              Math.min(
                100,
                Math.round(
                  ((props.quota.used_devices || 1) /
                    (props.quota.max_devices || 25)) *
                    100,
                ),
              )
            "
            class="h-2"
          />
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          Số thiết bị Specter kết nối đồng thời
        </div>
      </div>

      <!-- Quota 3: Storage -->
      <div class="rounded-xl border border-border/60 bg-muted/20 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-foreground"
            >Dung Lượng Lưu Trữ</span
          >
          <span class="text-xs text-muted-foreground">
            {{
              Math.round(((props.quota.used_storage_mb || 0) / 1024) * 10) / 10
            }}
            GB /
            {{ Math.round((props.quota.max_storage_mb || 10240) / 1024) }} GB
          </span>
        </div>
        <div class="mt-2">
          <Progress
            :model-value="
              Math.min(
                100,
                Math.round(
                  ((props.quota.used_storage_mb || 100) /
                    (props.quota.max_storage_mb || 10240)) *
                    100,
                ),
              )
            "
            class="h-2"
          />
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          Lưu trữ tệp assets, báo cáo logs và cấu hình automation
        </div>
      </div>
    </div>
  </div>
</template>

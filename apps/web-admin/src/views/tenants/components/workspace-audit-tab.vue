<script lang="ts" setup>
import type { TenantAuditLog } from '#/api';

import { onMounted, ref, watch } from 'vue';

import { History, RefreshCw, ShieldCheck, User } from '@lucide/vue';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@tuquet/vue-ui';

import { getTenantAuditLogsApi } from '#/api';
import { useDateFormat } from '#/composables';

interface Props {
  tenantId: string;
}

const props = defineProps<Props>();
const { formatDate } = useDateFormat();

const loading = ref(true);
const logs = ref<TenantAuditLog[]>([]);

async function loadAuditLogs() {
  if (!props.tenantId) return;
  loading.value = true;
  try {
    logs.value = await getTenantAuditLogsApi(props.tenantId);
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải nhật ký an ninh');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.tenantId,
  () => {
    loadAuditLogs();
  },
);

onMounted(() => {
  loadAuditLogs();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Action -->
    <div
      class="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <ShieldCheck class="size-4.5" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-foreground">
            Nhật Ký Kiểm Toán An Ninh
          </h3>
          <p class="text-xs text-muted-foreground">
            Lịch sử các thao tác thay đổi cấu hình, thành viên và phân quyền
            trong Workspace
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        class="h-8 text-xs flex items-center gap-1.5"
        :disabled="loading"
        @click="loadAuditLogs"
      >
        <RefreshCw class="size-3.5" :class="{ 'animate-spin': loading }" />
        <span>Làm Mới</span>
      </Button>
    </div>

    <!-- Dual View: Desktop Table -->
    <div
      class="hidden md:block overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[180px]">Thời Gian</TableHead>
            <TableHead class="w-[220px]">Người Thực Hiện</TableHead>
            <TableHead class="w-[180px]">Hành Động</TableHead>
            <TableHead>Đối Tượng / Chi Tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="log in logs" :key="log.id">
            <TableCell
              class="font-mono text-xs text-muted-foreground whitespace-nowrap"
            >
              {{ formatDate(log.created_at) }}
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <div
                  class="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <User class="size-3" />
                </div>
                <div class="truncate max-w-[180px]">
                  <div class="text-xs font-medium text-foreground truncate">
                    {{ log.actor_name || log.actor_email || 'Hệ thống' }}
                  </div>
                  <div
                    v-if="log.actor_name && log.actor_email"
                    class="text-[11px] text-muted-foreground truncate"
                  >
                    {{ log.actor_email }}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" class="font-mono text-xs">
                {{ log.action }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2 text-xs">
                <span class="text-muted-foreground font-mono"
                  >{{ log.entity_type }}:</span
                >
                <span class="font-mono text-foreground">{{
                  log.entity_id
                }}</span>
              </div>
            </TableCell>
          </TableRow>

          <TableRow v-if="logs.length === 0 && !loading">
            <TableCell
              colspan="4"
              class="h-32 text-center text-sm text-muted-foreground"
            >
              <div class="flex flex-col items-center justify-center gap-2">
                <History class="size-8 text-muted-foreground/60" />
                <p>Chưa có sự kiện kiểm toán an ninh nào được ghi nhận</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Dual View: Mobile Card List -->
    <div class="block space-y-3 md:hidden">
      <div
        v-for="log in logs"
        :key="log.id"
        class="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-2 text-xs"
      >
        <div class="flex items-center justify-between">
          <Badge variant="outline" class="font-mono text-xs">
            {{ log.action }}
          </Badge>
          <span class="font-mono text-[11px] text-muted-foreground">
            {{ formatDate(log.created_at) }}
          </span>
        </div>

        <div class="flex items-center gap-2 pt-1 text-muted-foreground">
          <User class="size-3.5" />
          <span>{{ log.actor_name || log.actor_email || 'Hệ thống' }}</span>
        </div>

        <div
          class="pt-2 border-t border-border/40 font-mono text-[11px] text-muted-foreground"
        >
          <span>{{ log.entity_type }}: </span>
          <span class="text-foreground">{{ log.entity_id }}</span>
        </div>
      </div>

      <div
        v-if="logs.length === 0 && !loading"
        class="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm"
      >
        <History class="size-8 text-muted-foreground/60 mx-auto mb-2" />
        <p>Chưa có sự kiện kiểm toán an ninh nào được ghi nhận</p>
      </div>
    </div>
  </div>
</template>

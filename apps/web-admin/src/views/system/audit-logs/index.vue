<script lang="ts" setup>
import type { GlobalAuditLogItem } from '#/api';

import { onMounted, ref } from 'vue';

import {
  Building2,
  Eye,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  User,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@tuquet/vue-ui';

import { getGlobalAuditLogsApi } from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'SystemAuditLogs' });

const { formatDate } = useDateFormat();

const loading = ref(true);
const logs = ref<GlobalAuditLogItem[]>([]);
const actionFilter = ref('');
const tenantFilter = ref('');

const selectedLog = ref<GlobalAuditLogItem | null>(null);
const detailOpen = ref(false);

async function loadAuditLogs() {
  loading.value = true;
  try {
    logs.value = await getGlobalAuditLogsApi({
      action: actionFilter.value.trim() || undefined,
      tenantId: tenantFilter.value.trim() || undefined,
      limit: 100,
    });
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải nhật ký kiểm toán toàn cầu');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadAuditLogs();
}

function openDetail(log: GlobalAuditLogItem) {
  selectedLog.value = log;
  detailOpen.value = true;
}

function getActionBadgeVariant(
  action: string,
): 'default' | 'destructive' | 'outline' | 'secondary' {
  if (
    action.includes('delete') ||
    action.includes('destroy') ||
    action.includes('remove')
  ) {
    return 'destructive';
  }
  if (
    action.includes('create') ||
    action.includes('insert') ||
    action.includes('add')
  ) {
    return 'default';
  }
  if (action.includes('update') || action.includes('edit')) {
    return 'secondary';
  }
  return 'outline';
}

onMounted(() => {
  loadAuditLogs();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2.5">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Nhật Ký Kiểm Toán
        </h1>
        <Badge variant="secondary" class="text-xs uppercase font-medium">
          Global Audit Trail
        </Badge>
        <span v-if="!loading" class="text-xs font-medium text-muted-foreground">
          ({{ logs.length }} sự kiện gần nhất)
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="loadAuditLogs"
          class="gap-1.5"
        >
          <RefreshCw
            class="size-3.5 text-muted-foreground"
            :class="{ 'animate-spin': loading }"
          />
          Làm mới
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="actionFilter"
          placeholder="Lọc theo hành động (ví dụ: auth:login, member:invite)..."
          class="pl-9"
          @keydown.enter="handleSearch"
        />
      </div>
      <div class="w-full sm:w-64">
        <Input
          v-model="tenantFilter"
          placeholder="Lọc theo Tenant UUID..."
          @keydown.enter="handleSearch"
        />
      </div>
      <Button variant="secondary" size="sm" @click="handleSearch">
        Áp dụng lọc
      </Button>
    </div>

    <!-- Desktop Table View -->
    <div
      class="hidden overflow-hidden rounded-xl border border-border/60 bg-card md:block"
    >
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="w-[170px]">Thời gian</TableHead>
            <TableHead>Hành động</TableHead>
            <TableHead>Thực thể</TableHead>
            <TableHead>Tenant ID</TableHead>
            <TableHead>Tác nhân (Actor)</TableHead>
            <TableHead>IP</TableHead>
            <TableHead class="text-right">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 5" :key="i">
              <TableCell colspan="7" class="h-12 text-center">
                <div
                  class="mx-auto h-4 w-48 animate-pulse rounded bg-muted"
                ></div>
              </TableCell>
            </TableRow>
          </template>

          <template v-else-if="logs.length === 0">
            <TableRow>
              <TableCell colspan="7" class="h-44 text-center">
                <div
                  class="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  <ScrollText class="size-8 stroke-[1.5]" />
                  <p class="text-sm font-medium">
                    Không có nhật ký nào được ghi nhận
                  </p>
                  <p class="text-xs text-muted-foreground/80">
                    Thử tìm với hành động hoặc tenant ID khác.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow
              v-for="log in logs"
              :key="log.id"
              class="transition-colors hover:bg-muted/40"
            >
              <TableCell class="font-mono text-xs text-muted-foreground">
                {{ formatDate(log.created_at) }}
              </TableCell>
              <TableCell>
                <Badge
                  :variant="getActionBadgeVariant(log.action)"
                  class="font-mono text-xs"
                >
                  {{ log.action }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1.5 text-xs font-mono">
                  <span class="text-foreground">{{ log.entity_type }}</span>
                  <span class="text-muted-foreground/70"
                    >#{{ log.entity_id.slice(0, 8) }}</span
                  >
                </div>
              </TableCell>
              <TableCell>
                <code
                  class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {{ log.tenant_id.slice(0, 8) }}...
                </code>
              </TableCell>
              <TableCell>
                <div
                  class="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <User class="size-3 text-muted-foreground/70" />
                  <span class="font-mono">{{
                    log.actor_id ? log.actor_id.slice(0, 8) : 'Hệ thống'
                  }}</span>
                </div>
              </TableCell>
              <TableCell class="font-mono text-xs text-muted-foreground">
                {{ log.ip_address || '—' }}
              </TableCell>
              <TableCell class="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  @click="openDetail(log)"
                >
                  <Eye class="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Mobile Card View -->
    <div class="block space-y-3 md:hidden">
      <template v-if="loading">
        <div
          v-for="i in 3"
          :key="i"
          class="h-32 animate-pulse rounded-xl border border-border/60 bg-card p-4"
        ></div>
      </template>

      <template v-else-if="logs.length === 0">
        <div
          class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground"
        >
          <ScrollText class="size-8 stroke-[1.5]" />
          <p class="text-sm font-medium">Không có nhật ký nào</p>
        </div>
      </template>

      <template v-else>
        <div
          v-for="log in logs"
          :key="log.id"
          class="rounded-xl border border-border/60 bg-card p-4 space-y-2.5"
        >
          <div class="flex items-start justify-between gap-2">
            <Badge
              :variant="getActionBadgeVariant(log.action)"
              class="font-mono text-xs"
            >
              {{ log.action }}
            </Badge>
            <span class="font-mono text-[11px] text-muted-foreground">
              {{ formatDate(log.created_at) }}
            </span>
          </div>

          <div class="text-xs space-y-1">
            <div class="flex items-center gap-1.5 text-foreground font-mono">
              <span class="font-semibold">{{ log.entity_type }}</span>
              <span class="text-muted-foreground"
                >#{{ log.entity_id.slice(0, 12) }}</span
              >
            </div>
            <div
              class="flex items-center justify-between text-muted-foreground"
            >
              <span class="flex items-center gap-1 font-mono text-[11px]">
                <Building2 class="size-3" />
                {{ log.tenant_id.slice(0, 8) }}
              </span>
              <span class="font-mono text-[11px]">{{
                log.ip_address || 'no-ip'
              }}</span>
            </div>
          </div>

          <div class="pt-2 border-t border-border/40 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              class="w-full text-xs gap-1.5"
              @click="openDetail(log)"
            >
              <Eye class="size-3.5" />
              Xem chi tiết JSON
            </Button>
          </div>
        </div>
      </template>
    </div>

    <!-- Detail Dialog -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-w-[calc(100vw-2rem)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base">
            <ShieldCheck class="size-4 text-primary" />
            Chi tiết Sự Kiện Kiểm Toán #{{ selectedLog?.id }}
          </DialogTitle>
          <DialogDescription class="font-mono text-xs">
            Hành động: {{ selectedLog?.action }} | Tenant:
            {{ selectedLog?.tenant_id }}
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="selectedLog"
          class="space-y-3 max-h-[60vh] overflow-y-auto text-xs"
        >
          <div>
            <h4 class="font-semibold text-foreground mb-1">
              Dữ liệu Mới (New Values)
            </h4>
            <pre
              class="rounded-lg bg-muted p-3 font-mono overflow-x-auto text-[11px]"
              >{{
                JSON.stringify(selectedLog.new_values, null, 2) || 'null'
              }}</pre>
          </div>

          <div>
            <h4 class="font-semibold text-foreground mb-1">
              Dữ liệu Cũ (Old Values)
            </h4>
            <pre
              class="rounded-lg bg-muted p-3 font-mono overflow-x-auto text-[11px]"
              >{{
                JSON.stringify(selectedLog.old_values, null, 2) || 'null'
              }}</pre>
          </div>

          <div
            class="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/40"
          >
            <div>
              <strong>Actor ID:</strong>
              {{ selectedLog.actor_id || 'Hệ thống' }}
            </div>
            <div>
              <strong>IP Address:</strong> {{ selectedLog.ip_address || '—' }}
            </div>
            <div class="col-span-2 truncate">
              <strong>User Agent:</strong> {{ selectedLog.user_agent || '—' }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import type { AutomaWorkflowItem } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { GitBranch, RefreshCw } from '@lucide/vue';
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

import { getWorkflowsApi } from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'AutomationWorkflows' });

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const loading = ref(true);
const workflows = ref<AutomaWorkflowItem[]>([]);

const VALID_STATUSES = new Set(['all', 'archived', 'draft', 'published']);

const filterStatus = computed({
  get() {
    const s = route.query.status as string;
    return VALID_STATUSES.has(s) ? s : 'all';
  },
  set(val: string) {
    router.replace({
      query: {
        ...route.query,
        status: val === 'all' ? undefined : val,
      },
    });
  },
});

const filteredWorkflows = computed(() => {
  if (filterStatus.value === 'all') return workflows.value;
  return workflows.value.filter((w) => w.status === filterStatus.value);
});

async function loadWorkflows() {
  loading.value = true;
  try {
    const tenantId = (route.query.tenant as string) || undefined;
    workflows.value = await getWorkflowsApi({ tenantId });
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách quy trình');
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.query.tenant,
  () => {
    loadWorkflows();
  },
);

onMounted(() => {
  loadWorkflows();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2.5">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Quy Trình Tự Động Hóa
        </h1>
        <Badge variant="secondary" class="font-mono text-xs uppercase">
          Visual Flow Graphs
        </Badge>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="loadWorkflows"
        >
          <RefreshCw
            class="size-3.5 shrink-0"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-4"
    >
      <!-- Filter Bar -->
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4"
      >
        <div class="flex items-center gap-2">
          <GitBranch class="size-4 shrink-0 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh Sách Quy Trình
          </span>
          <span class="text-xs text-muted-foreground">
            ({{ filteredWorkflows.length }} / {{ workflows.length }})
          </span>
        </div>

        <div
          class="inline-flex rounded-lg border border-border/60 bg-muted/40 p-1"
        >
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'all'"
          >
            Tất Cả ({{ workflows.length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'published'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'published'"
          >
            Xuất Bản ({{
              workflows.filter((w) => w.status === 'published').length
            }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'draft'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'draft'"
          >
            Bản Nháp ({{
              workflows.filter((w) => w.status === 'draft').length
            }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'archived'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'archived'"
          >
            Lưu Trữ ({{
              workflows.filter((w) => w.status === 'archived').length
            }})
          </button>
        </div>
      </div>

      <!-- Desktop Table -->
      <div
        v-if="filteredWorkflows.length > 0"
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Quy Trình</TableHead>
              <TableHead>Phiên Bản</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead>Ngày Tạo</TableHead>
              <TableHead class="text-right">Cập Nhật Cuối</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="w in filteredWorkflows" :key="w.id">
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
                  >
                    <GitBranch class="size-4" />
                  </div>
                  <div>
                    <div class="font-medium text-foreground">
                      {{ w.name }}
                    </div>
                    <div
                      class="text-xs text-muted-foreground line-clamp-1 max-w-md"
                    >
                      {{ w.description || 'Không có mô tả chi tiết' }}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="font-mono text-xs">
                  v{{ w.version }}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="text-xs font-normal">
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="{
                      'bg-success': w.status === 'published',
                      'bg-warning': w.status === 'draft',
                      'bg-muted-foreground': w.status === 'archived',
                    }"
                  ></span>
                  {{
                    w.status === 'published'
                      ? 'Đã Xuất Bản'
                      : w.status === 'draft'
                        ? 'Bản Nháp'
                        : 'Lưu Trữ'
                  }}
                </Badge>
              </TableCell>

              <TableCell class="text-xs text-muted-foreground">
                {{ formatDate(w.created_at) }}
              </TableCell>

              <TableCell class="text-right text-xs text-muted-foreground">
                {{ formatDate(w.updated_at) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Touch Cards -->
      <div
        v-if="filteredWorkflows.length > 0"
        class="block space-y-3 md:hidden"
      >
        <div
          v-for="w in filteredWorkflows"
          :key="w.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <GitBranch class="size-4.5" />
              </div>
              <div>
                <div class="font-semibold text-foreground text-sm">
                  {{ w.name }}
                </div>
                <div class="text-xs text-muted-foreground font-mono">
                  v{{ w.version }}
                </div>
              </div>
            </div>

            <Badge variant="outline" class="text-xs font-normal">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="{
                  'bg-success': w.status === 'published',
                  'bg-warning': w.status === 'draft',
                  'bg-muted-foreground': w.status === 'archived',
                }"
              ></span>
              {{
                w.status === 'published'
                  ? 'Xuất Bản'
                  : w.status === 'draft'
                    ? 'Bản Nháp'
                    : 'Lưu Trữ'
              }}
            </Badge>
          </div>

          <p class="text-xs text-muted-foreground line-clamp-2">
            {{ w.description || 'Không có mô tả chi tiết' }}
          </p>

          <div
            class="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground"
          >
            <span>Tạo: {{ formatDate(w.created_at) }}</span>
            <span>Sửa: {{ formatDate(w.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredWorkflows.length === 0 && !loading"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground"
        >
          <GitBranch class="size-6" />
        </div>
        <h3 class="mt-3 text-sm font-semibold text-foreground">
          {{
            filterStatus === 'all'
              ? 'Chưa có quy trình tự động nào'
              : 'Không có quy trình phù hợp bộ lọc'
          }}
        </h3>
        <p class="mt-1 max-w-sm text-xs text-muted-foreground">
          {{
            filterStatus === 'all'
              ? 'Quy trình tự động hóa được thiết kế và đồng bộ từ Automa Extension hoặc trình chỉnh sửa Visual Flow.'
              : 'Thử chuyển sang bộ lọc khác để kiểm tra trạng thái quy trình.'
          }}
        </p>
      </div>
    </div>
  </div>
</template>

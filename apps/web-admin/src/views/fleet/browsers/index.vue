<script lang="ts" setup>
import type { FleetBrowserItem } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Globe, HardDrive, Lock, RefreshCw, Shield, Unlock } from '@lucide/vue';
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

import { getFleetBrowsersApi } from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'FleetBrowsers' });

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const loading = ref(true);
const browsers = ref<FleetBrowserItem[]>([]);

const VALID_STATUSES = new Set(['all', 'error', 'idle', 'running', 'syncing']);

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

const filteredBrowsers = computed(() => {
  if (filterStatus.value === 'all') return browsers.value;
  return browsers.value.filter((b) => b.status === filterStatus.value);
});

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

async function loadBrowsers() {
  loading.value = true;
  try {
    const tenantId = (route.query.tenant as string) || undefined;
    browsers.value = await getFleetBrowsersApi({ tenantId });
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách hồ sơ trình duyệt');
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.query.tenant,
  () => {
    loadBrowsers();
  },
);

onMounted(() => {
  loadBrowsers();
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
          Hồ Sơ Trình Duyệt Đám Mây
        </h1>
        <Badge variant="secondary" class="text-xs uppercase font-medium">
          Cloud Anti-Detect
        </Badge>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="loadBrowsers"
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
          <Globe class="size-4 shrink-0 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh Sách Profile
          </span>
          <span class="text-xs text-muted-foreground">
            ({{ filteredBrowsers.length }} / {{ browsers.length }})
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
            Tất Cả ({{ browsers.length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'idle'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'idle'"
          >
            Sẵn Sàng ({{ browsers.filter((b) => b.status === 'idle').length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'running'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'running'"
          >
            Đang Chạy ({{
              browsers.filter((b) => b.status === 'running').length
            }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'syncing'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'syncing'"
          >
            Đồng Bộ ({{
              browsers.filter((b) => b.status === 'syncing').length
            }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'error'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'error'"
          >
            Lỗi ({{ browsers.filter((b) => b.status === 'error').length }})
          </button>
        </div>
      </div>

      <!-- Desktop Table -->
      <div
        v-if="filteredBrowsers.length > 0"
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Profile</TableHead>
              <TableHead>Hệ Điều Hành & Engine</TableHead>
              <TableHead>Khóa Máy Trạm (Lease)</TableHead>
              <TableHead>Bể Proxy</TableHead>
              <TableHead>Session & Cookies</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead class="text-right">Ngày Tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="b in filteredBrowsers" :key="b.id">
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
                  >
                    <Globe class="size-4" />
                  </div>
                  <div>
                    <div class="font-medium text-foreground">
                      {{ b.name }}
                    </div>
                    <div class="font-mono text-xs text-muted-foreground">
                      {{ b.id.slice(0, 8) }}...
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div class="flex items-center gap-1.5 text-xs">
                  <Badge variant="outline" class="uppercase text-xs font-medium">
                    {{ b.os_platform }}
                  </Badge>
                  <span class="font-mono text-muted-foreground">
                    {{ b.engine_version }}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div
                  v-if="b.locked_by_device"
                  class="inline-flex items-center gap-1.5 text-xs text-primary font-medium"
                >
                  <Lock class="size-3 text-primary shrink-0" />
                  <span>{{ b.locked_by_device.name }}</span>
                </div>
                <div
                  v-else
                  class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Unlock class="size-3 shrink-0" />
                  <span>Chưa khóa</span>
                </div>
              </TableCell>

              <TableCell>
                <div
                  v-if="b.proxy"
                  class="inline-flex items-center gap-1.5 font-mono text-xs text-foreground"
                >
                  <Shield class="size-3 text-success shrink-0" />
                  <span
                    >{{ b.proxy.protocol }}://{{ b.proxy.host }}:{{
                      b.proxy.port
                    }}</span
                  >
                </div>
                <span v-else class="text-xs text-muted-foreground">
                  Trực tiếp (Direct)
                </span>
              </TableCell>

              <TableCell>
                <div
                  class="flex items-center gap-3 text-xs text-foreground font-mono"
                >
                  <span>{{ formatBytes(b.storage_size_bytes) }}</span>
                  <span class="text-muted-foreground">&bull;</span>
                  <span>{{ b.cookies_count }} cookies</span>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="text-xs font-normal">
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="{
                      'bg-success': b.status === 'idle',
                      'bg-primary animate-pulse': b.status === 'running',
                      'bg-warning animate-pulse': b.status === 'syncing',
                      'bg-destructive': b.status === 'error',
                    }"
                  ></span>
                  {{
                    b.status === 'idle'
                      ? 'Sẵn Sàng'
                      : b.status === 'running'
                        ? 'Đang Chạy'
                        : b.status === 'syncing'
                          ? 'Đồng Bộ'
                          : 'Lỗi'
                  }}
                </Badge>
              </TableCell>

              <TableCell class="text-right text-xs text-muted-foreground">
                {{ formatDate(b.created_at) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Touch Cards -->
      <div v-if="filteredBrowsers.length > 0" class="block space-y-3 md:hidden">
        <div
          v-for="b in filteredBrowsers"
          :key="b.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <Globe class="size-4.5" />
              </div>
              <div>
                <div class="font-semibold text-foreground text-sm">
                  {{ b.name }}
                </div>
                <div class="font-mono text-xs text-muted-foreground">
                  {{ b.os_platform }} &bull; {{ b.engine_version }}
                </div>
              </div>
            </div>

            <Badge variant="outline" class="text-xs font-normal">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="{
                  'bg-success': b.status === 'idle',
                  'bg-primary animate-pulse': b.status === 'running',
                  'bg-warning animate-pulse': b.status === 'syncing',
                  'bg-destructive': b.status === 'error',
                }"
              ></span>
              {{
                b.status === 'idle'
                  ? 'Sẵn Sàng'
                  : b.status === 'running'
                    ? 'Đang Chạy'
                    : b.status === 'syncing'
                      ? 'Đồng Bộ'
                      : 'Lỗi'
              }}
            </Badge>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive class="size-3 shrink-0" />
              <span>{{ formatBytes(b.storage_size_bytes) }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <span>{{ b.cookies_count }} cookies</span>
            </div>
            <div
              class="col-span-2 flex items-center gap-1.5 font-mono text-muted-foreground truncate"
            >
              <Shield class="size-3 shrink-0 text-success" />
              <span v-if="b.proxy">
                {{ b.proxy.protocol }}://{{ b.proxy.host }}:{{ b.proxy.port }}
              </span>
              <span v-else>Trực tiếp (Direct)</span>
            </div>
          </div>

          <div
            class="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground"
          >
            <span>
              {{
                b.locked_by_device
                  ? `Khóa bởi: ${b.locked_by_device.name}`
                  : 'Chưa khóa'
              }}
            </span>
            <span>{{ formatDate(b.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredBrowsers.length === 0 && !loading"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground"
        >
          <Globe class="size-6" />
        </div>
        <h3 class="mt-3 text-sm font-semibold text-foreground">
          {{
            filterStatus === 'all'
              ? $t('page.fleet_view.browsers_empty')
              : 'Không có hồ sơ trình duyệt phù hợp bộ lọc'
          }}
        </h3>
        <p class="mt-1 max-w-sm text-xs text-muted-foreground">
          {{
            filterStatus === 'all'
              ? $t('page.fleet_view.browsers_empty_desc')
              : 'Thử chuyển sang bộ lọc khác để kiểm tra trạng thái các profile.'
          }}
        </p>
      </div>
    </div>
  </div>
</template>

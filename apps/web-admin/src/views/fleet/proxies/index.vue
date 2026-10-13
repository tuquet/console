<script lang="ts" setup>
import type { FleetProxyItem } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Activity, Network, RefreshCw } from '@lucide/vue';
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

import { getFleetProxiesApi } from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'FleetProxies' });

const route = useRoute();
const router = useRouter();
const { formatDate } = useDateFormat();

const loading = ref(true);
const proxies = ref<FleetProxyItem[]>([]);

const VALID_STATUSES = new Set([
  'active',
  'all',
  'disabled',
  'failing',
  'testing',
]);

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

const filteredProxies = computed(() => {
  if (filterStatus.value === 'all') return proxies.value;
  return proxies.value.filter((p) => p.status === filterStatus.value);
});

function getLatencyBadgeClass(latency: null | number) {
  if (latency === null || latency === undefined) return 'text-muted-foreground';
  if (latency < 300) return 'text-success font-semibold';
  if (latency < 800) return 'text-warning font-semibold';
  return 'text-destructive font-semibold';
}

async function loadProxies() {
  loading.value = true;
  try {
    const tenantId = (route.query.tenant as string) || undefined;
    proxies.value = await getFleetProxiesApi({ tenantId });
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách proxy');
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.query.tenant,
  () => {
    loadProxies();
  },
);

onMounted(() => {
  loadProxies();
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
          Quản Trị Bể Proxy
        </h1>
        <Badge variant="secondary" class="font-mono text-xs uppercase">
          Proxy Pool
        </Badge>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="loadProxies"
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
          <Network class="size-4 shrink-0 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh Sách Proxy
          </span>
          <span class="text-xs text-muted-foreground">
            ({{ filteredProxies.length }} / {{ proxies.length }})
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
            Tất Cả ({{ proxies.length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'active'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'active'"
          >
            Hoạt Động ({{
              proxies.filter((p) => p.status === 'active').length
            }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'failing'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'failing'"
          >
            Lỗi ({{ proxies.filter((p) => p.status === 'failing').length }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'testing'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'testing'"
          >
            Kiểm Tra ({{
              proxies.filter((p) => p.status === 'testing').length
            }})
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-all"
            :class="
              filterStatus === 'disabled'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="filterStatus = 'disabled'"
          >
            Vô Hiệu ({{
              proxies.filter((p) => p.status === 'disabled').length
            }})
          </button>
        </div>
      </div>

      <!-- Desktop Table -->
      <div
        v-if="filteredProxies.length > 0"
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Địa Chỉ Proxy</TableHead>
              <TableHead>Vị Trí & Loại</TableHead>
              <TableHead>Độ Trễ</TableHead>
              <TableHead>Lỗi Tích Lũy</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead class="text-right">Kiểm Tra Cuối</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="p in filteredProxies" :key="p.id">
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
                  >
                    <Network class="size-4" />
                  </div>
                  <div>
                    <div class="font-mono font-medium text-foreground text-xs">
                      {{ p.protocol }}://{{ p.host }}:{{ p.port }}
                    </div>
                    <div
                      v-if="p.username"
                      class="text-xs text-muted-foreground font-mono"
                    >
                      Auth: {{ p.username }}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div class="flex items-center gap-2 text-xs">
                  <span
                    v-if="p.country_code"
                    class="font-semibold text-foreground uppercase"
                  >
                    {{ p.country_code }}
                  </span>
                  <span v-if="p.city" class="text-muted-foreground">
                    ({{ p.city }})
                  </span>
                  <Badge
                    :variant="p.is_residential ? 'secondary' : 'outline'"
                    class="text-xs font-normal"
                  >
                    {{ p.is_residential ? 'Residential' : 'Datacenter' }}
                  </Badge>
                </div>
              </TableCell>

              <TableCell>
                <div class="flex items-center gap-1.5 text-xs font-mono">
                  <Activity class="size-3.5 shrink-0 text-muted-foreground" />
                  <span :class="getLatencyBadgeClass(p.latency_ms)">
                    {{
                      p.latency_ms !== null && p.latency_ms !== undefined
                        ? `${p.latency_ms} ms`
                        : '—'
                    }}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <span
                  class="font-mono text-xs"
                  :class="
                    p.error_count > 0
                      ? 'text-destructive font-semibold'
                      : 'text-muted-foreground'
                  "
                >
                  {{ p.error_count }} lỗi
                </span>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="text-xs font-normal">
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="{
                      'bg-success': p.status === 'active',
                      'bg-destructive': p.status === 'failing',
                      'bg-warning animate-pulse': p.status === 'testing',
                      'bg-muted-foreground': p.status === 'disabled',
                    }"
                  ></span>
                  {{
                    p.status === 'active'
                      ? 'Hoạt Động'
                      : p.status === 'failing'
                        ? 'Lỗi Kết Nối'
                        : p.status === 'testing'
                          ? 'Đang Test'
                          : 'Vô Hiệu'
                  }}
                </Badge>
              </TableCell>

              <TableCell class="text-right text-xs text-muted-foreground">
                {{ formatDate(p.last_checked_at) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Touch Cards -->
      <div v-if="filteredProxies.length > 0" class="block space-y-3 md:hidden">
        <div
          v-for="p in filteredProxies"
          :key="p.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <Network class="size-4.5" />
              </div>
              <div>
                <div class="font-mono font-medium text-foreground text-xs">
                  {{ p.protocol }}://{{ p.host }}:{{ p.port }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ p.is_residential ? 'Residential' : 'Datacenter' }}
                  <span v-if="p.country_code">
                    &bull; {{ p.country_code }}</span
                  >
                </div>
              </div>
            </div>

            <Badge variant="outline" class="text-xs font-normal">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="{
                  'bg-success': p.status === 'active',
                  'bg-destructive': p.status === 'failing',
                  'bg-warning animate-pulse': p.status === 'testing',
                  'bg-muted-foreground': p.status === 'disabled',
                }"
              ></span>
              {{
                p.status === 'active'
                  ? 'Hoạt Động'
                  : p.status === 'failing'
                    ? 'Lỗi'
                    : p.status === 'testing'
                      ? 'Test'
                      : 'Vô Hiệu'
              }}
            </Badge>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-1.5 font-mono">
              <Activity class="size-3.5 shrink-0 text-muted-foreground" />
              <span :class="getLatencyBadgeClass(p.latency_ms)">
                {{
                  p.latency_ms !== null && p.latency_ms !== undefined
                    ? `${p.latency_ms} ms`
                    : '—'
                }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-muted-foreground">
              <span>{{ p.error_count }} lỗi</span>
            </div>
          </div>

          <div
            class="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground"
          >
            <span>Kiểm tra: {{ formatDate(p.last_checked_at) }}</span>
            <span class="font-mono">{{ p.city || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredProxies.length === 0 && !loading"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground"
        >
          <Network class="size-6" />
        </div>
        <h3 class="mt-3 text-sm font-semibold text-foreground">
          {{
            filterStatus === 'all'
              ? 'Chưa có proxy nào trong bể'
              : 'Không có proxy phù hợp bộ lọc'
          }}
        </h3>
        <p class="mt-1 max-w-sm text-xs text-muted-foreground">
          {{
            filterStatus === 'all'
              ? 'Hạ tầng proxy trung tâm được cấu hình qua Bridge daemon hoặc cập nhật trực tiếp từ Tuquet Cloud.'
              : 'Thử chuyển sang bộ lọc khác để kiểm tra trạng thái proxy.'
          }}
        </p>
      </div>
    </div>
  </div>
</template>

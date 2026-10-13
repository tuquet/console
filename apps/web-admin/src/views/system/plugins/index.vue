<script lang="ts" setup>
import type { SystemPluginItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Layers, Puzzle, RefreshCw } from '@lucide/vue';
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

import { getSystemPluginsApi } from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'SystemPlugins' });

const { formatDate } = useDateFormat();

const loading = ref(true);
const plugins = ref<SystemPluginItem[]>([]);

async function loadPlugins() {
  loading.value = true;
  try {
    plugins.value = await getSystemPluginsApi();
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách plugins hệ thống');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPlugins();
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
          Plugins Hệ Thống
        </h1>
        <Badge variant="secondary" class="font-mono text-xs uppercase">
          System Catalog
        </Badge>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          class="size-8 shrink-0"
          title="Làm mới"
          @click="loadPlugins"
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
      <!-- Stats Bar -->
      <div
        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 text-xs"
      >
        <div class="flex items-center gap-2">
          <Layers class="size-4 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh Sách Plugins
          </span>
          <span class="text-muted-foreground"
            >({{ plugins.length }} tổng số)</span
          >
        </div>

        <div class="flex items-center gap-3 text-muted-foreground font-mono">
          <span>{{ plugins.filter((p) => p.is_core).length }} Core Kernel</span>
          <span>&bull;</span>
          <span>{{ plugins.filter((p) => !p.is_core).length }} Extensions</span>
        </div>
      </div>

      <!-- Desktop Table -->
      <div
        v-if="plugins.length > 0"
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plugin</TableHead>
              <TableHead>Phân Loại</TableHead>
              <TableHead>Phiên Bản & Schema</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead class="text-right">Ngày Cài Đặt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="p in plugins" :key="p.id">
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"
                  >
                    <Puzzle class="size-4" />
                  </div>
                  <div>
                    <div class="font-medium text-foreground">
                      {{ p.name }}
                    </div>
                    <div class="font-mono text-xs text-muted-foreground">
                      {{ p.id }}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge
                  :variant="p.is_core ? 'default' : 'secondary'"
                  class="text-xs font-normal"
                >
                  {{ p.is_core ? 'Core Kernel' : 'Extension' }}
                </Badge>
              </TableCell>

              <TableCell>
                <div class="flex items-center gap-2 text-xs font-mono">
                  <Badge variant="outline" class="font-mono text-xs">
                    v{{ p.version }}
                  </Badge>
                  <span v-if="p.schema_name" class="text-muted-foreground">
                    schema: {{ p.schema_name }}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="text-xs font-normal">
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="{
                      'bg-success': p.status === 'installed',
                      'bg-muted-foreground': p.status === 'disabled',
                      'bg-warning': p.status === 'pending',
                    }"
                  ></span>
                  {{
                    p.status === 'installed'
                      ? 'Đã Cài Đặt'
                      : p.status === 'disabled'
                        ? 'Tạm Dừng'
                        : 'Đang Chờ'
                  }}
                </Badge>
              </TableCell>

              <TableCell class="text-right text-xs text-muted-foreground">
                {{ formatDate(p.installed_at) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Touch Cards -->
      <div v-if="plugins.length > 0" class="block space-y-3 md:hidden">
        <div
          v-for="p in plugins"
          :key="p.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
              >
                <Puzzle class="size-4.5" />
              </div>
              <div>
                <div class="font-semibold text-foreground text-sm">
                  {{ p.name }}
                </div>
                <div class="font-mono text-xs text-muted-foreground">
                  {{ p.id }}
                </div>
              </div>
            </div>

            <Badge
              :variant="p.is_core ? 'default' : 'secondary'"
              class="text-xs font-normal"
            >
              {{ p.is_core ? 'Core' : 'Extension' }}
            </Badge>
          </div>

          <p
            v-if="p.description"
            class="text-xs text-muted-foreground line-clamp-2"
          >
            {{ p.description }}
          </p>

          <div
            class="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground"
          >
            <span class="font-mono">v{{ p.version }}</span>
            <span>{{ formatDate(p.installed_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="plugins.length === 0 && !loading"
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground"
        >
          <Puzzle class="size-6" />
        </div>
        <h3 class="mt-3 text-sm font-semibold text-foreground">
          Chưa có plugin nào được cài đặt
        </h3>
        <p class="mt-1 max-w-sm text-xs text-muted-foreground">
          Các plugin hệ thống được cấu hình và đăng ký tự động khi cài đặt
          Tuquet Cloud.
        </p>
      </div>
    </div>
  </div>
</template>

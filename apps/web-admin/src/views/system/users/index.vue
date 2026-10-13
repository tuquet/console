<script lang="ts" setup>
import type { PlatformUserItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Building2, Calendar, RefreshCw, Search, Users } from '@lucide/vue';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@tuquet/vue-ui';

import { getPlatformUsersApi } from '#/api';
import { useDateFormat } from '#/composables';

defineOptions({ name: 'SystemUsers' });

const { formatDate } = useDateFormat();

const loading = ref(true);
const users = ref<PlatformUserItem[]>([]);
const searchQuery = ref('');

async function loadUsers() {
  loading.value = true;
  try {
    users.value = await getPlatformUsersApi({
      search: searchQuery.value.trim() || undefined,
    });
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải danh sách người dùng nền tảng');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadUsers();
}

function getInitials(name: null | string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

onMounted(() => {
  loadUsers();
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
          Người Dùng Nền Tảng
        </h1>
        <Badge variant="secondary" class="text-xs uppercase font-medium">
          Superadmin Directory
        </Badge>
        <span v-if="!loading" class="text-xs font-medium text-muted-foreground">
          ({{ users.length }} tài khoản)
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="loadUsers"
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

    <!-- Search Toolbar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="searchQuery"
          placeholder="Tìm theo họ tên hoặc định danh UUID..."
          class="pl-9"
          @keydown.enter="handleSearch"
        />
      </div>
      <Button variant="secondary" size="sm" @click="handleSearch">
        Tìm kiếm
      </Button>
    </div>

    <!-- Desktop Table View -->
    <div
      class="hidden overflow-hidden rounded-xl border border-border/60 bg-card md:block"
    >
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="w-[300px]">Người dùng</TableHead>
            <TableHead>Định danh UUID</TableHead>
            <TableHead>Workspaces</TableHead>
            <TableHead>Ngày tham gia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 5" :key="i">
              <TableCell colspan="4" class="h-12 text-center">
                <div
                  class="mx-auto h-4 w-48 animate-pulse rounded bg-muted"
                ></div>
              </TableCell>
            </TableRow>
          </template>

          <template v-else-if="users.length === 0">
            <TableRow>
              <TableCell colspan="4" class="h-44 text-center">
                <div
                  class="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  <Users class="size-8 stroke-[1.5]" />
                  <p class="text-sm font-medium">
                    Không tìm thấy người dùng nào
                  </p>
                  <p class="text-xs text-muted-foreground/80">
                    Thử tìm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow
              v-for="user in users"
              :key="user.id"
              class="transition-colors hover:bg-muted/40"
            >
              <TableCell>
                <div class="flex items-center gap-3">
                  <Avatar class="size-9 rounded-lg border border-border/40">
                    <AvatarImage
                      v-if="user.avatar_url"
                      :src="user.avatar_url"
                      :alt="user.full_name || ''"
                    />
                    <AvatarFallback class="rounded-lg text-xs font-semibold">
                      {{ getInitials(user.full_name) }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex flex-col">
                    <span class="font-medium text-foreground">
                      {{ user.full_name || 'Người dùng ẩn danh' }}
                    </span>
                    <span
                      v-if="user.email"
                      class="text-xs text-muted-foreground"
                    >
                      {{ user.email }}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code
                  class="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                >
                  {{ user.id }}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="gap-1 font-normal text-xs">
                  <Building2 class="size-3 text-muted-foreground" />
                  {{ user.tenant_count }} tổ chức
                </Badge>
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ formatDate(user.created_at) }}
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
          class="h-28 animate-pulse rounded-xl border border-border/60 bg-card p-4"
        ></div>
      </template>

      <template v-else-if="users.length === 0">
        <div
          class="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground"
        >
          <Users class="size-8 stroke-[1.5]" />
          <p class="text-sm font-medium">Không tìm thấy người dùng</p>
        </div>
      </template>

      <template v-else>
        <div
          v-for="user in users"
          :key="user.id"
          class="rounded-xl border border-border/60 bg-card p-4 space-y-3"
        >
          <div class="flex items-center gap-3">
            <Avatar class="size-10 rounded-lg border border-border/40">
              <AvatarImage
                v-if="user.avatar_url"
                :src="user.avatar_url"
                :alt="user.full_name || ''"
              />
              <AvatarFallback class="rounded-lg text-xs font-semibold">
                {{ getInitials(user.full_name) }}
              </AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-foreground truncate">
                {{ user.full_name || 'Người dùng ẩn danh' }}
              </h3>
              <p
                v-if="user.email"
                class="text-xs text-muted-foreground truncate"
              >
                {{ user.email }}
              </p>
            </div>
          </div>

          <div
            class="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40"
          >
            <span class="flex items-center gap-1">
              <Building2 class="size-3.5 text-muted-foreground" />
              {{ user.tenant_count }} tổ chức
            </span>
            <span class="flex items-center gap-1 text-xs">
              <Calendar class="size-3 text-muted-foreground" />
              {{ formatDate(user.created_at) }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

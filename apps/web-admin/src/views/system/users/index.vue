<script lang="ts" setup>
import type { PlatformUserItem } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ArrowUpRight,
  Building2,
  Check,
  Copy,
  Eye,
  RefreshCw,
  ShieldCheck,
  Users,
} from '@lucide/vue';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  toast,
} from '@tuquet/vue-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { filterPlatformUsers, getPlatformUsersApi } from '#/api';
import RoleBadge from '#/components/iam/role-badge.vue';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

defineOptions({ name: 'SystemUsers' });

const router = useRouter();
const { formatDate } = useDateFormat();

const allUsers = ref<PlatformUserItem[]>([]);
const usersLoaded = ref(false);
const loadingUsers = ref(false);
const selectedUser = ref<null | PlatformUserItem>(null);
const detailOpen = ref(false);
const copiedId = ref<null | string>(null);

let loadUsersPromise: null | Promise<void> = null;

async function ensureUsersLoaded(force = false): Promise<void> {
  if (usersLoaded.value && !force) {
    return;
  }
  if (loadUsersPromise && !force) {
    return loadUsersPromise;
  }

  loadingUsers.value = true;
  loadUsersPromise = (async () => {
    try {
      allUsers.value = await getPlatformUsersApi();
      usersLoaded.value = true;
    } finally {
      loadingUsers.value = false;
      loadUsersPromise = null;
    }
  })();

  return loadUsersPromise;
}

const activeOrgUsersCount = computed(
  () => allUsers.value.filter((u) => u.tenant_count > 0).length,
);
const unassignedUsersCount = computed(
  () => allUsers.value.filter((u) => u.tenant_count === 0).length,
);

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

async function handleCopyId(id: string) {
  try {
    await navigator.clipboard.writeText(id);
    copiedId.value = id;
    toast.success('Đã sao chép mã định danh UUID');
    setTimeout(() => {
      if (copiedId.value === id) {
        copiedId.value = null;
      }
    }, 1800);
  } catch {
    toast.error('Không thể sao chép UUID');
  }
}

function openUserDetail(user: PlatformUserItem) {
  selectedUser.value = user;
  detailOpen.value = true;
}

function navigateToWorkspace(tenantId: string) {
  if (!tenantId) return;
  detailOpen.value = false;
  router.push(`/tenants/${tenantId}`);
}

const [Grid, gridApi] = useVbenVxeGrid<PlatformUserItem>({
  separator: false,
  formOptions: {
    schema: [
      {
        component: 'Select',
        fieldName: 'tenant_filter',
        label: 'Tổ chức',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả người dùng',
          options: [
            { label: 'Tất cả người dùng', value: 'all' },
            { label: 'Đã tham gia tổ chức', value: 'has_tenants' },
            { label: 'Chưa có tổ chức', value: 'no_tenants' },
          ],
        },
      },
      {
        component: 'Select',
        fieldName: 'role_filter',
        label: 'Vai trò',
        defaultValue: 'all',
        componentProps: {
          placeholder: 'Tất cả vai trò',
          options: [
            { label: 'Tất cả vai trò', value: 'all' },
            { label: 'Owner', value: 'owner' },
            { label: 'Admin', value: 'admin' },
            { label: 'Member', value: 'member' },
            { label: 'Viewer', value: 'viewer' },
          ],
        },
      },
      {
        component: 'Input',
        fieldName: 'search',
        label: 'Tìm kiếm',
        componentProps: {
          placeholder: 'Tìm theo tên, email, UUID hoặc workspace...',
        },
      },
    ],
    layout: 'vertical',
    showCollapseButton: false,
    submitOnChange: true,
    submitOnEnter: true,
    submitButtonOptions: {
      content: $t('common.filter'),
    },
    resetButtonOptions: {
      content: $t('common.reset'),
    },
    actionWrapperClass: 'flex items-center justify-end gap-2',
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
  },
  gridOptions: {
    border: false,
    round: true,
    showOverflow: true,
    cellConfig: {
      height: 58,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    pagerConfig: {
      pageSize: 15,
      pageSizes: [10, 15, 30, 50],
    },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async (
          { page }: { page?: { currentPage?: number; pageSize?: number } },
          formValues: Record<string, any>,
        ) => {
          await ensureUsersLoaded();

          const filtered = filterPlatformUsers(allUsers.value, {
            role_filter: formValues?.role_filter,
            search: formValues?.search,
            tenant_filter: formValues?.tenant_filter,
          });

          const currentPage = page?.currentPage || 1;
          const pageSize = page?.pageSize || 15;
          const start = (currentPage - 1) * pageSize;
          const end = start + pageSize;
          return {
            items: filtered.slice(start, end),
            total: filtered.length,
          };
        },
      },
    },
    columns: [
      {
        field: 'full_name',
        title: 'Người dùng',
        minWidth: 250,
        align: 'left',
        slots: { default: 'user-cell' },
      },
      {
        field: 'primary_role',
        title: 'Vai trò chính',
        width: 140,
        align: 'left',
        slots: { default: 'role-cell' },
      },
      {
        field: 'tenant_count',
        title: 'Tổ chức tham gia',
        minWidth: 210,
        align: 'left',
        slots: { default: 'tenant-cell' },
      },
      {
        field: 'id',
        title: 'Mã định danh',
        width: 175,
        align: 'left',
        slots: { default: 'id-cell' },
      },
      {
        field: 'created_at',
        title: 'Ngày tham gia',
        width: 150,
        align: 'left',
        slots: { default: 'date-cell' },
      },
      {
        field: 'actions',
        title: 'Thao tác',
        width: 110,
        align: 'right',
        slots: { default: 'actions-cell' },
      },
    ],
  },
});

async function handleRefresh() {
  await ensureUsersLoaded(true);
  gridApi.reload();
}
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-1">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.system.users') }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ $t('page.system.users_desc') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="loadingUsers"
          :title="$t('common.refresh')"
          @click="handleRefresh"
          class="gap-1.5"
        >
          <RefreshCw
            class="size-3.5 text-muted-foreground"
            :class="{ 'animate-spin': loadingUsers }"
          />
          {{ $t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Main Container: Stats Bar + VXE Grid -->
    <div
      class="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-border/60 bg-card p-0 sm:p-5 shadow-none sm:shadow-xs space-y-3"
    >
      <!-- Stats Bar -->
      <div
        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3 px-3 sm:px-0 pt-2 sm:pt-0 text-xs"
      >
        <div class="flex items-center gap-2">
          <Users class="size-4 shrink-0 text-muted-foreground" />
          <span class="text-sm font-semibold text-foreground">
            Danh bạ người dùng
          </span>
          <span class="text-muted-foreground">
            · {{ allUsers.length }} tổng số
          </span>
        </div>

        <div class="flex items-center gap-3 text-muted-foreground">
          <span>{{ activeOrgUsersCount }} đã tham gia tổ chức</span>
          <span>&bull;</span>
          <span>{{ unassignedUsersCount }} chưa có tổ chức</span>
        </div>
      </div>

      <!-- VXE Grid Table -->
      <Grid class="users-vxe-grid">
        <template #user-cell="{ row }">
          <div class="flex items-center gap-3">
            <Avatar class="size-9 rounded-lg border border-border/50 shrink-0">
              <AvatarImage
                v-if="row.avatar_url"
                :src="row.avatar_url"
                :alt="row.full_name || ''"
              />
              <AvatarFallback
                class="rounded-lg bg-muted text-xs font-semibold text-foreground"
              >
                {{ getInitials(row.full_name) }}
              </AvatarFallback>
            </Avatar>
            <div class="flex flex-col text-left min-w-0 leading-snug">
              <span class="text-xs font-semibold text-foreground truncate">
                {{ row.full_name || 'Người dùng ẩn danh' }}
              </span>
              <span class="text-xs text-muted-foreground truncate">
                {{ row.email || 'Chưa cập nhật email' }}
              </span>
            </div>
          </div>
        </template>

        <template #role-cell="{ row }">
          <RoleBadge
            v-if="row.primary_role"
            :role="row.primary_role"
            :uppercase="true"
          />
          <span v-else class="text-xs text-muted-foreground">Chưa gán</span>
        </template>

        <template #tenant-cell="{ row }">
          <div class="flex items-center gap-2 min-w-0">
            <Badge
              :variant="row.tenant_count > 0 ? 'outline' : 'secondary'"
              class="shrink-0 gap-1 font-normal text-xs"
            >
              <Building2 class="size-3 text-muted-foreground shrink-0" />
              <span>{{ row.tenant_count }} tổ chức</span>
            </Badge>
            <span
              v-if="row.workspaces?.[0]?.tenant_name"
              class="truncate text-xs text-muted-foreground"
              :title="row.workspaces[0].tenant_name"
            >
              {{ row.workspaces[0].tenant_name }}
            </span>
          </div>
        </template>

        <template #id-cell="{ row }">
          <div class="inline-flex items-center gap-1">
            <code
              class="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
              :title="row.id"
            >
              {{ row.id.slice(0, 8) }}...{{ row.id.slice(-4) }}
            </code>
            <Button
              variant="ghost"
              size="icon"
              class="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              title="Sao chép UUID"
              @click.stop="handleCopyId(row.id)"
            >
              <Check v-if="copiedId === row.id" class="size-3.5 text-success" />
              <Copy v-else class="size-3.5" />
            </Button>
          </div>
        </template>

        <template #date-cell="{ row }">
          <span class="font-mono text-xs text-muted-foreground">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs inline-flex items-center gap-1"
              @click="openUserDetail(row as PlatformUserItem)"
            >
              <Eye class="size-3 shrink-0" />
              <span>{{ $t('common.detail') }}</span>
            </Button>
          </div>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
          >
            <Users class="size-10 stroke-[1.5] text-muted-foreground/60 mb-3" />
            <p class="text-sm font-medium text-foreground">
              Không tìm thấy người dùng phù hợp
            </p>
            <p class="text-xs text-muted-foreground max-w-sm mt-1">
              Thử thay đổi bộ lọc trạng thái tổ chức, vai trò hoặc từ khóa tìm
              kiếm.
            </p>
          </div>
        </template>
      </Grid>
    </div>

    <!-- Enterprise User Inspector Dialog -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base">
            <ShieldCheck class="size-4 text-primary" />
            Hồ sơ định danh người dùng
          </DialogTitle>
          <DialogDescription class="text-xs">
            Thông tin tài khoản gốc và danh sách không gian làm việc liên kết
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedUser" class="space-y-4 text-xs">
          <!-- Identity Card -->
          <div
            class="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
          >
            <div class="flex items-center gap-3 min-w-0">
              <Avatar
                class="size-11 rounded-xl border border-border/40 shrink-0"
              >
                <AvatarImage
                  v-if="selectedUser.avatar_url"
                  :src="selectedUser.avatar_url"
                  :alt="selectedUser.full_name || ''"
                />
                <AvatarFallback
                  class="rounded-xl bg-muted text-sm font-semibold text-foreground"
                >
                  {{ getInitials(selectedUser.full_name) }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0 space-y-0.5">
                <div class="text-sm font-semibold text-foreground truncate">
                  {{ selectedUser.full_name || 'Người dùng ẩn danh' }}
                </div>
                <div class="text-xs text-muted-foreground truncate">
                  {{ selectedUser.email || 'Chưa cập nhật email' }}
                </div>
                <div class="flex items-center gap-1.5 pt-1">
                  <code
                    class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {{ selectedUser.id }}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-5 text-muted-foreground hover:text-foreground"
                    title="Sao chép UUID"
                    @click="handleCopyId(selectedUser.id)"
                  >
                    <Check
                      v-if="copiedId === selectedUser.id"
                      class="size-3 text-success"
                    />
                    <Copy v-else class="size-3" />
                  </Button>
                </div>
              </div>
            </div>

            <RoleBadge
              v-if="selectedUser.primary_role"
              :role="selectedUser.primary_role"
            />
          </div>

          <!-- Metadata Grid -->
          <div
            class="grid grid-cols-2 gap-3 rounded-xl border border-border/60 p-3.5"
          >
            <div>
              <div class="text-muted-foreground">Ngày tham gia</div>
              <div class="mt-0.5 font-mono font-medium text-foreground">
                {{ formatDate(selectedUser.created_at) }}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground">Cập nhật gần nhất</div>
              <div class="mt-0.5 font-mono font-medium text-foreground">
                {{ formatDate(selectedUser.updated_at) }}
              </div>
            </div>
          </div>

          <!-- Workspaces Membership List -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="font-semibold text-foreground">
                Tổ chức tham gia ({{ selectedUser.tenant_count }})
              </h4>
            </div>

            <div
              v-if="
                selectedUser.workspaces && selectedUser.workspaces.length > 0
              "
              class="max-h-56 space-y-2 overflow-y-auto pr-1"
            >
              <div
                v-for="ws in selectedUser.workspaces"
                :key="ws.tenant_id"
                class="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card p-3"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground shrink-0"
                  >
                    <Building2 class="size-4" />
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium text-foreground truncate">
                      {{ ws.tenant_name }}
                    </div>
                    <div
                      class="font-mono text-[11px] text-muted-foreground truncate"
                    >
                      /{{ ws.tenant_slug || ws.tenant_id.slice(0, 8) }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <RoleBadge :role="ws.role_name" />
                  <Button
                    v-if="ws.tenant_id"
                    variant="outline"
                    size="sm"
                    class="h-7 px-2 text-xs gap-1"
                    @click="navigateToWorkspace(ws.tenant_id)"
                  >
                    <span>Mở</span>
                    <ArrowUpRight class="size-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div
              v-else-if="selectedUser.tenant_count > 0"
              class="rounded-lg border border-border/60 bg-muted/10 p-4 text-center text-muted-foreground"
            >
              Người dùng đang là thành viên của
              <strong class="text-foreground">{{
                selectedUser.tenant_count
              }}</strong>
              tổ chức trên hệ thống.
            </div>

            <div
              v-else
              class="rounded-lg border border-border/60 bg-muted/10 p-4 text-center text-muted-foreground"
            >
              Tài khoản này chưa tham gia vào bất kỳ tổ chức nào.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

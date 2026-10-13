<script lang="ts" setup>
import type { TenantItem, WorkspaceSubscription } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Check,
  Copy,
  Cpu,
  CreditCard,
  Edit2,
  ExternalLink,
  Layers,
  Terminal,
  Trash2,
} from '@lucide/vue';
import { Badge, Button, toast } from '@tuquet/vue-ui';

import { useDateFormat } from '#/composables';

interface Props {
  activeDevicesCount: number;
  isCurrentActive: boolean;
  membersCount: number;
  subscription: null | WorkspaceSubscription;
  tenant: TenantItem;
  totalDevicesCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  connectCli: [];
  deleteWorkspace: [];
  editWorkspace: [];
  setActive: [];
}>();

const router = useRouter();
const { formatDateOnly } = useDateFormat();
const copiedId = ref(false);

async function copyTenantId() {
  try {
    await navigator.clipboard.writeText(props.tenant.id);
    copiedId.value = true;
    toast.success('Đã sao chép Tenant ID');
    setTimeout(() => {
      copiedId.value = false;
    }, 2000);
  } catch {
    toast.error('Không thể sao chép ID');
  }
}

function navigateToFleet() {
  router.push(`/fleet/devices?tenant=${props.tenant.id}`);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Grid Cards Overview -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Card 1: Identity & Metadata -->
      <div
        class="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
      >
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-muted-foreground"
              >Định Danh Tổ Chức</span
            >
            <Layers class="size-4 text-muted-foreground" />
          </div>
          <div class="mt-3">
            <div class="text-sm font-semibold text-foreground">
              {{ tenant.name }}
            </div>
            <div class="mt-1 font-mono text-xs text-muted-foreground">
              {{ tenant.slug }}
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-border/40 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">Tenant ID:</span>
            <button
              class="flex items-center gap-1 font-mono text-xs hover:text-foreground text-muted-foreground transition-colors"
              title="Nhấn để sao chép Tenant ID"
              @click="copyTenantId"
            >
              <span
                >{{ tenant.id.slice(0, 8) }}...{{ tenant.id.slice(-4) }}</span
              >
              <Check v-if="copiedId" class="size-3 text-success" />
              <Copy v-else class="size-3" />
            </button>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">Ngày tạo:</span>
            <span class="text-foreground">{{
              formatDateOnly(tenant.created_at)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Runner Fleet Status -->
      <div
        class="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
      >
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-muted-foreground"
              >Hạ Tầng Runner Devices</span
            >
            <Cpu class="size-4 text-muted-foreground" />
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-2xl font-bold tracking-tight text-foreground">
              {{ activeDevicesCount }}
            </span>
            <span class="text-xs text-muted-foreground">
              / {{ totalDevicesCount }} máy trực tuyến
            </span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            class="w-full text-xs h-8 flex items-center justify-center gap-1.5"
            @click="navigateToFleet"
          >
            <span>Quản Lý Fleet Devices</span>
            <ExternalLink class="size-3.5" />
          </Button>
        </div>
      </div>

      <!-- Card 3: Subscription & Quota Tier -->
      <div
        class="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
      >
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-muted-foreground"
              >Gói Thuê Bao Hiện Tại</span
            >
            <CreditCard class="size-4 text-muted-foreground" />
          </div>
          <div class="mt-3 flex items-center gap-2">
            <Badge variant="default" class="text-xs uppercase font-medium">
              {{ subscription?.plan?.name || 'Free Starter' }}
            </Badge>
            <span class="text-xs text-muted-foreground">
              ${{ subscription?.plan?.price_monthly_usd || 0 }}/tháng
            </span>
          </div>
        </div>

        <div
          class="mt-4 pt-3 border-t border-border/40 text-xs flex justify-between items-center text-muted-foreground"
        >
          <span>Trạng thái subscription:</span>
          <Badge variant="outline" class="text-xs capitalize">
            {{ subscription?.status || 'Active' }}
          </Badge>
        </div>
      </div>
    </div>

    <!-- Quick Operations Card -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
    >
      <div
        class="text-xs font-semibold text-foreground uppercase tracking-wider mb-3"
      >
        Thao Tác Quản Trị
      </div>
      <div class="flex flex-wrap gap-2.5">
        <Button
          size="sm"
          :variant="isCurrentActive ? 'secondary' : 'default'"
          class="h-8 text-xs flex items-center gap-1.5"
          @click="emit('setActive')"
        >
          <Check class="size-3.5" />
          <span>{{
            isCurrentActive
              ? 'Đang Là Workspace Mặc Định'
              : 'Đặt Làm Workspace CLI'
          }}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs flex items-center gap-1.5"
          @click="emit('connectCli')"
        >
          <Terminal class="size-3.5" />
          <span>Ghép Nối Máy Trạm</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs flex items-center gap-1.5"
          @click="emit('editWorkspace')"
        >
          <Edit2 class="size-3.5" />
          <span>Chỉnh Sửa Tên & Slug</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          class="h-8 text-xs flex items-center gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
          @click="emit('deleteWorkspace')"
        >
          <Trash2 class="size-3.5" />
          <span>Lưu Trữ / Xóa</span>
        </Button>
      </div>
    </div>
  </div>
</template>

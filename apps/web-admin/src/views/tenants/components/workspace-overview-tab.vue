<script lang="ts" setup>
import type { TenantItem, WorkspaceSubscription } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Layers,
  Terminal,
  Trash2,
} from '@lucide/vue';
import { Badge, Button, toast } from '@tuquet/vue-ui';

import { VxeForm, VxeFormItem } from '#/adapter/vxe-table';
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
  router.push(`/automation/devices?tenant=${props.tenant.id}`);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Workspace Detail Specifications Form (VXE UI Form) -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-4"
    >
      <div
        class="flex items-center justify-between border-b border-border/40 pb-3"
      >
        <div class="flex items-center gap-2">
          <Layers class="size-4 text-muted-foreground" />
          <h2 class="text-sm font-semibold text-foreground">
            Chi tiết workspace
          </h2>
        </div>
        <Badge variant="outline" class="text-xs font-normal">
          <span
            class="mr-1.5 size-1.5 rounded-full"
            :class="
              tenant.status === 'active' ? 'bg-success' : 'bg-muted-foreground'
            "
          ></span>
          {{ tenant.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng' }}
        </Badge>
      </div>

      <VxeForm
        :data="tenant"
        custom-layout
        readonly
        size="small"
        class="w-full"
      >
        <VxeFormItem title="Tên workspace" span="12" class="sm:col-span-6">
          <template #default>
            <span class="font-semibold text-foreground text-sm">{{
              tenant.name
            }}</span>
          </template>
        </VxeFormItem>

        <VxeFormItem title="Mã slug" span="12" class="sm:col-span-6">
          <template #default>
            <span class="font-mono text-xs text-muted-foreground">{{
              tenant.slug
            }}</span>
          </template>
        </VxeFormItem>

        <VxeFormItem title="Tenant ID" span="12" class="sm:col-span-6">
          <template #default>
            <div
              class="flex items-center gap-2 font-mono text-xs text-foreground"
            >
              <span>{{ tenant.id }}</span>
              <button
                type="button"
                class="size-5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                title="Sao chép Tenant ID"
                @click="copyTenantId"
              >
                <Check v-if="copiedId" class="size-3 text-success" />
                <Copy v-else class="size-3" />
              </button>
            </div>
          </template>
        </VxeFormItem>

        <VxeFormItem title="Ngày khởi tạo" span="12" class="sm:col-span-6">
          <template #default>
            <span class="text-xs text-foreground">{{
              formatDateOnly(tenant.created_at)
            }}</span>
          </template>
        </VxeFormItem>

        <VxeFormItem title="Gói dịch vụ" span="12" class="sm:col-span-6">
          <template #default>
            <div class="flex items-center gap-2">
              <Badge variant="default" class="text-xs font-medium">
                {{ subscription?.plan?.name || 'Free Starter' }}
              </Badge>
              <span class="text-xs text-muted-foreground font-mono">
                ${{ subscription?.plan?.price_monthly_usd || 0 }}/tháng
              </span>
            </div>
          </template>
        </VxeFormItem>

        <VxeFormItem title="Hạ tầng thiết bị" span="12" class="sm:col-span-6">
          <template #default>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-foreground text-sm font-mono">{{
                activeDevicesCount
              }}</span>
              <span class="text-xs text-muted-foreground"
                >/ {{ totalDevicesCount }} máy trực tuyến</span
              >
              <Button
                variant="ghost"
                size="sm"
                class="h-6 px-2 text-xs ml-auto gap-1 text-primary hover:text-primary"
                @click="navigateToFleet"
              >
                <span>Xem thiết bị</span>
                <ExternalLink class="size-3" />
              </Button>
            </div>
          </template>
        </VxeFormItem>
      </VxeForm>
    </div>

    <!-- Quick Operations Card -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
    >
      <h3 class="text-xs font-semibold text-foreground mb-3">
        Thao tác quản trị
      </h3>
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
              ? 'Đang là workspace mặc định'
              : 'Đặt làm workspace CLI'
          }}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs flex items-center gap-1.5"
          @click="emit('connectCli')"
        >
          <Terminal class="size-3.5" />
          <span>Kết nối thiết bị</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs flex items-center gap-1.5"
          @click="emit('editWorkspace')"
        >
          <Edit2 class="size-3.5" />
          <span>Chỉnh sửa tên & slug</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          class="h-8 text-xs flex items-center gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
          @click="emit('deleteWorkspace')"
        >
          <Trash2 class="size-3.5" />
          <span>Lưu trữ / xóa</span>
        </Button>
      </div>
    </div>
  </div>
</template>

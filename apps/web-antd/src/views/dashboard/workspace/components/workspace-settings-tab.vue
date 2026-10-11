<script lang="ts" setup>
import type { WorkspaceApiKey } from '#/api';

import { Check, Copy, KeyRound, Plus } from '@lucide/vue';
import { Button, Popconfirm, Table } from 'ant-design-vue';

import CliSnippetCard from '#/components/common/cli-snippet-card.vue';
import DangerZoneCard from '#/components/common/danger-zone-card.vue';
import RoleBadge from '#/components/iam/role-badge.vue';
import { useClipboard, useDateFormat } from '#/composables';

interface Props {
  apiKeys: WorkspaceApiKey[];
  tenantId: string;
  tenantSlug: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  createKey: [];
  deleteWorkspace: [];
  revokeKey: [keyId: string];
}>();

const { copyToClipboard, isCopied } = useClipboard();
const { formatDate } = useDateFormat();

const apiKeyColumns = [
  { key: 'name', title: 'Tên Khóa & ID' },
  { key: 'key_prefix', title: 'Tiền Tố Token' },
  { key: 'role', title: 'Quyền Hạn' },
  { key: 'created_at', title: 'Thời Gian Tạo / Hạn' },
  { key: 'action', title: 'Thao Tác', width: 100 },
];
</script>

<template>
  <div class="space-y-6 pt-2">
    <div>
      <h3 class="text-base font-semibold text-foreground">
        Thông Số Kỹ Thuật & Khóa Kết Nối
      </h3>
      <p class="text-xs text-muted-foreground">
        Sử dụng các thông số này để cấu hình Specter CLI và CI/CD Automation
      </p>
    </div>

    <!-- Section 1: Specs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Field 1: Workspace ID -->
      <div class="rounded-xl border border-border/60 bg-muted/10 p-4">
        <label
          class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          WORKSPACE ID (TENANT ID)
        </label>
        <div class="mt-1 flex items-center justify-between gap-2">
          <span class="font-mono text-sm text-foreground truncate">
            {{ props.tenantId }}
          </span>
          <Button
            size="small"
            class="flex items-center gap-1 shrink-0"
            @click="copyToClipboard(props.tenantId, 'Tenant ID')"
          >
            <Check
              v-if="isCopied('Tenant ID')"
              class="size-3.5 text-green-500"
            />
            <Copy v-else class="size-3.5" />
            <span>Sao chép</span>
          </Button>
        </div>
      </div>

      <!-- Field 2: Slug -->
      <div class="rounded-xl border border-border/60 bg-muted/10 p-4">
        <label
          class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          WORKSPACE SLUG
        </label>
        <div class="mt-1 flex items-center justify-between gap-2">
          <span class="font-mono text-sm text-foreground">
            {{ props.tenantSlug }}
          </span>
          <Button
            size="small"
            class="flex items-center gap-1 shrink-0"
            @click="copyToClipboard(props.tenantSlug, 'Slug')"
          >
            <Check v-if="isCopied('Slug')" class="size-3.5 text-green-500" />
            <Copy v-else class="size-3.5" />
            <span>Sao chép</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Section 2: CLI Command -->
    <CliSnippetCard
      :command="`tuquet login --tenant-id=${props.tenantId}`"
      label="LỆNH KẾT NỐI SPECTER CLI TRỰC TIẾP"
      copied-label="CLI Command"
    />

    <!-- Section 3: Headless API Keys -->
    <div class="border-t border-border/60 pt-6 space-y-4">
      <div
        class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
      >
        <div>
          <div class="flex items-center gap-2">
            <KeyRound class="size-4.5 text-amber-400" />
            <h3 class="text-base font-semibold text-foreground">
              Khóa API & Headless Tokens ({{ props.apiKeys.length }})
            </h3>
          </div>
          <p class="text-xs text-muted-foreground">
            Cung cấp quyền truy cập bảo mật cho CI/CD pipelines, GitHub Actions
            và runner automation
          </p>
        </div>
        <Button
          type="primary"
          class="flex items-center justify-center gap-1.5"
          @click="emit('createKey')"
        >
          <Plus class="size-4" />
          <span>Tạo API Key Mới</span>
        </Button>
      </div>

      <!-- Desktop Table (md:block) -->
      <div class="hidden md:block">
        <Table
          :columns="apiKeyColumns"
          :data-source="props.apiKeys"
          row-key="id"
          :pagination="false"
          :locale="{
            emptyText: 'Chưa có API Key nào. Hãy tạo khóa để tích hợp CI/CD.',
          }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="font-medium text-foreground">{{ record.name }}</div>
              <div class="text-xs font-mono text-muted-foreground">
                ID: {{ record.id.slice(0, 8) }}...
              </div>
            </template>

            <template v-else-if="column.key === 'key_prefix'">
              <div class="flex items-center gap-2">
                <code
                  class="rounded bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
                >
                  {{ record.key_prefix }}
                </code>
                <Button
                  type="text"
                  size="small"
                  class="p-0 size-6 text-muted-foreground hover:text-foreground"
                  @click="copyToClipboard(record.key_prefix, record.name)"
                >
                  <Check
                    v-if="isCopied(record.name)"
                    class="size-3 text-green-500"
                  />
                  <Copy v-else class="size-3" />
                </Button>
              </div>
            </template>

            <template v-else-if="column.key === 'role'">
              <RoleBadge :role="record.role" />
            </template>

            <template v-else-if="column.key === 'created_at'">
              <div class="text-xs text-muted-foreground">
                {{ formatDate(record.created_at) }}
              </div>
              <div class="text-[11px] text-muted-foreground/70">
                {{
                  record.expires_at
                    ? `Hạn: ${formatDate(record.expires_at)}`
                    : 'Vĩnh viễn (Không hết hạn)'
                }}
              </div>
            </template>

            <template v-else-if="column.key === 'action'">
              <Popconfirm
                title="Bạn có chắc chắn muốn thu hồi khóa API này không?"
                ok-text="Thu Hồi"
                cancel-text="Hủy"
                @confirm="emit('revokeKey', record.id)"
              >
                <Button danger type="link" size="small" class="p-0">
                  Thu Hồi
                </Button>
              </Popconfirm>
            </template>
          </template>
        </Table>
      </div>

      <!-- Mobile Card List (md:hidden) -->
      <div class="space-y-3 md:hidden">
        <div
          v-if="props.apiKeys.length === 0"
          class="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground"
        >
          Chưa có API key nào. Nhấn "Tạo API Key Mới" để bắt đầu.
        </div>
        <div
          v-for="keyItem in props.apiKeys"
          :key="keyItem.id"
          class="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium text-foreground text-sm">
              {{ keyItem.name }}
            </span>
            <RoleBadge :role="keyItem.role" />
          </div>
          <div
            class="flex items-center justify-between rounded bg-black/40 px-2.5 py-1.5"
          >
            <code class="font-mono text-xs text-sky-300">
              {{ keyItem.key_prefix }}
            </code>
            <Button
              type="text"
              size="small"
              class="p-0 size-5 text-sky-300"
              @click="copyToClipboard(keyItem.key_prefix, keyItem.name)"
            >
              <Check
                v-if="isCopied(keyItem.name)"
                class="size-3 text-green-500"
              />
              <Copy v-else class="size-3" />
            </Button>
          </div>
          <div
            class="flex items-center justify-between border-t border-border/30 pt-1 text-xs text-muted-foreground"
          >
            <span>Tạo: {{ formatDate(keyItem.created_at) }}</span>
            <Popconfirm
              title="Thu hồi khóa API này?"
              ok-text="Thu Hồi"
              cancel-text="Hủy"
              @confirm="emit('revokeKey', keyItem.id)"
            >
              <Button danger type="link" size="small" class="p-0 text-xs">
                Thu Hồi
              </Button>
            </Popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Danger Zone -->
    <DangerZoneCard
      button-text="Xóa Hoặc Lưu Trữ Workspace"
      description="Xóa hoặc lưu trữ không gian làm việc này sẽ ngắt toàn bộ phiên kết nối máy trạm và vô hiệu hóa tất cả API keys liên quan."
      @trigger="emit('deleteWorkspace')"
    />
  </div>
</template>

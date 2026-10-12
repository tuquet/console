<script lang="ts" setup>
import type { WorkspaceApiKey } from '#/api';

import { Check, Copy, KeyRound, Plus } from '@lucide/vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tuquet/vue-ui';

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
</script>

<template>
  <div class="space-y-5 pt-1">
    <h3 class="text-base font-semibold text-foreground">
      Thông Số & Khóa API
    </h3>

    <!-- Section 1: Specs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Field 1: Workspace ID -->
      <div class="rounded-xl border border-border/60 bg-muted/10 p-4">
        <label
          class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          WORKSPACE ID
        </label>
        <div class="mt-1 flex items-center justify-between gap-2">
          <span class="font-mono text-sm text-foreground truncate">
            {{ props.tenantId }}
          </span>
          <Button
            variant="outline"
            size="sm"
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
          MÃ SLUG
        </label>
        <div class="mt-1 flex items-center justify-between gap-2">
          <span class="font-mono text-sm text-foreground">
            {{ props.tenantSlug }}
          </span>
          <Button
            variant="outline"
            size="sm"
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
      label="LỆNH KẾT NỐI SPECTER CLI"
      copied-label="CLI Command"
    />

    <!-- Section 3: Headless API Keys -->
    <div class="border-t border-border/60 pt-6 space-y-4">
      <div
        class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
      >
        <div class="flex items-center gap-2">
          <KeyRound class="size-4.5 text-amber-400" />
          <h3 class="text-base font-semibold text-foreground">
            Khóa API ({{ props.apiKeys.length }})
          </h3>
        </div>
        <Button
          size="sm"
          class="h-8 gap-1.5 font-medium"
          @click="emit('createKey')"
        >
          <Plus class="size-3.5" />
          <span>Tạo API Key</span>
        </Button>
      </div>

      <!-- Desktop Table (md:block) -->
      <div
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Khóa</TableHead>
              <TableHead>Tiền Tố</TableHead>
              <TableHead>Quyền Hạn</TableHead>
              <TableHead>Ngày Tạo</TableHead>
              <TableHead class="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="record in props.apiKeys" :key="record.id">
              <TableCell>
                <div class="font-medium text-foreground">{{ record.name }}</div>
                <div class="text-xs font-mono text-muted-foreground">
                  ID: {{ record.id.slice(0, 8) }}...
                </div>
              </TableCell>

              <TableCell>
                <div class="flex items-center gap-2">
                  <code
                    class="rounded bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
                  >
                    {{ record.key_prefix }}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
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
              </TableCell>

              <TableCell>
                <RoleBadge :role="record.role" />
              </TableCell>

              <TableCell>
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
              </TableCell>

              <TableCell class="text-right">
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="p-0 h-auto text-destructive hover:text-destructive"
                    >
                      Thu Hồi
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Thu hồi khóa API này?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Khóa API "{{ record.name }}" sẽ bị vô hiệu hóa ngay lập
                        tức và không thể khôi phục.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction @click="emit('revokeKey', record.id)">
                        Thu Hồi
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>

            <TableRow v-if="props.apiKeys.length === 0">
              <TableCell
                colspan="5"
                class="h-24 text-center text-sm text-muted-foreground"
              >
                Chưa có API Key nào. Hãy tạo khóa để tích hợp CI/CD.
              </TableCell>
            </TableRow>
          </TableBody>
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
            class="flex items-center justify-between rounded bg-muted/60 border border-border/40 px-2.5 py-1.5"
          >
            <code class="font-mono text-xs text-foreground">
              {{ keyItem.key_prefix }}
            </code>
            <Button
              variant="ghost"
              size="icon"
              class="p-0 size-5 text-muted-foreground hover:text-foreground"
              @click="copyToClipboard(keyItem.key_prefix, keyItem.name)"
            >
              <Check
                v-if="isCopied(keyItem.name)"
                class="size-3 text-emerald-500"
              />
              <Copy v-else class="size-3" />
            </Button>
          </div>
          <div
            class="flex items-center justify-between border-t border-border/30 pt-1 text-xs text-muted-foreground"
          >
            <span>Tạo: {{ formatDate(keyItem.created_at) }}</span>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="p-0 h-auto text-xs text-destructive hover:text-destructive"
                >
                  Thu Hồi
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Thu hồi khóa API này?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Khóa API "{{ keyItem.name }}" sẽ bị vô hiệu hóa ngay lập
                    tức.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction @click="emit('revokeKey', keyItem.id)">
                    Thu Hồi
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

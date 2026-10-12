<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@tuquet/vue-ui';

interface Props {
  loading?: boolean;
  open: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (
    e: 'submit',
    payload: {
      expiresInDays: number;
      name: string;
      role: 'admin' | 'read_only';
    },
  ): void;
  (e: 'update:open', val: boolean): void;
}>();

const name = ref('');
const role = ref<'admin' | 'read_only'>('admin');
const expiresInDays = ref<number>(0);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = '';
      role.value = 'admin';
      expiresInDays.value = 0;
    }
  },
);

function handleOk() {
  if (!name.value.trim()) {
    toast.warning('Vui lòng nhập tên nhận diện cho khóa API');
    return;
  }
  emit('submit', {
    expiresInDays: Number(expiresInDays.value),
    name: name.value.trim(),
    role: role.value,
  });
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Tạo Khóa API Headless Mới</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Tên Nhận Diện Khóa (Purpose)
          </label>
          <Input
            v-model="name"
            placeholder="Ví dụ: GitHub Actions Deploy, Production Worker"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Quyền Hạn API (Scope)
          </label>
          <select
            v-model="role"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="admin">
              Full Access (Toàn quyền quản trị và đẩy job chạy)
            </option>
            <option value="read_only">
              Read Only (Chỉ đọc trạng thái và logs runner)
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Thời Gian Hiệu Lực
          </label>
          <select
            v-model.number="expiresInDays"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option :value="0">Không bao giờ hết hạn (Vĩnh viễn)</option>
            <option :value="30">30 Ngày</option>
            <option :value="60">60 Ngày</option>
            <option :value="90">90 Ngày</option>
            <option :value="365">365 Ngày (1 Năm)</option>
          </select>
        </div>
      </div>

      <DialogFooter class="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="outline"
          :disabled="props.loading"
          @click="emit('update:open', false)"
        >
          Hủy
        </Button>
        <Button :disabled="props.loading" @click="handleOk"> Tạo Khóa </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

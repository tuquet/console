<script lang="ts" setup>
import type {
  WorkspaceApiKey,
  WorkspaceDetailData,
  WorkspaceMember,
} from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft } from '@lucide/vue';
import { Button, message, Tabs } from 'ant-design-vue';

import {
  createWorkspaceApiKeyApi,
  deleteWorkspaceApi,
  getActiveTenantId,
  getWorkspaceDetailApi,
  inviteWorkspaceMemberApi,
  removeWorkspaceMemberApi,
  revokeWorkspaceApiKeyApi,
  setActiveTenantId,
  updateWorkspaceInfoApi,
  updateWorkspaceMemberApi,
} from '#/api';

import CreateApiKeyModal from './components/modals/create-api-key-modal.vue';
import DeleteWorkspaceModal from './components/modals/delete-workspace-modal.vue';
import EditMemberModal from './components/modals/edit-member-modal.vue';
import EditWorkspaceModal from './components/modals/edit-workspace-modal.vue';
import InviteMemberModal from './components/modals/invite-member-modal.vue';
import KeyCreatedModal from './components/modals/key-created-modal.vue';
import WorkspaceHero from './components/workspace-hero.vue';
import WorkspaceMembersTab from './components/workspace-members-tab.vue';
import WorkspaceQuotasTab from './components/workspace-quotas-tab.vue';
import WorkspaceSettingsTab from './components/workspace-settings-tab.vue';

defineOptions({ name: 'WorkspaceDetail' });

const route = useRoute();
const router = useRouter();

const tenantId = computed(() => (route.params.id as string) || '');
const loading = ref(true);
const detailData = ref<null | WorkspaceDetailData>(null);

// Active tenant state
const currentActiveTenantId = ref(getActiveTenantId());
const isCurrentActive = computed(
  () => currentActiveTenantId.value === tenantId.value,
);

// API Keys derived from metadata
const apiKeys = computed<WorkspaceApiKey[]>(() => {
  return detailData.value?.tenant?.metadata?.api_keys || [];
});

// Modals visibility & loading states
const isInviteModalVisible = ref(false);
const inviting = ref(false);

const isEditMemberModalVisible = ref(false);
const editingMember = ref<null | WorkspaceMember>(null);
const updatingMember = ref(false);

const isEditWorkspaceModalVisible = ref(false);
const updatingWorkspace = ref(false);

const isCreateKeyModalVisible = ref(false);
const creatingKey = ref(false);

const isKeyCreatedModalVisible = ref(false);
const generatedFullKey = ref('');

const isDeleteWorkspaceModalVisible = ref(false);
const deletingWorkspace = ref(false);

async function loadData() {
  if (!tenantId.value) return;
  loading.value = true;
  try {
    const data = await getWorkspaceDetailApi(tenantId.value);
    detailData.value = data;
  } catch (error: any) {
    message.error(error.message || 'Không thể tải chi tiết Workspace');
  } finally {
    loading.value = false;
  }
}

function handleSetActive() {
  if (!detailData.value) return;
  setActiveTenantId(detailData.value.tenant.id);
  currentActiveTenantId.value = detailData.value.tenant.id;
  message.success(
    `Đã chọn ${detailData.value.tenant.name} làm Workspace hoạt động chính!`,
  );
}

function handleConnectCli() {
  if (!detailData.value) return;
  router.push(
    `/auth/desktop?machine_name=Local Workstation&tenant_id=${encodeURIComponent(detailData.value.tenant.id)}`,
  );
}

async function handleInviteSubmit(payload: {
  email: string;
  role: 'admin' | 'developer' | 'member';
}) {
  inviting.value = true;
  try {
    await inviteWorkspaceMemberApi(tenantId.value, payload.email, payload.role);
    message.success(`Đã gửi lời mời tới ${payload.email}`);
    isInviteModalVisible.value = false;

    if (detailData.value) {
      detailData.value.members.push({
        avatar_url: null,
        email: payload.email,
        full_name: payload.email.split('@')[0],
        id: `inv-${Date.now()}`,
        joined_at: new Date().toISOString(),
        role: payload.role,
        status: 'invited',
        user_id: 'pending',
      });
      detailData.value.quota.used_members = detailData.value.members.length;
    }
  } catch (error: any) {
    message.error(error.message || 'Gửi lời mời thất bại');
  } finally {
    inviting.value = false;
  }
}

async function handleRemoveMember(member: WorkspaceMember) {
  if (member.role === 'owner') {
    message.warning('Không thể xóa chủ sở hữu (Owner) của Workspace');
    return;
  }

  try {
    await removeWorkspaceMemberApi(member.id);
    message.success(`Đã xóa thành viên ${member.email}`);
    if (detailData.value) {
      detailData.value.members = detailData.value.members.filter(
        (m) => m.id !== member.id,
      );
      detailData.value.quota.used_members = detailData.value.members.length;
    }
  } catch (error: any) {
    message.error(error.message || 'Xóa thành viên thất bại');
  }
}

function handleOpenEditMember(member: WorkspaceMember) {
  editingMember.value = member;
  isEditMemberModalVisible.value = true;
}

async function handleUpdateMemberSubmit(payload: {
  full_name: string;
  role: 'admin' | 'developer' | 'member' | 'owner' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
}) {
  if (!editingMember.value) return;
  updatingMember.value = true;
  try {
    await updateWorkspaceMemberApi({
      full_name: payload.full_name,
      memberId: editingMember.value.id,
      role: payload.role,
      status: payload.status,
      userId: editingMember.value.user_id,
    });

    if (detailData.value) {
      const idx = detailData.value.members.findIndex(
        (m) => m.id === editingMember.value?.id,
      );
      if (idx !== -1) {
        const current = detailData.value.members[idx];
        if (current) {
          current.full_name = payload.full_name;
          current.role = payload.role;
          current.status = payload.status;
        }
      }
    }
    message.success('Cập nhật thành viên thành công');
    isEditMemberModalVisible.value = false;
  } catch (error: any) {
    message.error(error.message || 'Cập nhật thành viên thất bại');
  } finally {
    updatingMember.value = false;
  }
}

async function handleUpdateWorkspaceSubmit(payload: {
  name: string;
  plan: string;
  slug: string;
}) {
  updatingWorkspace.value = true;
  try {
    const updated = await updateWorkspaceInfoApi(tenantId.value, payload);
    if (detailData.value) {
      detailData.value.tenant = updated;
    }
    message.success('Cập nhật Workspace thành công');
    isEditWorkspaceModalVisible.value = false;
  } catch (error: any) {
    message.error(error.message || 'Cập nhật Workspace thất bại');
  } finally {
    updatingWorkspace.value = false;
  }
}

async function handleCreateKeySubmit(payload: {
  expiresInDays: number;
  name: string;
  role: 'admin' | 'read_only';
}) {
  creatingKey.value = true;
  try {
    const { apiKey, fullKey } = await createWorkspaceApiKeyApi(tenantId.value, {
      expiresInDays: payload.expiresInDays > 0 ? payload.expiresInDays : null,
      name: payload.name,
      role: payload.role,
    });
    if (detailData.value) {
      if (!detailData.value.tenant.metadata) {
        detailData.value.tenant.metadata = {};
      }
      const existing = detailData.value.tenant.metadata.api_keys || [];
      detailData.value.tenant.metadata.api_keys = [apiKey, ...existing];
    }
    generatedFullKey.value = fullKey;
    isCreateKeyModalVisible.value = false;
    isKeyCreatedModalVisible.value = true;
    message.success('Tạo khóa API thành công!');
  } catch (error: any) {
    message.error(error.message || 'Tạo khóa API thất bại');
  } finally {
    creatingKey.value = false;
  }
}

async function handleRevokeApiKey(keyId: string) {
  try {
    await revokeWorkspaceApiKeyApi(tenantId.value, keyId);
    if (detailData.value?.tenant.metadata?.api_keys) {
      detailData.value.tenant.metadata.api_keys =
        detailData.value.tenant.metadata.api_keys.filter(
          (k: WorkspaceApiKey) => k.id !== keyId,
        );
    }
    message.success('Đã thu hồi khóa API thành công');
  } catch (error: any) {
    message.error(error.message || 'Thu hồi khóa API thất bại');
  }
}

async function handleDeleteWorkspaceSubmit() {
  deletingWorkspace.value = true;
  try {
    await deleteWorkspaceApi(tenantId.value);
    message.success('Đã xóa hoặc lưu trữ Workspace');
    isDeleteWorkspaceModalVisible.value = false;
    router.push('/dashboard/workspace');
  } catch (error: any) {
    message.error(error.message || 'Xóa Workspace thất bại');
  } finally {
    deletingWorkspace.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Navigation Back Button -->
    <div>
      <Button
        type="link"
        class="flex items-center gap-1.5 p-0 text-muted-foreground hover:text-foreground"
        @click="router.push('/dashboard/workspace')"
      >
        <ArrowLeft class="size-4" />
        <span>Danh Sách Workspace</span>
      </Button>
    </div>

    <!-- Workspace Hero Card -->
    <WorkspaceHero
      v-if="detailData"
      :tenant="detailData.tenant"
      :is-current-active="isCurrentActive"
      :loading="loading"
      @set-active="handleSetActive"
      @connect-cli="handleConnectCli"
      @open-settings="isEditWorkspaceModalVisible = true"
      @refresh="loadData"
    />

    <!-- Main Workspace Tabs -->
    <div
      v-if="detailData"
      class="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
    >
      <Tabs default-active-key="members">
        <!-- Tab 1: Thành Viên -->
        <Tabs.TabPane key="members" tab="Thành Viên">
          <WorkspaceMembersTab
            :members="detailData.members"
            :loading="loading"
            @invite="isInviteModalVisible = true"
            @edit="handleOpenEditMember"
            @remove="handleRemoveMember"
          />
        </Tabs.TabPane>

        <!-- Tab 2: Hạn Ngạch -->
        <Tabs.TabPane key="quotas" tab="Hạn Ngạch">
          <WorkspaceQuotasTab
            :quota="detailData.quota"
            :plan-name="detailData.tenant.metadata?.plan"
          />
        </Tabs.TabPane>

        <!-- Tab 3: Cấu Hình & API Keys -->
        <Tabs.TabPane key="settings" tab="Cấu Hình & API Keys">
          <WorkspaceSettingsTab
            :tenant-id="tenantId"
            :tenant-slug="detailData.tenant.slug"
            :api-keys="apiKeys"
            @create-key="isCreateKeyModalVisible = true"
            @revoke-key="handleRevokeApiKey"
            @delete-workspace="isDeleteWorkspaceModalVisible = true"
          />
        </Tabs.TabPane>
      </Tabs>
    </div>

    <!-- Modals -->
    <InviteMemberModal
      v-model:open="isInviteModalVisible"
      :loading="inviting"
      @submit="handleInviteSubmit"
    />

    <EditMemberModal
      v-model:open="isEditMemberModalVisible"
      :member="editingMember"
      :loading="updatingMember"
      @submit="handleUpdateMemberSubmit"
    />

    <EditWorkspaceModal
      v-model:open="isEditWorkspaceModalVisible"
      :tenant="detailData?.tenant || null"
      :loading="updatingWorkspace"
      @submit="handleUpdateWorkspaceSubmit"
    />

    <CreateApiKeyModal
      v-model:open="isCreateKeyModalVisible"
      :loading="creatingKey"
      @submit="handleCreateKeySubmit"
    />

    <KeyCreatedModal
      v-model:open="isKeyCreatedModalVisible"
      :full-key="generatedFullKey"
    />

    <DeleteWorkspaceModal
      v-model:open="isDeleteWorkspaceModalVisible"
      :slug="detailData?.tenant.slug"
      :loading="deletingWorkspace"
      @submit="handleDeleteWorkspaceSubmit"
    />
  </div>
</template>

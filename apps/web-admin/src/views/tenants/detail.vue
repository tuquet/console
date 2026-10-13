<script lang="ts" setup>
import type {
  TenantDetailTab,
  WorkspaceDetailData,
  WorkspaceMember,
  WorkspaceMemberRole,
} from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { ArrowLeft, Gauge, History, LayoutDashboard, Users } from '@lucide/vue';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@tuquet/vue-ui';

import {
  deleteWorkspaceApi,
  getActiveTenantId,
  getAvailableRolesApi,
  getWorkspaceDetailApi,
  inviteWorkspaceMemberApi,
  removeWorkspaceMemberApi,
  setActiveTenantId,
  updateWorkspaceInfoApi,
  updateWorkspaceMemberRoleApi,
} from '#/api';

import DeleteWorkspaceModal from './components/modals/delete-workspace-modal.vue';
import EditMemberModal from './components/modals/edit-member-modal.vue';
import EditWorkspaceModal from './components/modals/edit-workspace-modal.vue';
import InviteMemberModal from './components/modals/invite-member-modal.vue';
import WorkspaceAuditTab from './components/workspace-audit-tab.vue';
import WorkspaceHero from './components/workspace-hero.vue';
import WorkspaceMembersTab from './components/workspace-members-tab.vue';
import WorkspaceOverviewTab from './components/workspace-overview-tab.vue';
import WorkspaceUsageTab from './components/workspace-usage-tab.vue';

defineOptions({ name: 'TenantDetail' });

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const tenantId = computed(() => (route.params.id as string) || '');
const loading = ref(true);
const detailData = ref<null | WorkspaceDetailData>(null);
const availableRoles = ref<WorkspaceMemberRole[]>([]);

// Active tenant state for CLI context
const currentActiveTenantId = ref(getActiveTenantId());
const isCurrentActive = computed(
  () => currentActiveTenantId.value === tenantId.value,
);

// Tab synchronization with ?tab= query parameter
const VALID_TABS = new Set<TenantDetailTab>([
  'audit',
  'members',
  'overview',
  'usage',
]);
const currentTab = computed<TenantDetailTab>({
  get() {
    const q = route.query.tab as TenantDetailTab;
    return VALID_TABS.has(q) ? q : 'overview';
  },
  set(val) {
    router.replace({
      query: {
        ...route.query,
        tab: val === 'overview' ? undefined : val,
      },
    });
  },
});

// Modals visibility states
const isInviteModalVisible = ref(false);
const inviting = ref(false);

const isEditMemberModalVisible = ref(false);
const editingMember = ref<null | WorkspaceMember>(null);
const updatingMember = ref(false);

const isEditWorkspaceModalVisible = ref(false);
const updatingWorkspace = ref(false);

const isDeleteWorkspaceModalVisible = ref(false);
const deletingWorkspace = ref(false);

async function loadData() {
  if (!tenantId.value) return;
  loading.value = true;
  try {
    const [detail, roles] = await Promise.all([
      getWorkspaceDetailApi(tenantId.value),
      getAvailableRolesApi().catch(() => []),
    ]);
    detailData.value = detail;
    availableRoles.value = roles;
  } catch (error: any) {
    toast.error(error.message || 'Không thể tải chi tiết Workspace');
  } finally {
    loading.value = false;
  }
}

function handleSetActive() {
  if (!detailData.value) return;
  setActiveTenantId(detailData.value.tenant.id);
  currentActiveTenantId.value = detailData.value.tenant.id;
  toast.success(
    `Đã chọn Workspace "${detailData.value.tenant.name}" làm ngữ cảnh CLI`,
  );
}

function handleConnectCli() {
  router.push('/auth/desktop');
}

function handleOpenEditMember(member: WorkspaceMember) {
  editingMember.value = member;
  isEditMemberModalVisible.value = true;
}

async function handleInviteMemberSubmit(payload: {
  email: string;
  roleId: string;
}) {
  if (!detailData.value) return;
  inviting.value = true;
  try {
    const invitedBy =
      userStore.userInfo?.userId || detailData.value.tenant.created_by || '';
    await inviteWorkspaceMemberApi({
      email: payload.email,
      invitedBy,
      roleId: payload.roleId,
      tenantId: detailData.value.tenant.id,
    });
    toast.success(`Đã gửi lời mời tới ${payload.email}`);
    isInviteModalVisible.value = false;
    await loadData();
  } catch (error: any) {
    toast.error(error.message || 'Gửi lời mời thất bại');
  } finally {
    inviting.value = false;
  }
}

async function handleEditMemberSubmit(payload: {
  roleId: string;
  status: 'active' | 'invited' | 'suspended';
}) {
  if (!editingMember.value || !detailData.value) return;
  updatingMember.value = true;
  try {
    await updateWorkspaceMemberRoleApi({
      memberId: editingMember.value.id,
      roleId: payload.roleId,
      tenantId: detailData.value.tenant.id,
    });
    toast.success('Đã cập nhật vai trò thành viên');
    isEditMemberModalVisible.value = false;
    await loadData();
  } catch (error: any) {
    toast.error(error.message || 'Cập nhật thành viên thất bại');
  } finally {
    updatingMember.value = false;
  }
}

async function handleRemoveMember(member: WorkspaceMember) {
  try {
    await removeWorkspaceMemberApi(member.id);
    toast.success(`Đã xóa thành viên ${member.full_name || member.email}`);
    await loadData();
  } catch (error: any) {
    toast.error(error.message || 'Xóa thành viên thất bại');
  }
}

async function handleEditWorkspaceSubmit(payload: {
  name: string;
  slug: string;
}) {
  if (!detailData.value) return;
  updatingWorkspace.value = true;
  try {
    await updateWorkspaceInfoApi(detailData.value.tenant.id, {
      name: payload.name,
      slug: payload.slug,
    });
    toast.success('Đã cập nhật thông tin Workspace');
    isEditWorkspaceModalVisible.value = false;
    await loadData();
  } catch (error: any) {
    toast.error(error.message || 'Cập nhật Workspace thất bại');
  } finally {
    updatingWorkspace.value = false;
  }
}

async function handleDeleteWorkspaceSubmit() {
  deletingWorkspace.value = true;
  try {
    await deleteWorkspaceApi(tenantId.value);
    toast.success('Đã xóa hoặc lưu trữ Workspace');
    isDeleteWorkspaceModalVisible.value = false;
    router.push('/tenants');
  } catch (error: any) {
    toast.error(error.message || 'Xóa Workspace thất bại');
  } finally {
    deletingWorkspace.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Navigation Back Button -->
    <div>
      <Button
        variant="ghost"
        size="sm"
        class="flex items-center gap-1.5 px-0 h-7 text-xs text-muted-foreground hover:text-foreground"
        @click="router.push('/tenants')"
      >
        <ArrowLeft class="size-3.5" />
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

    <!-- Main Workspace 4-Tab Container -->
    <div
      v-if="detailData"
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
    >
      <Tabs v-model="currentTab" class="w-full">
        <TabsList class="mb-4">
          <TabsTrigger value="overview" class="flex items-center gap-1.5">
            <LayoutDashboard class="size-4 shrink-0" />
            <span>Tổng Quan</span>
          </TabsTrigger>
          <TabsTrigger value="members" class="flex items-center gap-1.5">
            <Users class="size-4 shrink-0" />
            <span>Thành Viên ({{ detailData.members.length }})</span>
          </TabsTrigger>
          <TabsTrigger value="usage" class="flex items-center gap-1.5">
            <Gauge class="size-4 shrink-0" />
            <span>Hạn Ngạch & Tài Nguyên</span>
          </TabsTrigger>
          <TabsTrigger value="audit" class="flex items-center gap-1.5">
            <History class="size-4 shrink-0" />
            <span>Nhật Ký An Ninh</span>
          </TabsTrigger>
        </TabsList>

        <!-- Tab 1: Tổng Quan (Overview) -->
        <TabsContent value="overview">
          <WorkspaceOverviewTab
            :tenant="detailData.tenant"
            :subscription="detailData.subscription"
            :active-devices-count="detailData.active_devices_count"
            :total-devices-count="detailData.total_devices_count"
            :members-count="detailData.members.length"
            :is-current-active="isCurrentActive"
            @set-active="handleSetActive"
            @connect-cli="handleConnectCli"
            @edit-workspace="isEditWorkspaceModalVisible = true"
            @delete-workspace="isDeleteWorkspaceModalVisible = true"
          />
        </TabsContent>

        <!-- Tab 2: Thành Viên (Members) -->
        <TabsContent value="members">
          <WorkspaceMembersTab
            :members="detailData.members"
            :loading="loading"
            @invite="isInviteModalVisible = true"
            @edit="handleOpenEditMember"
            @remove="handleRemoveMember"
          />
        </TabsContent>

        <!-- Tab 3: Hạn Ngạch & Tài Nguyên (Usage) -->
        <TabsContent value="usage">
          <WorkspaceUsageTab
            :quota="detailData.quota"
            :subscription="detailData.subscription"
          />
        </TabsContent>

        <!-- Tab 4: Nhật Ký Kiểm Toán (Audit) -->
        <TabsContent value="audit">
          <WorkspaceAuditTab :tenant-id="detailData.tenant.id" />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Modals -->
    <InviteMemberModal
      v-model:open="isInviteModalVisible"
      :roles="availableRoles"
      :loading="inviting"
      @submit="handleInviteMemberSubmit"
    />

    <EditMemberModal
      v-model:open="isEditMemberModalVisible"
      :member="editingMember"
      :roles="availableRoles"
      :loading="updatingMember"
      @submit="handleEditMemberSubmit"
    />

    <EditWorkspaceModal
      v-if="detailData"
      v-model:open="isEditWorkspaceModalVisible"
      :tenant="detailData.tenant"
      :loading="updatingWorkspace"
      @submit="handleEditWorkspaceSubmit"
    />

    <DeleteWorkspaceModal
      v-if="detailData"
      v-model:open="isDeleteWorkspaceModalVisible"
      :tenant="detailData.tenant"
      :loading="deletingWorkspace"
      @submit="handleDeleteWorkspaceSubmit"
    />
  </div>
</template>

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
import { $t } from '#/locales';

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
    toast.error(error.message || $t('page.tenants_view.load_detail_failed'));
  } finally {
    loading.value = false;
  }
}

function handleSetActive() {
  if (!detailData.value) return;
  setActiveTenantId(detailData.value.tenant.id);
  currentActiveTenantId.value = detailData.value.tenant.id;
  toast.success(
    $t('page.tenants_view.selected_cli_context', {
      name: detailData.value.tenant.name,
    }),
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
    toast.success(
      $t('page.tenants_view.invite_sent_success', { email: payload.email }),
    );
    isInviteModalVisible.value = false;
    await loadData();
  } catch (error: any) {
    toast.error(error.message || $t('page.tenants_view.invite_sent_failed'));
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
    toast.success($t('page.tenants_view.member_role_updated'));
    isEditMemberModalVisible.value = false;
    await loadData();
  } catch (error: any) {
    toast.error(error.message || $t('page.tenants_view.member_update_failed'));
  } finally {
    updatingMember.value = false;
  }
}

async function handleRemoveMember(member: WorkspaceMember) {
  try {
    await removeWorkspaceMemberApi(member.id);
    toast.success(
      $t('page.tenants_view.member_removed_success', {
        name: member.full_name || member.email,
      }),
    );
    await loadData();
  } catch (error: any) {
    toast.error(error.message || $t('page.tenants_view.member_remove_failed'));
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
    toast.success($t('page.tenants_view.workspace_updated_success'));
    isEditWorkspaceModalVisible.value = false;
    await loadData();
  } catch (error: any) {
    toast.error(
      error.message || $t('page.tenants_view.workspace_update_failed'),
    );
  } finally {
    updatingWorkspace.value = false;
  }
}

async function handleDeleteWorkspaceSubmit() {
  deletingWorkspace.value = true;
  try {
    await deleteWorkspaceApi(tenantId.value);
    toast.success($t('page.tenants_view.workspace_deleted_success'));
    isDeleteWorkspaceModalVisible.value = false;
    router.push('/tenants');
  } catch (error: any) {
    toast.error(
      error.message || $t('page.tenants_view.workspace_delete_failed'),
    );
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
        <span>{{ $t('page.workspace.list_title') }}</span>
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
        <TabsList
          class="mb-4 flex h-auto w-full justify-start gap-1 overflow-x-auto p-1 sm:inline-flex sm:w-auto"
        >
          <TabsTrigger
            value="overview"
            class="flex shrink-0 items-center gap-1.5 whitespace-nowrap"
          >
            <LayoutDashboard class="size-4 shrink-0" />
            <span>{{ $t('page.tenants_view.tab_overview') }}</span>
          </TabsTrigger>
          <TabsTrigger
            value="members"
            class="flex shrink-0 items-center gap-1.5 whitespace-nowrap"
          >
            <Users class="size-4 shrink-0" />
            <span
              >{{ $t('term.members') }} · {{ detailData.members.length }}</span
            >
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            class="flex shrink-0 items-center gap-1.5 whitespace-nowrap"
          >
            <Gauge class="size-4 shrink-0" />
            <span>{{ $t('page.tenants_view.tab_usage') }}</span>
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            class="flex shrink-0 items-center gap-1.5 whitespace-nowrap"
          >
            <History class="size-4 shrink-0" />
            <span>{{ $t('page.tenants_view.tab_audit') }}</span>
          </TabsTrigger>
        </TabsList>

        <!-- Tab 1: Overview -->
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

        <!-- Tab 2: Members -->
        <TabsContent value="members">
          <WorkspaceMembersTab
            :members="detailData.members"
            :loading="loading"
            @invite="isInviteModalVisible = true"
            @edit="handleOpenEditMember"
            @remove="handleRemoveMember"
          />
        </TabsContent>

        <!-- Tab 3: Usage -->
        <TabsContent value="usage">
          <WorkspaceUsageTab
            :quota="detailData.quota"
            :subscription="detailData.subscription"
          />
        </TabsContent>

        <!-- Tab 4: Audit -->
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

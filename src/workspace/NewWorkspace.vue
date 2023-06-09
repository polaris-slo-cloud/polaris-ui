<template>
  <q-form @submit="createWorkspace" style="max-width: 800px" class="full-width">
    <h1>New Workspace</h1>
    <q-input label="Name *" :rules="[(val) => !!val || 'Workspace name is required']" v-model="model.name" />
    <DirectoryChooser v-if="canChooseDirectory" v-model="model.workspaceDirectory" label="Workspace Location" />
    <h2>Orchestrator</h2>
    <OrchestratorSelection v-model="model.orchestrator" />
    <h2>Metrics Provider</h2>
    <MetricsProviderSelection v-model="model.metricsProvider" />
    <div class="flex justify-end q-mt-xl q-gutter-md">
      <q-btn flat label="Cancel" @click="cancel" />
      <q-btn type="submit" color="primary" label="Create" icon="mdi-plus" />
    </div>
  </q-form>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import OrchestratorSelection from '@/orchestrator/OrchestratorSelection.vue';
import MetricsProviderSelection from '@/metrics-provider/MetricsProviderSelection.vue';
import DirectoryChooser from '@/crosscutting/components/DirectoryChooser.vue';
import { useWorkspaceStore } from '@/store/workspace';
import { markWorkspaceAsUsed } from '@/workspace/store-helper';
import { workspaceConnectionStorage } from '@/connections/storage';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useMetricsProvider } from '@/metrics-provider/api';

const store = useWorkspaceStore();
const router = useRouter();
const orchestratorApi = useOrchestratorApi();
const metricsApi = useMetricsProvider();

const emit = defineEmits(['cancel']);

const model = ref({});
const canChooseDirectory = !!window.filesApi;

function cancel() {
  model.value = {};
  emit('cancel');
}

function connect(workspaceConnections) {
  if (workspaceConnections.orchestrator) {
    orchestratorApi.connect(workspaceConnections.orchestrator, model.value.orchestrator.polarisOptions);
  }
  if (workspaceConnections.metrics) {
    metricsApi.connect(workspaceConnections.metrics);
  }
}

async function createWorkspace() {
  await store.createWorkspace(model.value);
  markWorkspaceAsUsed(store.$state);
  const workspaceConnections = {
    orchestrator: model.value.orchestrator.connection,
    metrics: model.value.metricsProvider,
  };
  workspaceConnectionStorage.setConnectionsForWorkspace(store.workspaceId, workspaceConnections);
  connect(workspaceConnections);
  router.replace({ name: 'workspace' });
}
</script>

<style scoped></style>

<template>
  <div>
    <q-input label="Search" outlined dense v-model="search" type="search" class="q-ma-md">
      <template #prepend>
        <q-icon name="mdi-magnify" />
      </template>
    </q-input>
    <q-separator />
    <q-list>
      <q-expansion-item switch-toggle-side expand-separator default-opened label="SLO Target">
        <q-card>
          <q-card-section>
            <div class="row q-gutter-sm">
              <WorkspaceItem
                class="col-6 col-md-4 col-xl-3"
                title="Application"
                color="white"
                @click="showAddTarget(workspaceItemTypes.targets.application)"
              />
              <WorkspaceItem
                class="col-6 col-md-4 col-xl-3"
                title="Component"
                color="white"
                @click="showAddTarget(workspaceItemTypes.targets.component)"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-expansion-item switch-toggle-side expand-separator default-opened label="SLO">
        <q-card>
          <q-card-section>
            <div class="row q-gutter-sm">
              <WorkspaceItem
                class="col-6 col-md-4 col-xl-3"
                v-for="template of sloTemplates"
                :key="template.sloMappingKind"
                :title="template.displayName"
                color="blue"
                @click="showAddSlo(template)"
              />
              <WorkspaceItem
                class="col-6 col-md-4 col-xl-3"
                title="New Template"
                isCustom
                @click="showCreateSloTemplate = true"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
    <component
      :is="workspaceItemDialog"
      v-model:show="showAddItemDialog"
      :type="newItemType"
      :template="newItemTemplate"
      @created="onItemCreated"
    />
    <CreateSloTemplateDialog v-model:show="showCreateSloTemplate" @created="showAddSlo" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import WorkspaceItem from '@/workspace/WorkspaceItem.vue';
import { workspaceItemTypes } from '@/workspace/constants';
import AddSloTarget from '@/workspace/targets/CreateSloTarget.vue';
import AddSlo from '@/workspace/slo/CreateSlo.vue';
import CreateSloTemplateDialog from '@/polaris-templates/slo/CreateSloTemplateDialog.vue';
import { useTemplateStore } from '@/store/template';

const emit = defineEmits(['itemCreated']);

const templateStore = useTemplateStore();
const sloTemplates = computed(() => templateStore.sloTemplates);
const search = ref(null);

const showAddItemDialog = ref(false);
const newItemType = ref('');
const newItemTemplate = ref({});
const showCreateSloTemplate = ref(false);

function showAddTarget(type) {
  showAddItemDialog.value = true;
  newItemType.value = type;
}
function showAddSlo(template) {
  showAddItemDialog.value = true;
  newItemType.value = workspaceItemTypes.slo;
  newItemTemplate.value = template;
}

const workspaceItemDialog = computed(() => {
  switch (newItemType.value) {
    case workspaceItemTypes.targets.application:
    case workspaceItemTypes.targets.component:
      return AddSloTarget;
    case workspaceItemTypes.slo:
      return AddSlo;
  }
  return 'div';
});

function onItemCreated(workspaceItemId) {
  emit('itemCreated', workspaceItemId);
}
</script>

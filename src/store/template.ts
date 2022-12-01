import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SloTemplateMetadata, templates as defaultSloTemplates } from '@/polaris-templates/slo-template';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { ConfigParameter } from '@/polaris-templates/parameters';
import {
  SloMetricSourceTemplate,
  SloMetricTemplateId,
  templates as defaultMetricSourceTemplates,
} from '@/polaris-templates/slo-metrics/metrics-template';

export const useTemplateStore = defineStore('templates', () => {
  const orchestratorApi = useOrchestratorApi();

  const sloTemplates = ref<SloTemplateMetadata[]>(defaultSloTemplates);
  const sloMetricSourceTemplates = ref<SloMetricSourceTemplate[]>(defaultMetricSourceTemplates);

  const getSloTemplate = computed(() => {
    const templateMap = new Map(sloTemplates.value.map((x) => [x.sloMappingKind, x]));
    return (key: string): SloTemplateMetadata => templateMap.get(key);
  });

  const getSloMetricTemplate = computed(() => {
    const templateMap = new Map(sloMetricSourceTemplates.value.map((x) => [x.id, x]));
    return (id: SloMetricTemplateId): SloMetricSourceTemplate => templateMap.get(id);
  });

  async function createSloTemplate(template: SloTemplateMetadata) {
    if (getSloTemplate.value(template.sloMappingKind)) {
      //TODO: This template already exists, do we need a notification here?
      return;
    }

    sloTemplates.value.push(template);
    await orchestratorApi.deploySloMappingCrd(template);
  }

  function addSloMetricSourceTemplate(template: SloMetricSourceTemplate) {
    if (sloMetricSourceTemplates.value.find((x) => x.id === template.id)) {
      //TODO: This template already exists, do we need a notification here?
      return;
    }
    sloMetricSourceTemplates.value.push(template);
  }

  function saveSloTemplateFromPolaris(template: SloTemplateMetadata) {
    const existingTemplate = getSloTemplate.value(template.sloMappingKind);
    if (existingTemplate) {
      // TODO: Set Metrics
      if (!existingTemplate.confirmed) {
        existingTemplate.config = template.config;
      } else {
        const oldPropertyKeys = existingTemplate.config.map((x) => x.parameter);
        const newPropertyKeys = template.config.map((x) => x.parameter);
        const newProperties = template.config.filter((x) => !oldPropertyKeys.includes(x.parameter));
        const removedPropertyKeys = existingTemplate.config
          .filter((x) => !newPropertyKeys.includes(x.parameter))
          .map((x) => x.parameter);

        if (newProperties.length > 0 || removedPropertyKeys.length > 0) {
          existingTemplate.config = [...existingTemplate.config, ...newProperties].filter(
            (x) => !removedPropertyKeys.includes(x.parameter)
          );
          existingTemplate.confirmed = false;
        }
      }
    } else {
      sloTemplates.value.push(template);
    }
  }

  function confirmSloTemplate(sloMappingKind: string, config: ConfigParameter[]) {
    const existingTemplate = getSloTemplate.value(sloMappingKind);
    if (!existingTemplate) {
      //TODO: This template does not exists, do we need a notification here?
      return;
    }

    existingTemplate.config = config;
    existingTemplate.confirmed = true;
  }

  function saveSloTemplate(template: SloTemplateMetadata) {
    const existingIndex = sloTemplates.value.findIndex((x) => x.sloMappingKind === template.sloMappingKind);
    if (existingIndex >= 0) {
      sloTemplates.value[existingIndex] = template;
    } else {
      sloTemplates.value.push(template);
    }
  }

  function removeSloTemplate(kind: string) {
    sloTemplates.value = sloTemplates.value.filter((x) => x.sloMappingKind !== kind);
  }

  function saveSloMetricSourceTemplate(template: SloMetricSourceTemplate) {
    const existingIndex = sloMetricSourceTemplates.value.findIndex((x) => x.id === template.id);
    if (existingIndex >= 0) {
      sloMetricSourceTemplates.value[existingIndex] = template;
    } else {
      sloMetricSourceTemplates.value.push(template);
    }
  }

  function removeSloMetricSourceTemplate(id: SloMetricTemplateId) {
    sloMetricSourceTemplates.value = sloMetricSourceTemplates.value.filter((x) => x.id !== id);
  }

  return {
    sloTemplates,
    sloMetricSourceTemplates,
    getSloTemplate,
    getSloMetricTemplate,
    createSloTemplate,
    saveSloTemplate,
    removeSloTemplate,
    addSloMetricSourceTemplate,
    saveSloMetricSourceTemplate,
    removeSloMetricSourceTemplate,
    saveSloTemplateFromPolaris,
    confirmSloTemplate,
  };
});

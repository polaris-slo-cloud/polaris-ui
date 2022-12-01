import { useMetricsProvider } from '@/metrics-provider/api';
import { useSloStore } from '@/store/slo';
import { useTargetStore } from '@/store/target';
import { OrchestratorWatchManager } from '@/orchestrator/watch-manager';
import { SloMappingWatchHandler, toSloMappingObjectKind } from '@/workspace/slo/SloMappingWatchHandler';
import { WorkspaceWatchBookmarkManager } from '@/workspace/workspace-watch-bookmark-manager';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { TemplatesWatchHandler } from '@/polaris-templates/TemplatesWatchHandler';
import { useTemplateStore } from '@/store/template';
import { ObjectKindWatchHandlerPair } from '@polaris-sloc/core';
import { useWorkspaceStore } from '@/store/workspace';
import { SloEvaluationWatchHandler } from '@/workspace/slo/SloEvaluationWatchHandler';
import { watch } from 'vue';
import {usePolarisComponentStore} from "@/store/polaris-component";

export async function setupBackgroundTasks() {
  const pollingIntervalMs = 30 * 1000;
  const sloStore = useSloStore();
  const targetStore = useTargetStore();
  const workspaceStore = useWorkspaceStore();
  const metricsProvider = useMetricsProvider();
  const bookmarkManager = new WorkspaceWatchBookmarkManager();
  const watchManager = new OrchestratorWatchManager(bookmarkManager);
  const orchestratorApi = useOrchestratorApi();
  const templateStore = useTemplateStore();
  const polarisComponentStore = usePolarisComponentStore();

  async function pollMetrics() {
    const result = [];
    for (const slo of sloStore.slos) {
      const target = targetStore.getSloTarget(slo.target);
      const metricValues = await metricsProvider.pollSloMetrics(slo, target);
      result.push(...metricValues.map((x) => ({ slo: slo.id, ...x })));
    }

    sloStore.updateSloMetrics(result);
  }
  const pollingInterval = setInterval(pollMetrics, pollingIntervalMs);

  const sloMappingWatchHandler = new SloMappingWatchHandler();
  const sloEvaluationWatchHandler = new SloEvaluationWatchHandler();
  const watcherKindHandlerPairs: ObjectKindWatchHandlerPair[] = [
    { kind: orchestratorApi.crdObjectKind.value, handler: new TemplatesWatchHandler() },
    ...polarisComponentStore.deployedSloMappings.map((kind) => ({ kind, handler: sloMappingWatchHandler })),
    ...workspaceStore.usedElasticityStrategyKinds.map((kind) => ({ kind, handler: sloEvaluationWatchHandler })),
  ];
  await watchManager.configureWatchers(watcherKindHandlerPairs);

  const unsubscribeFromTemplateStore = templateStore.$onAction(({ name, store, args, after, onError }) => {
    if (name === 'saveSloTemplateFromPolaris') {
      const watchedKinds = store.sloTemplates.map((x) => x.sloMappingKind);
      const newTemplateKind = args[0].sloMappingKind;
      if (!watchedKinds.includes(newTemplateKind)) {
        watchManager.startWatchers([toSloMappingObjectKind(newTemplateKind)], new SloMappingWatchHandler());
      }
    }
  });
  const unsubscribeFromUsedElasticityStrategiesWatch = watch(
    () => workspaceStore.usedElasticityStrategyKinds,
    (value, oldValue) => {
      watchManager.stopWatchers(oldValue);
      watchManager.startWatchers(value, new SloEvaluationWatchHandler());
    },
    { deep: true }
  );
  return () => {
    clearInterval(pollingInterval);
    watchManager.stopAllWatchers();
    unsubscribeFromTemplateStore();
    unsubscribeFromUsedElasticityStrategiesWatch();
  };
}

import { ApiObject, WatchEventsHandler } from '@polaris-sloc/core';
import { usePolarisComponentStore } from '@/store/polaris-component';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { PolarisMapper } from '@/orchestrator/PolarisMapper';

export class PolarisControllersWatchHandler implements WatchEventsHandler {
  private readonly orchestratorApi = useOrchestratorApi();
  private readonly polarisComponentStore = usePolarisComponentStore();
  private readonly polarisMapper: PolarisMapper;

  constructor() {
    this.polarisMapper = this.orchestratorApi.createPolarisMapper();
  }

  onError(error: Error): void {
    //TODO
  }

  async onObjectAdded(obj: ApiObject<any>): Promise<void> {
    let polarisController = this.polarisMapper.mapToPolarisController(obj);
    if (!polarisController) {
      polarisController = await this.orchestratorApi.findPolarisControllerForDeployment(obj);
    }
    if (polarisController) {
      this.polarisComponentStore.addPolarisControllerFromCluster(polarisController);
    }
  }

  onObjectDeleted(obj: ApiObject<any>): void {
    this.polarisComponentStore.polarisControllerRemovedFromCluster(obj.metadata.namespace, obj.metadata.name);
  }

  onObjectModified(obj: ApiObject<any>): void {
    // Do nothing
  }
}

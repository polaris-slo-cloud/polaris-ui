import { computed, ComputedRef, ref } from 'vue';
import type { Ref } from 'vue';
import { OrchestratorConnection } from '@/connections/storage';
import Slo, { PolarisSloMapping, SloTarget } from '@/workspace/slo/Slo';
import ElasticityStrategy from '@/workspace/elasticity-strategy/ElasticityStrategy';
import { getOrchestrator } from '@/orchestrator/orchestrators';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';

export interface DeploymentConnectionMetadata {
  [key: string]: any;
}
export interface PolarisResource {
  [key: string]: any;
}
export interface PolarisSloMappingMetadata {
  [key: string]: any;
}
export interface PolarisSloMappingObject {
  [key: string]: any;
}

export interface IDeployment {
  id: string;
  name: string;
  status: string;
  connectionMetadata: DeploymentConnectionMetadata;
}
export interface PolarisDeploymentResult {
  failedResources: PolarisResource[];
  deployedControllers: PolarisController[];
}
export interface PolarisSloDeploymentResult extends PolarisDeploymentResult {
  deployedSloMapping?: PolarisSloMappingMetadata;
}

export interface IOrchestratorApi {
  name: string;
  test(): Promise<boolean>;
  findDeployments(query?: string): Promise<IDeployment[]>;
  deploySlo(slo: Slo, target: SloTarget): Promise<PolarisSloDeploymentResult>;
  deployElasticityStrategy(
    elasticityStrategy: ElasticityStrategy
  ): Promise<PolarisDeploymentResult>;
  retryDeployment(item: PolarisComponent): Promise<PolarisDeploymentResult>;
  applySloMapping(slo: Slo, target: SloTarget): Promise<PolarisSloMappingMetadata>;
  findSloMapping(slo: Slo): Promise<PolarisSloMapping>;
}

export interface IPolarisOrchestratorApi extends IOrchestratorApi {
  configure(polarisOptions: unknown): void;
}

export interface IOrchestratorApiConnection extends IOrchestratorApi {
  orchestratorName: ComputedRef<string>;
  connect(connection: OrchestratorConnection, polarisOptions: unknown): void;
  testConnection(connection: OrchestratorConnection): Promise<boolean>;
}

class OrchestratorNotConnectedError extends Error {
  constructor() {
    super('Unable to perform this action because you are not connected to an orchestrator');
  }
}

class OrchestratorNotConnected implements IPolarisOrchestratorApi {
  public name = 'No Orchestrator';
  test(): Promise<boolean> {
    return Promise.resolve(false);
  }

  configure(): void {
    throw new OrchestratorNotConnectedError();
  }

  findDeployments(): Promise<IDeployment[]> {
    throw new OrchestratorNotConnectedError();
  }

  deploySlo(): Promise<PolarisSloDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  deployElasticityStrategy(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  retryDeployment(): Promise<PolarisDeploymentResult> {
    throw new OrchestratorNotConnectedError();
  }

  applySloMapping(): Promise<PolarisSloMappingMetadata> {
    throw new OrchestratorNotConnectedError();
  }

  findSloMapping(): Promise<PolarisSloMapping> {
    throw new OrchestratorNotConnectedError();
  }
}
const api: Ref<IPolarisOrchestratorApi> = ref(new OrchestratorNotConnected());

function createOrchestratorApi(connection: OrchestratorConnection): IPolarisOrchestratorApi {
  const orchestratorConfig = getOrchestrator(connection.orchestrator);
  return orchestratorConfig
    ? orchestratorConfig.createOrchestratorApi(connection)
    : new OrchestratorNotConnected();
}

function connect(connection: OrchestratorConnection, polarisOptions: unknown): void {
  api.value = createOrchestratorApi(connection);
  api.value.configure(polarisOptions);
}
async function testConnection(connection: OrchestratorConnection): Promise<boolean> {
  const apiConnection = createOrchestratorApi(connection);
  return await apiConnection.test();
}

// This is necessary to unwrap VUE 3 Proxy references because the electron bridge can not serialize them
function clone<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}

export function useOrchestratorApi(): IOrchestratorApiConnection {
  return {
    connect,
    testConnection,
    name: api.value.name,
    orchestratorName: computed(() => api.value.name),
    findDeployments: (query?) => api.value.findDeployments(query),
    test: () => api.value.test(),
    deploySlo: (slo, target) => api.value.deploySlo(clone(slo), clone(target)),
    deployElasticityStrategy: (elasticityStrategy) =>
      api.value.deployElasticityStrategy(clone(elasticityStrategy)),
    retryDeployment: (item) => api.value.retryDeployment(clone(item)),
    applySloMapping: (slo, target) => api.value.applySloMapping(clone(slo), clone(target)),
    findSloMapping: (slo) => api.value.findSloMapping(clone(slo)),
  };
}

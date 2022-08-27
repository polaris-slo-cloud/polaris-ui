import { V1ClusterRole, V1ClusterRoleBinding, V1Deployment } from '@kubernetes/client-node';
import constants from '../constants';
import { IDeployment } from '@/orchestrator/orchestrator-api';

export const generateSloClusterRole = (
  name: string,
  mappingTypeApiGroup: string,
  mappingResources: string
): V1ClusterRole => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name,
  },
  rules: [
    {
      apiGroups: [mappingTypeApiGroup],
      resources: [mappingResources],
      verbs: ['get', 'watch', 'list'],
    },
    {
      apiGroups: [mappingTypeApiGroup],
      resources: [`${mappingResources}/status`],
      verbs: ['get'],
    },
    {
      apiGroups: [constants.polarisApiGroups.elasticity],
      resources: ['*'],
      verbs: ['create', 'delete', 'get', 'list', 'patch', 'update', 'watch'],
    },
    {
      apiGroups: [constants.polarisApiGroups.metrics],
      resources: ['*'],
      verbs: ['create', 'delete', 'get', 'list', 'patch', 'update', 'watch'],
    },
  ],
});

export const generateSloClusterRoleBinding = (
  name: string,
  namespace: string,
  mappingResources: string
): V1ClusterRoleBinding => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRoleBinding',
  metadata: {
    name: `control-${mappingResources}-slos`,
  },
  subjects: [
    {
      kind: 'ServiceAccount',
      name,
      namespace,
    },
  ],
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name,
  },
});

export const generateSloControllerDeployment = (
  name: string,
  namespace: string,
  containerImage: string
): V1Deployment => ({
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    labels: {
      component: name,
      tier: 'control-plane',
    },
    name,
    namespace,
  },
  spec: {
    selector: {
      matchLabels: {
        component: name,
        tier: 'control-plane',
      },
    },
    replicas: 1,
    template: {
      metadata: {
        labels: {
          component: name,
          tier: 'control-plane',
        },
      },
      spec: {
        serviceAccountName: name,
        affinity: {
          nodeAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: {
              nodeSelectorTerms: [
                {
                  matchExpressions: [
                    {
                      key: 'kubernetes.io/arch',
                      operator: 'In',
                      values: ['amd64'],
                    },
                  ],
                },
              ],
            },
          },
        },
        tolerations: [
          { key: 'node-role.kubernetes.io/master', operator: 'Exists', effect: 'NoSchedule' },
        ],
        containers: [
          {
            image: containerImage,
            name: 'slo-controller',
            resources: {
              limits: {
                cpu: '1000m',
                memory: '512Mi',
              },
            },
            env: [
              { name: 'PROMETHEUS_HOST', value: constants.env.prometheusHost },
              { name: 'PROMETHEUS_PORT', value: constants.env.prometheusPort },
              { name: 'SLO_CONTROL_LOOP_INTERVAL_MSEC', value: '20000' },
              { name: 'KUBERNETES_SERVICE_HOST', value: 'kubernetes.default.svc' },
              { name: 'POLARIS_CONNECTION_CHECK_TIMEOUT_MS', value: '600000' },
            ],
            securityContext: {
              privileged: false,
            },
          },
        ],
      },
    },
  },
});

export const generateSloMapping = (
  kind: string,
  namespace: string,
  name: string,
  sloConfig: unknown,
  target: IDeployment
) => ({
  kind,
  apiVersion: 'slo.polaris-slo-cloud.github.io/v1',
  metadata: {
    namespace,
    name,
  },
  spec: {
    targetRef: target.connectionMetadata,
    sloConfig,
    //TODO: elasticityStrategy and staticElasticityStrategyConfig
  },
});

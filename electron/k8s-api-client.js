const k8s = require('@kubernetes/client-node');

const k8sConfig = new k8s.KubeConfig();
k8sConfig.loadFromDefault();
const k8sAppsApi = k8sConfig.makeApiClient(k8s.AppsV1Api);
const k8sApiExtensionsApi = k8sConfig.makeApiClient(k8s.ApiextensionsV1Api);
const k8sObjectsApi = k8sConfig.makeApiClient(k8s.CustomObjectsApi);

module.exports = {
  name: 'Kubernetes',
  connectToContext(ctx) {
    k8sConfig.setCurrentContext(ctx);
  },
  getContexts() {
    return k8sConfig.getContexts();
  },
  async test() {
    const api = k8sConfig.makeApiClient(k8s.CoreV1Api);
    try {
      await api.listNamespace();
      return true;
    } catch (e) {
      return false;
    }
  },
  async searchDeployments(query) {
    try {
      const { body } = await k8sAppsApi.listDeploymentForAllNamespaces();
      const lowerQuery = query.toLowerCase();
      return body.items.filter((x) => x.metadata.name.toLowerCase().includes(lowerQuery));
    } catch (e) {
      return [];
    }
  },
  async getCustomResourceDefinitions() {
    const { body } = await k8sApiExtensionsApi.listCustomResourceDefinition();
    return body.items;
  },
  async getCustomResourceObjects(crd) {
    const { body } = await k8sObjectsApi.listClusterCustomObject(
      crd.spec.group,
      crd.spec.versions[0].name,
      crd.spec.names.plural
    );
    return body.items;
  },
  async getDeployment(namespace, name) {
    try {
      const { body } = await k8sAppsApi.readNamespacedDeployment(
        name,
        namespace
      );
      return body;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    }
  },
};

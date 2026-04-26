export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, resolver, port } = config;
  const labels = [
    'traefik.enable=true',
    `traefik.http.routers.${appName}.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.routers.${appName}.entrypoints=websecure`,
    `traefik.http.routers.${appName}.tls.certresolver=${resolver}`,
    `traefik.http.services.${appName}.loadbalancer.server.port=${port}`
  ];
  
  const firstServiceName = Object.keys(composeObj.services)[0];
  if (!composeObj.services[firstServiceName].labels) {
    composeObj.services[firstServiceName].labels = [];
  }
  // Ensure labels is an array for easy testing in this task
  composeObj.services[firstServiceName].labels = [...composeObj.services[firstServiceName].labels, ...labels];
  composeObj.services[firstServiceName].networks = ['traefik-net'];
  composeObj.networks = composeObj.networks || {};
  composeObj.networks['traefik-net'] = { external: true };
  
  return composeObj;
}

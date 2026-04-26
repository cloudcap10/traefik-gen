export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port } = config;
  const labels = [
    "traefik.enable=true",
    `traefik.http.routers.${appName}.entrypoints=http`,
    `traefik.http.routers.${appName}.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.middlewares.${appName}-https-redirect.redirectscheme.scheme=https`,
    `traefik.http.routers.${appName}.middlewares=${appName}-https-redirect`,
    `traefik.http.routers.${appName}-secure.entrypoints=https`,
    `traefik.http.routers.${appName}-secure.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.routers.${appName}-secure.tls=true`,
    `traefik.http.routers.${appName}-secure.service=${appName}`,
    `traefik.http.services.${appName}.loadbalancer.server.port=${port}`,
    "traefik.docker.network=jttnet"
  ];
  
  const firstServiceName = Object.keys(composeObj.services)[0];
  const service = composeObj.services[firstServiceName];
  
  service.container_name = `sgjtt${appName}`;
  service.hostname = `sgjtt${appName}`;
  service.labels = labels;
  service.networks = ['jttnet'];
  
  composeObj.networks = composeObj.networks || {};
  composeObj.networks['jttnet'] = { external: true };
  
  return composeObj;
}

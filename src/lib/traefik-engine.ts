export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port, resolver = 'cloudflare' } = config;
  
  const labels = [
    "traefik.enable=true",
    // HTTP Router & Redirect
    `traefik.http.routers.${appName}.entrypoints=web`,
    `traefik.http.routers.${appName}.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.middlewares.${appName}-redirect.redirectscheme.scheme=https`,
    `traefik.http.routers.${appName}.middlewares=${appName}-redirect`,
    // HTTPS Router
    `traefik.http.routers.${appName}-secure.entrypoints=websecure`,
    `traefik.http.routers.${appName}-secure.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.routers.${appName}-secure.tls=true`,
    `traefik.http.routers.${appName}-secure.tls.certresolver=${resolver}`,
    `traefik.http.routers.${appName}-secure.service=${appName}`,
    // Service Port
    `traefik.http.services.${appName}.loadbalancer.server.port=${port}`,
    "traefik.docker.network=traefik-net"
  ];
  
  const firstServiceName = Object.keys(composeObj.services)[0];
  const service = composeObj.services[firstServiceName];
  
  // Use clean naming standard
  service.container_name = appName;
  service.hostname = appName;
  service.labels = labels;
  service.networks = ['traefik-net'];
  
  composeObj.networks = composeObj.networks || {};
  composeObj.networks['traefik-net'] = { external: true };
  
  return composeObj;
}

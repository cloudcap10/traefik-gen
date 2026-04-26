export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port, resolver = 'cloudflare' } = config;
  
  const labels = [
    "traefik.enable=true",
    // HTTP Router (Redirect)
    `traefik.http.routers.${appName}.entrypoints=http`,
    `traefik.http.routers.${appName}.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.middlewares.${appName}-https-redirect.redirectscheme.scheme=https`,
    `traefik.http.routers.${appName}.middlewares=${appName}-https-redirect`,
    // HTTPS Router (Secure)
    `traefik.http.routers.${appName}-secure.entrypoints=https`,
    `traefik.http.routers.${appName}-secure.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.routers.${appName}-secure.tls=true`,
    `traefik.http.routers.${appName}-secure.tls.certresolver=${resolver}`,
    `traefik.http.routers.${appName}-secure.service=${appName}`,
    // Service Definition
    `traefik.http.services.${appName}.loadbalancer.server.port=${port}`,
    "traefik.docker.network=traefik-net"
  ];
  
  const firstServiceName = Object.keys(composeObj.services)[0];
  const service = composeObj.services[firstServiceName];
  
  // Apply your Production-Grade Standards
  service.container_name = appName;
  service.hostname = appName;
  service.restart = "unless-stopped";
  service.security_opt = service.security_opt || [];
  if (!service.security_opt.includes("no-new-privileges:true")) {
    service.security_opt.push("no-new-privileges:true");
  }
  
  service.labels = labels;
  service.networks = service.networks || [];
  if (!service.networks.includes('traefik-net')) {
    service.networks.push('traefik-net');
  }
  
  composeObj.networks = composeObj.networks || {};
  composeObj.networks['traefik-net'] = { external: true };
  
  return composeObj;
}

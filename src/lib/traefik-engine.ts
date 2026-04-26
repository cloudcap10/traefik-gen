export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port, resolver = 'cloudflare' } = config;
  
  // Since we now have a GLOBAL redirect in traefik.yml, 
  // apps only need ONE router on the HTTPS entrypoint.
  const labels = [
    "traefik.enable=true",
    `traefik.http.routers.${appName}.entrypoints=https`,
    `traefik.http.routers.${appName}.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.routers.${appName}.tls=true`,
    `traefik.http.routers.${appName}.tls.certresolver=${resolver}`,
    `traefik.http.services.${appName}.loadbalancer.server.port=${port}`,
    "traefik.docker.network=traefik-net"
  ];
  
  const firstServiceName = Object.keys(composeObj.services)[0];
  const service = composeObj.services[firstServiceName];
  
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

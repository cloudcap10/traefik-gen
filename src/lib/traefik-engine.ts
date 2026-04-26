export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port, resolver = 'cloudflare' } = config;
  
  // Ensure the include directive exists at the top level
  composeObj.include = ["../compose-common.yml"];
  
  const labels = [
    "traefik.enable=true",
    // Use the central redirect middleware from config.yaml
    `traefik.http.routers.${appName}.entrypoints=http`,
    `traefik.http.routers.${appName}.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.routers.${appName}.middlewares=https-redirectscheme@file`,
    
    // HTTPS Router
    `traefik.http.routers.${appName}-secure.entrypoints=https`,
    `traefik.http.routers.${appName}-secure.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.routers.${appName}-secure.tls=true`,
    `traefik.http.routers.${appName}-secure.tls.certresolver=${resolver}`,
    // Use the central security headers from config.yaml
    `traefik.http.routers.${appName}-secure.middlewares=default-security-headers@file`,
    `traefik.http.routers.${appName}-secure.service=${appName}`,
    
    // Service Definition
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
  
  if (service.networks) { delete service.networks; }
  if (composeObj.networks) { delete composeObj.networks; }
  
  return composeObj;
}

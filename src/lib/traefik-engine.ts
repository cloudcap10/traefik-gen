export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port, resolver = 'cloudflare' } = config;
  
  // Ensure the include directive exists at the top level
  composeObj.include = ["../compose-common.yml"];
  
  const labels = [
    "traefik.enable=true",
    // HTTP Router & Redirect
    `traefik.http.routers.${appName}.entrypoints=http`,
    `traefik.http.routers.${appName}.rule=Host(\`${appName}.${domain}\`)`,
    `traefik.http.middlewares.${appName}-https-redirect.redirectscheme.scheme=https`,
    `traefik.http.middlewares.sslheader.headers.customrequestheaders.X-Forwarded-Proto=https`,
    `traefik.http.routers.${appName}.middlewares=${appName}-https-redirect`,
    // HTTPS Router
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
  
  service.container_name = appName;
  service.hostname = appName;
  service.restart = "unless-stopped";
  service.security_opt = service.security_opt || [];
  if (!service.security_opt.includes("no-new-privileges:true")) {
    service.security_opt.push("no-new-privileges:true");
  }
  
  service.labels = labels;
  
  // Clean up: remove explicit network definitions as they are handled by the 'default' network in 'include'
  if (service.networks) {
    delete service.networks;
  }
  if (composeObj.networks) {
    delete composeObj.networks;
  }
  
  return composeObj;
}

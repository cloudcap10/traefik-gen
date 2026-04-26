export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port, resolver = 'cloudflare' } = config;
  const fullDomain = `${appName}.${domain}`;
  
  // 1. Ensure Global include
  composeObj.include = ["../compose-common.yml"];
  
  const firstServiceName = Object.keys(composeObj.services)[0];
  const service = composeObj.services[firstServiceName];

  // 2. Traefik Labels
  const labels = [
    "traefik.enable=true",
    `traefik.http.routers.${appName}.entrypoints=http`,
    `traefik.http.routers.${appName}.rule=Host(\`${fullDomain}\`)`,
    `traefik.http.routers.${appName}.middlewares=https-redirectscheme@file`,
    `traefik.http.routers.${appName}-secure.entrypoints=https`,
    `traefik.http.routers.${appName}-secure.rule=Host(\`${fullDomain}\`)`,
    `traefik.http.routers.${appName}-secure.tls=true`,
    `traefik.http.routers.${appName}-secure.tls.certresolver=${resolver}`,
    `traefik.http.routers.${appName}-secure.middlewares=default-security-headers@file`,
    `traefik.http.routers.${appName}-secure.service=${appName}`,
    `traefik.http.services.${appName}.loadbalancer.server.port=${port}`,
    "traefik.docker.network=traefik-net"
  ];

  // 3. CLEANUP: Strip legacy ports (The "Smart" part)
  // We remove 'ports' because Traefik handles the external exposure.
  if (service.ports) {
    console.log("Stripping legacy port mappings to ensure Traefik routing...");
    delete service.ports;
  }

  // 4. Update Environment DOMAIN if it exists
  if (service.environment) {
    const updateDomain = (env: any) => {
      if (typeof env === 'object' && !Array.isArray(env)) {
        if (env.DOMAIN) env.DOMAIN = `https://${fullDomain}`;
      } else if (Array.isArray(env)) {
        return env.map(item => {
          if (typeof item === 'string' && item.startsWith('DOMAIN=')) {
            return `DOMAIN=https://${fullDomain}`;
          }
          return item;
        });
      }
      return env;
    };
    service.environment = updateDomain(service.environment);
  }

  // 5. Production Hardening
  service.container_name = appName;
  service.hostname = appName;
  service.restart = "unless-stopped";
  service.security_opt = service.security_opt || [];
  if (!service.security_opt.includes("no-new-privileges:true")) {
    service.security_opt.push("no-new-privileges:true");
  }
  
  service.labels = labels;
  
  // Network is handled by 'include' but we must ensure no local networks interfere
  if (service.networks) delete service.networks;
  if (composeObj.networks) delete composeObj.networks;
  
  return composeObj;
}

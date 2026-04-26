export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port, resolver = 'cloudflare' } = config;
  const fullDomain = `${appName}.${domain}`;
  
  // 1. Construct a fresh object to GUARANTEE 'include' is on the very first line
  const result: any = {
    include: ["../compose-common.yml"]
  };

  // 2. Copy over all other top-level keys from the original (except include)
  Object.keys(composeObj).forEach(key => {
    if (key !== 'include') {
      result[key] = composeObj[key];
    }
  });
  
  const firstServiceName = Object.keys(result.services)[0];
  const service = result.services[firstServiceName];

  // 3. Traefik Labels
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

  // 4. CLEANUP: Strip legacy ports
  if (service.ports) {
    delete service.ports;
  }

  // 5. Update Environment DOMAIN
  if (service.environment) {
    const updateDomain = (env: any) => {
      if (typeof env === 'object' && !Array.isArray(env)) {
        if (env.DOMAIN) env.DOMAIN = `https://${fullDomain}`;
      } else if (Array.isArray(env)) {
        return env.map((item: any) => {
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

  // 6. Production Hardening
  service.container_name = appName;
  service.hostname = appName;
  service.restart = "unless-stopped";
  service.security_opt = service.security_opt || [];
  if (!service.security_opt.includes("no-new-privileges:true")) {
    service.security_opt.push("no-new-privileges:true");
  }
  
  service.labels = labels;
  
  // Ensure no local networks interfere
  if (service.networks) delete service.networks;
  if (result.networks) delete result.networks;
  
  return result;
}

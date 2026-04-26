export function injectTraefikLabels(composeObj: any, config: any) {
  const { appName, domain, port, resolver = 'cloudflare' } = config;
  const fullDomain = `${appName}.${domain}`;
  
  // 1. Construct a fresh object to GUARANTEE 'include' is on the very first line
  const result: any = {
    include: ["../compose-common.yml"]
  };

  Object.keys(composeObj).forEach(key => {
    if (key !== 'include') {
      result[key] = composeObj[key];
    }
  });
  
  const firstServiceName = Object.keys(result.services)[0];
  const service = result.services[firstServiceName];

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

  // 3. CLEANUP: Strip legacy ports
  if (service.ports) {
    delete service.ports;
  }

  // 4. Update Environment DOMAIN
  if (service.environment) {
    if (typeof service.environment === 'object' && !Array.isArray(service.environment)) {
      const domainKey = Object.keys(service.environment).find(k => k.toUpperCase() === 'DOMAIN');
      if (domainKey) {
        service.environment[domainKey] = "${DOMAIN}";
      }
    } else if (Array.isArray(service.environment)) {
      service.environment = service.environment.map((item: any) => {
        if (typeof item === 'string' && item.toUpperCase().startsWith('DOMAIN=')) {
          return "DOMAIN=${DOMAIN}";
        }
        return item;
      });
    }
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
  
  if (service.networks) delete service.networks;
  if (result.networks) delete result.networks;
  
  return result;
}

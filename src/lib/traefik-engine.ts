export interface TraefikConfig {
  appName: string;
  domain: string;
  port: string | number;
  resolver?: string;
  targetService?: string;
}

export function getServiceNames(composeObj: { services: Record<string, unknown> }): string[] {
  if (!composeObj?.services || typeof composeObj.services !== 'object') return [];
  return Object.keys(composeObj.services);
}

export function detectContainerPort(service: Record<string, unknown>): string | null {
  const ports = service.ports;
  if (!Array.isArray(ports) || ports.length === 0) return null;
  const first = String(ports[0]);
  const match = first.match(/:?(\d+)$/);
  return match ? match[1] : null;
}

export function injectTraefikLabels(composeObj: any, config: TraefikConfig) {
  const { appName, domain, port, resolver = 'cloudflare', targetService } = config;
  const fullDomain = `${appName}.${domain}`;

  // 1. Standardize input: ensure we have a services object
  let services = composeObj.services;
  if (!services && composeObj) {
    services = composeObj;
  }

  // 2. Construct a fresh object to GUARANTEE 'include' is at the absolute top
  const result: any = {
    include: ["../compose-common.yml"],
    services: services,
  };

  // Copy other top-level keys (volumes, etc.) except include/services
  Object.keys(composeObj).forEach((key) => {
    if (key !== 'include' && key !== 'services') {
      result[key] = composeObj[key];
    }
  });

  const serviceNames = Object.keys(result.services);
  if (serviceNames.length === 0) return result;

  // Apply labels to the selected service (or the first one)
  const serviceName = targetService && result.services[targetService]
    ? targetService
    : serviceNames[0];
  const service = result.services[serviceName];

  // 3. Traefik Labels (production pattern)
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
    "traefik.docker.network=traefik-net",
  ];

  // 4. CLEANUP: strip legacy ports from the exposed service
  if (service.ports) delete service.ports;

  // 5. Force DOMAIN env var to use variable substitution
  if (service.environment) {
    if (Array.isArray(service.environment)) {
      service.environment = service.environment.map((item: string) => {
        if (item.toUpperCase().startsWith('DOMAIN=')) return "DOMAIN=${DOMAIN}";
        return item;
      });
    } else if (typeof service.environment === 'object') {
      const dKey = Object.keys(service.environment).find((k) => k.toUpperCase() === 'DOMAIN');
      if (dKey) service.environment[dKey] = "${DOMAIN}";
    }
  }

  // 6. Production hardening
  service.container_name = appName;
  service.hostname = appName;
  service.restart = "unless-stopped";
  service.security_opt = service.security_opt || [];
  if (!service.security_opt.includes("no-new-privileges:true")) {
    service.security_opt.push("no-new-privileges:true");
  }

  service.labels = labels;
  service.networks = ["default"];

  return result;
}

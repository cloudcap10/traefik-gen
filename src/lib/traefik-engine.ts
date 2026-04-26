export interface TraefikConfig {
  appName: string;
  domain: string;
  port: string | number;
  resolver?: string;
  targetService?: string;
}

const DB_KEYWORDS = ['db', 'database', 'postgres', 'mysql', 'mariadb', 'mongo', 'redis', 'cache', 'rabbit', 'mq', 'queue', 'influx', 'elastic', 'search'];
const IMAGE_PORTS: Record<string, string> = {
  nginx: '80', apache: '80', httpd: '80', caddy: '80',
  node: '3000', express: '3000', nuxt: '3000', next: '3000',
  flask: '5000', django: '8000', fastapi: '8000', uvicorn: '8000',
  spring: '8080', tomcat: '8080', java: '8080', go: '8080', golang: '8080',
  ruby: '3000', rails: '3000',
  php: '80', laravel: '80', wordpress: '80',
  vaultwarden: '80', bitwarden: '80',
  grafana: '3000', portainer: '9000', uptime: '3001',
  ghost: '2368', gitea: '3000', nextcloud: '80',
};

export function getServiceNames(composeObj: { services: Record<string, unknown> }): string[] {
  if (!composeObj?.services || typeof composeObj.services !== 'object') return [];
  return Object.keys(composeObj.services);
}

export function detectWebService(services: Record<string, unknown>): string {
  const names = Object.keys(services);
  if (names.length === 1) return names[0];
  // Prefer non-database services
  const webNames = names.filter(
    (n) => !DB_KEYWORDS.some((kw) => n.toLowerCase().includes(kw))
  );
  return webNames[0] ?? names[0];
}

export function detectContainerPort(service: Record<string, unknown>): string {
  // 1. Try ports: mapping first
  const ports = service.ports;
  if (Array.isArray(ports) && ports.length > 0) {
    const first = String(ports[0]);
    const match = first.match(/:?(\d+)(?:\/\w+)?$/);
    if (match) return match[1];
  }
  // 2. Try expose:
  const expose = service.expose;
  if (Array.isArray(expose) && expose.length > 0) return String(expose[0]);
  // 3. Guess from image name
  const image = String(service.image ?? '').toLowerCase();
  for (const [key, p] of Object.entries(IMAGE_PORTS)) {
    if (image.includes(key)) return p;
  }
  return '80';
}

export function injectTraefikLabels(composeObj: any, config: TraefikConfig) {
  const { appName, domain, port, resolver = 'cloudflare', targetService } = config;
  const fullDomain = `${appName}.${domain}`;

  // Standardize: ensure we have a services object
  let services = composeObj.services;
  if (!services && composeObj) services = composeObj;

  // Build fresh object so 'include' is always at the top
  const result: any = { include: ['../compose-common.yml'], services };
  Object.keys(composeObj).forEach((key) => {
    if (key !== 'include' && key !== 'services') result[key] = composeObj[key];
  });

  const serviceNames = Object.keys(result.services);
  if (serviceNames.length === 0) return result;

  const serviceName = targetService && result.services[targetService]
    ? targetService
    : detectWebService(result.services);
  const service = result.services[serviceName];

  const labels = [
    'traefik.enable=true',
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
    'traefik.docker.network=traefik-net',
  ];

  // Strip legacy ports (Traefik is now the front door)
  if (service.ports) delete service.ports;

  // Force DOMAIN env var to use variable substitution
  if (service.environment) {
    if (Array.isArray(service.environment)) {
      service.environment = service.environment.map((item: string) => {
        if (item.toUpperCase().startsWith('DOMAIN=')) return 'DOMAIN=${DOMAIN}';
        return item;
      });
    } else if (typeof service.environment === 'object') {
      const dKey = Object.keys(service.environment).find((k) => k.toUpperCase() === 'DOMAIN');
      if (dKey) service.environment[dKey] = '${DOMAIN}';
    }
  }

  // Production hardening
  service.container_name = appName;
  service.hostname = appName;
  service.restart = 'unless-stopped';
  service.security_opt = service.security_opt || [];
  if (!service.security_opt.includes('no-new-privileges:true')) {
    service.security_opt.push('no-new-privileges:true');
  }
  service.labels = labels;

  return result;
}

import { injectTraefikLabels } from './traefik-engine';
import { expect, test } from 'vitest';

test('injects traefik labels into a simple service', () => {
  const input = {
    services: {
      app: { image: 'test-image' }
    }
  };
  const config = {
    appName: 'my-app',
    domain: 'example.com',
    resolver: 'cloudflare',
    port: 80
  };
  const output = injectTraefikLabels(input, config);
  expect(output.services.app.labels).toContain('traefik.enable=true');
  expect(output.services.app.labels).toContain('traefik.http.routers.my-app.rule=Host(`my-app.example.com`)');
});

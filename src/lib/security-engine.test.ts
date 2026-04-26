import { stripSecrets } from './security-engine';
import { expect, test } from 'vitest';

test('replaces sensitive environment variables with placeholders', () => {
  const env = {
    DB_PASSWORD: 'supersecret123',
    CF_API_TOKEN: 'token-456',
    LOG_LEVEL: 'info'
  };
  const result = stripSecrets(env);
  expect(result.DB_PASSWORD).toBe('${DB_PASSWORD}');
  expect(result.CF_API_TOKEN).toBe('${CF_API_TOKEN}');
  expect(result.LOG_LEVEL).toBe('info');
});

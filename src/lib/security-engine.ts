const SENSITIVE_WORDS = ['PASS', 'SECRET', 'KEY', 'TOKEN', 'AUTH'];

export function stripSecrets(envObj: Record<string, string>) {
  const stripped = { ...envObj };
  Object.keys(stripped).forEach(key => {
    if (SENSITIVE_WORDS.some(word => key.toUpperCase().includes(word))) {
      stripped[key] = `\${${key}}`;
    }
  });
  return stripped;
}

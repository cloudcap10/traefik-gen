import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import { injectTraefikLabels } from '../lib/traefik-engine';
import { stripSecrets } from '../lib/security-engine';
import { pushToGitHub } from '../lib/github-client';

const DEFAULT_INPUT = `services:
  web:
    image: nginx:latest
    environment:
      DATABASE_PASSWORD: supersecretpassword
      API_TOKEN: abc123def456
      DEBUG: "true"
`;

const GeneratorUI: React.FC = () => {
  const [inputYaml, setInputYaml] = useState(DEFAULT_INPUT);
  const [domain, setDomain] = useState('example.com');
  const [resolver, setResolver] = useState('letsencrypt');
  const [appName, setAppName] = useState('my-app');
  const [port, setPort] = useState('80');
  const [outputYaml, setOutputYaml] = useState('');
  const [error, setError] = useState<string | null>(null);

  // GitHub integration state
  const [ghToken, setGhToken] = useState('');
  const [ghOwner, setGhOwner] = useState('');
  const [ghRepo, setGhRepo] = useState('');
  const [ghPath, setGhPath] = useState('compose.yml');
  const [pushStatus, setPushStatus] = useState<{ type: 'success' | 'error' | 'loading' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    try {
      setError(null);
      const parsed = yaml.load(inputYaml) as any;
      
      if (!parsed || !parsed.services) {
        throw new Error('Invalid Docker Compose: "services" section missing.');
      }

      // 1. Strip secrets from all services
      Object.keys(parsed.services).forEach(serviceName => {
        const service = parsed.services[serviceName];
        if (service.environment) {
          if (Array.isArray(service.environment)) {
            // Handle array format [KEY=VALUE]
            service.environment = service.environment.map((item: string) => {
              const [key, ...parts] = item.split('=');
              const value = parts.join('=');
              const envObj = { [key]: value };
              const stripped = stripSecrets(envObj);
              return `${key}=${stripped[key]}`;
            });
          } else {
            // Handle object format {KEY: VALUE}
            parsed.services[serviceName].environment = stripSecrets(service.environment);
          }
        }
      });

      // 2. Inject Traefik Labels
      const config = { appName, domain, resolver, port };
      const modified = injectTraefikLabels(parsed, config);

      setOutputYaml(yaml.dump(modified));
    } catch (err: any) {
      setError(err.message);
      setOutputYaml('');
    }
  }, [inputYaml, domain, resolver, appName, port]);

  const handlePushToGitHub = async () => {
    if (!ghToken || !ghOwner || !ghRepo || !ghPath) {
      setPushStatus({ type: 'error', message: 'All GitHub fields are required.' });
      return;
    }

    setPushStatus({ type: 'loading', message: 'Pushing to GitHub...' });
    try {
      await pushToGitHub({
        token: ghToken,
        owner: ghOwner,
        repo: ghRepo,
        path: ghPath
      }, outputYaml);
      setPushStatus({ type: 'success', message: 'Successfully pushed to GitHub!' });
    } catch (err: any) {
      setPushStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">DNS Resolver</label>
          <input
            type="text"
            value={resolver}
            onChange={(e) => setResolver(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">App Name</label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Port</label>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">GitHub Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Personal Access Token</label>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="ghp_..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Repo Owner</label>
            <input
              type="text"
              value={ghOwner}
              onChange={(e) => setGhOwner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Repo Name</label>
            <input
              type="text"
              value={ghRepo}
              onChange={(e) => setGhRepo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="my-repo"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">File Path</label>
            <input
              type="text"
              value={ghPath}
              onChange={(e) => setGhPath(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePushToGitHub}
            disabled={pushStatus.type === 'loading' || !!error || !outputYaml}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm transition-colors ${
              pushStatus.type === 'loading' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {pushStatus.type === 'loading' ? 'Pushing...' : 'Push to GitHub'}
          </button>
          {pushStatus.message && (
            <span className={`text-sm ${pushStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {pushStatus.message}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        <div className="flex flex-col h-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Compose Input</label>
          <textarea
            value={inputYaml}
            onChange={(e) => setInputYaml(e.target.value)}
            className="flex-grow w-full p-4 font-mono text-sm border border-gray-300 rounded-lg shadow-inner focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-50"
            placeholder="Paste your compose.yml here..."
          />
        </div>
        <div className="flex flex-col h-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Traefik-Enabled Output</label>
          <div className="flex-grow w-full overflow-auto p-4 bg-gray-900 rounded-lg shadow-inner border border-gray-700 relative">
            {error ? (
              <div className="text-red-400 font-mono text-sm">{error}</div>
            ) : (
              <pre className="text-blue-300 font-mono text-sm">{outputYaml}</pre>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(outputYaml)}
              className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
              disabled={!!error || !outputYaml}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorUI;

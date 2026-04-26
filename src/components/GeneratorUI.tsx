import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import {
  Globe, Tag, Server, Zap, Shield, Github,
  Copy, Download, ChevronDown, ChevronUp,
  Check, X, Loader2, AlertCircle, Eye, EyeOff,
  KeyRound, Folder, FileText,
} from 'lucide-react';
import { injectTraefikLabels, getServiceNames, detectContainerPort, TraefikConfig } from '../lib/traefik-engine';
import { stripSecrets } from '../lib/security-engine';
import { pushToGitHub } from '../lib/github-client';

const STORAGE_KEY = 'traefikgen-settings';

const DEFAULT_INPUT = '';

interface SavedSettings {
  domain: string;
  resolver: string;
  appName: string;
  port: string;
  targetService: string;
  ghOwner: string;
  ghRepo: string;
  ghPath: string;
}

function loadSettings(): Partial<SavedSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedSettings>) : {};
  } catch {
    return {};
  }
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute z-20 bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl w-64 hidden group-hover:block pointer-events-none leading-relaxed">
        {text}
        <span className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string | null;
}

function Field({ icon, label, hint, children, error }: FieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
        {hint && <span className="font-normal normal-case text-slate-400 ml-0.5">· {hint}</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white transition-shadow outline-none";

export default function GeneratorUI() {
  const saved = loadSettings();

  const [inputYaml, setInputYaml] = useState(DEFAULT_INPUT);
  const [domain, setDomain] = useState(saved.domain ?? 'example.com');
  const [resolver, setResolver] = useState(saved.resolver ?? 'letsencrypt');
  const [appName, setAppName] = useState(saved.appName ?? 'my-app');
  const [port, setPort] = useState(saved.port ?? '80');
  const [targetService, setTargetService] = useState(saved.targetService ?? '');
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [secretsStripped, setSecretsStripped] = useState(0);

  const [outputYaml, setOutputYaml] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [portError, setPortError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [ghToken, setGhToken] = useState('');
  const [ghOwner, setGhOwner] = useState(saved.ghOwner ?? '');
  const [ghRepo, setGhRepo] = useState(saved.ghRepo ?? '');
  const [ghPath, setGhPath] = useState(saved.ghPath ?? 'docker-compose.yml');
  const [showToken, setShowToken] = useState(false);
  const [ghOpen, setGhOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    type: 'success' | 'error' | 'loading' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    const settings: SavedSettings = {
      domain, resolver, appName, port, targetService, ghOwner, ghRepo, ghPath,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [domain, resolver, appName, port, targetService, ghOwner, ghRepo, ghPath]);

  function isValidPort(val: string): boolean {
    const n = Number(val);
    return val !== '' && Number.isInteger(n) && n >= 1 && n <= 65535;
  }

  useEffect(() => {
    try {
      setParseError(null);

      if (!isValidPort(port)) {
        setPortError('Must be 1–65535');
        setOutputYaml('');
        return;
      }
      setPortError(null);

      const parsed = yaml.load(inputYaml) as Record<string, unknown> | null;

      if (!parsed || typeof parsed !== 'object' || !('services' in parsed) || !parsed.services) {
        throw new Error(
          'Missing "services:" section.\n\nMake sure your file starts with:\n\nservices:\n  myapp:\n    image: ...'
        );
      }

      const names = getServiceNames(parsed as Parameters<typeof getServiceNames>[0]);
      setServiceNames(names);

      const effectiveTarget = names.includes(targetService) ? targetService : (names[0] ?? '');
      if (effectiveTarget !== targetService) {
        setTargetService(effectiveTarget);
        const svc = (parsed as Record<string, unknown> & { services: Record<string, Record<string, unknown>> }).services[effectiveTarget];
        const detected = svc ? detectContainerPort(svc) : null;
        if (detected) setPort(detected);
      }

      if (!effectiveTarget) {
        throw new Error('No services found. Add at least one service under "services:".');
      }

      const cloned = JSON.parse(JSON.stringify(parsed)) as Parameters<typeof injectTraefikLabels>[0];

      let totalStripped = 0;
      Object.keys(cloned.services).forEach((svc) => {
        const service = cloned.services[svc];
        if (!service.environment) return;

        if (Array.isArray(service.environment)) {
          service.environment = (service.environment as string[]).map((item) => {
            const eqIdx = item.indexOf('=');
            if (eqIdx === -1) return item;
            const key = item.slice(0, eqIdx);
            const value = item.slice(eqIdx + 1);
            const stripped = stripSecrets({ [key]: value });
            if (stripped[key] !== value) totalStripped++;
            return `${key}=${stripped[key]}`;
          });
        } else {
          const envObj = service.environment as Record<string, string>;
          const normalized = Object.fromEntries(
            Object.entries(envObj).map(([k, v]) => [k, String(v)])
          );
          const strippedEnv = stripSecrets(normalized);
          Object.keys(normalized).forEach((k) => {
            if (strippedEnv[k] !== normalized[k]) totalStripped++;
          });
          service.environment = strippedEnv;
        }
      });
      setSecretsStripped(totalStripped);

      const config: TraefikConfig = { targetService: effectiveTarget, appName, domain, resolver, port };
      const modified = injectTraefikLabels(cloned, config);
      setOutputYaml(yaml.dump(modified, { lineWidth: -1 }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error.';
      setParseError(msg);
      setOutputYaml('');
      setSecretsStripped(0);
    }
  }, [inputYaml, domain, resolver, appName, port, targetService]);

  async function handleCopy() {
    await navigator.clipboard.writeText(outputYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([outputYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handlePushToGitHub() {
    if (!ghToken || !ghOwner || !ghRepo || !ghPath) {
      setPushStatus({ type: 'error', message: 'All four GitHub fields are required.' });
      return;
    }
    setShowConfirm(false);
    setPushStatus({ type: 'loading', message: '' });
    try {
      await pushToGitHub({ token: ghToken, owner: ghOwner, repo: ghRepo, path: ghPath }, outputYaml);
      setPushStatus({ type: 'success', message: `Saved to ${ghOwner}/${ghRepo}/${ghPath}` });
      setGhToken('');
    } catch (err: unknown) {
      setPushStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  const canPush = !parseError && !!outputYaml && pushStatus.type !== 'loading';
  const urlPreview = domain && appName ? `https://${appName}.${domain}` : null;

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Traefik Configuration</h2>
          {urlPreview && (
            <span className="text-xs text-slate-400 font-mono">
              Route → <span className="text-blue-600 font-semibold">{urlPreview}</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          <Tooltip text="Which container gets exposed to the internet. Usually your web app — not your database. Its ports: mapping will be removed since Traefik handles routing.">
            <Field icon={<Server size={12} />} label="Service" hint="which container?">
              <select
                value={targetService}
                onChange={(e) => {
                  const name = e.target.value;
                  setTargetService(name);
                  try {
                    const parsed = yaml.load(inputYaml) as Record<string, unknown> & { services: Record<string, Record<string, unknown>> };
                    const detected = detectContainerPort(parsed?.services?.[name] ?? {});
                    if (detected) setPort(detected);
                  } catch { /* ignore parse errors here */ }
                }}
                className={inputCls}
              >
                {serviceNames.length === 0 && (
                  <option value="">— paste compose file first —</option>
                )}
                {serviceNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>
          </Tooltip>

          <Tooltip text="Your root domain. Your app will be at [app-name].[domain]. E.g. domain 'home.lab' + app name 'notes' → https://notes.home.lab">
            <Field icon={<Globe size={12} />} label="Domain" hint="e.g. home.lab">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={inputCls}
                placeholder="home.lab"
              />
            </Field>
          </Tooltip>

          <Tooltip text="Short name for the Traefik route — becomes the subdomain. Lowercase, hyphens OK, no spaces or dots.">
            <Field icon={<Tag size={12} />} label="App Name" hint="subdomain">
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className={inputCls}
                placeholder="my-app"
              />
            </Field>
          </Tooltip>

          <Tooltip text="The port your container listens on inside Docker. Common: 80 (nginx), 3000 (Node), 8080 (Java/Go), 5000 (Flask). Auto-detected from your ports: mapping.">
            <Field icon={<Zap size={12} />} label="Port" hint="internal" error={portError}>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className={`${inputCls} ${portError ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400' : ''}`}
                placeholder="80"
              />
            </Field>
          </Tooltip>

          <Tooltip text="The certificate resolver name in your traefik.yml. Usually 'letsencrypt'. Cloudflare DNS challenge might be 'cloudflare'.">
            <Field icon={<Shield size={12} />} label="TLS Resolver" hint="from traefik.yml">
              <input
                type="text"
                value={resolver}
                onChange={(e) => setResolver(e.target.value)}
                className={inputCls}
                placeholder="letsencrypt"
              />
            </Field>
          </Tooltip>

        </div>
      </div>

      {/* Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">

        {/* Input */}
        <div className="flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-600">Input</span>
            <span className="text-[11px] text-slate-400 font-mono">docker-compose.yml</span>
          </div>
          <textarea
            value={inputYaml}
            onChange={(e) => setInputYaml(e.target.value)}
            className="flex-grow w-full p-4 font-mono text-sm focus:outline-none resize-none bg-white min-h-[280px] text-slate-800 placeholder-slate-300"
            placeholder={`Paste any docker-compose.yml here, e.g.:

services:
  vaultwarden:
    image: vaultwarden/server:latest
    ports:
      - "80:80"
    environment:
      DOMAIN: https://vw.yourdomain.com
      DATABASE_URL: postgresql://...`}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col min-h-0 rounded-xl border border-slate-700 shadow-sm overflow-hidden bg-slate-900">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-300">Output</span>
              {!parseError && outputYaml && (
                <>
                  <span className="text-[10px] font-semibold bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded-full">
                    Traefik-ready
                  </span>
                  {secretsStripped > 0 && (
                    <span className="text-[10px] font-semibold bg-amber-900 text-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Shield size={9} />
                      {secretsStripped} secret{secretsStripped !== 1 ? 's' : ''} stripped
                    </span>
                  )}
                </>
              )}
              {parseError && !outputYaml && (
                <span className="text-[10px] font-semibold bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">
                  Waiting…
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!!parseError || !outputYaml}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!!parseError || !outputYaml}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download size={11} />
                Save
              </button>
            </div>
          </div>
          <div className="flex-grow overflow-auto p-4 min-h-[280px]">
            {outputYaml ? (
              <pre className="text-emerald-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">{outputYaml}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-6 gap-3">
                <div className="text-3xl">📋</div>
                <p className="text-slate-400 text-sm font-medium">Paste your compose file on the left</p>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                  The Traefik-ready version will appear here instantly —
                  labels added, ports removed, secrets replaced with safe placeholders.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* GitHub Push — collapsible */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setGhOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Github size={15} className="text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">Push to GitHub</span>
            <span className="text-xs text-slate-400">optional · saves the output file directly to your repo</span>
          </div>
          {ghOpen
            ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" />
            : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
        </button>

        {ghOpen && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 mt-3 mb-4">
              Your token is <strong>never stored</strong> — cleared from memory immediately after each push.
              Need one? <span className="text-blue-600">GitHub → Settings → Developer settings → Personal access tokens (classic) → repo scope</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Tooltip text="A GitHub Personal Access Token with 'repo' scope. Used once then discarded — never saved to localStorage.">
                <Field icon={<KeyRound size={12} />} label="Access Token">
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={ghToken}
                      onChange={(e) => setGhToken(e.target.value)}
                      className={`${inputCls} pr-9`}
                      placeholder="ghp_..."
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </Field>
              </Tooltip>

              <Field icon={<Github size={12} />} label="Username">
                <input
                  type="text"
                  value={ghOwner}
                  onChange={(e) => setGhOwner(e.target.value)}
                  className={inputCls}
                  placeholder="your-username"
                />
              </Field>

              <Field icon={<Folder size={12} />} label="Repository">
                <input
                  type="text"
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                  className={inputCls}
                  placeholder="my-homelab"
                />
              </Field>

              <Tooltip text="Path inside the repo where the file will be saved. Include subdirectories if needed, e.g. 'nginx/docker-compose.yml'.">
                <Field icon={<FileText size={12} />} label="File Path">
                  <input
                    type="text"
                    value={ghPath}
                    onChange={(e) => setGhPath(e.target.value)}
                    className={inputCls}
                    placeholder="myapp/docker-compose.yml"
                  />
                </Field>
              </Tooltip>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!canPush}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Github size={14} />
                  Push to GitHub
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-amber-800">
                    Write to <strong className="font-mono">{ghOwner}/{ghRepo}/{ghPath}</strong>?
                  </span>
                  <button
                    onClick={handlePushToGitHub}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md font-semibold transition-colors"
                  >
                    Yes, push
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {pushStatus.type === 'loading' && (
                <span className="flex items-center gap-1.5 text-sm text-blue-600">
                  <Loader2 size={14} className="animate-spin" />
                  Pushing…
                </span>
              )}
              {pushStatus.message && pushStatus.type !== 'loading' && (
                <span className={`flex items-center gap-1.5 text-sm ${pushStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {pushStatus.type === 'success' ? <Check size={14} /> : <X size={14} />}
                  {pushStatus.message}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

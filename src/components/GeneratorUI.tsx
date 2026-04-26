import { useState, useEffect, useRef } from 'react';
import yaml from 'js-yaml';
import {
  Globe, Tag, Server, Zap, Shield, Github,
  Copy, Download, ChevronDown, ChevronUp,
  Check, X, Loader2, Eye, EyeOff,
  KeyRound, Folder, FileText,
} from 'lucide-react';
import {
  injectTraefikLabels, getServiceNames,
  detectWebService, detectContainerPort, TraefikConfig,
} from '../lib/traefik-engine';
import { stripSecrets } from '../lib/security-engine';
import { pushToGitHub } from '../lib/github-client';

const STORAGE_KEY = 'traefikgen-settings';

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

interface TooltipProps { text: string; children: React.ReactNode; }
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

interface FieldProps { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode; }
function Field({ icon, label, hint, children }: FieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
        {hint && <span className="font-normal normal-case text-slate-400 ml-0.5">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white transition-shadow outline-none";

export default function GeneratorUI() {
  const saved = loadSettings();

  const [inputYaml, setInputYaml] = useState('');
  const [domain, setDomain] = useState(saved.domain ?? 'example.com');
  const [resolver, setResolver] = useState(saved.resolver ?? 'cloudflare');
  const [appName, setAppName] = useState(saved.appName ?? '');
  const [port, setPort] = useState(saved.port ?? '80');
  const [targetService, setTargetService] = useState(saved.targetService ?? '');
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [secretsStripped, setSecretsStripped] = useState(0);
  const [outputYaml, setOutputYaml] = useState('');
  const [copied, setCopied] = useState(false);

  const [ghToken, setGhToken] = useState('');
  const [ghOwner, setGhOwner] = useState(saved.ghOwner ?? '');
  const [ghRepo, setGhRepo] = useState(saved.ghRepo ?? 'traefik-gen');
  const [ghPath, setGhPath] = useState(saved.ghPath ?? '');
  const [showToken, setShowToken] = useState(false);
  const [ghOpen, setGhOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    type: 'success' | 'error' | 'loading' | null;
    message: string;
  }>({ type: null, message: '' });

  // Track whether the user has manually edited appName so we don't overwrite it
  const appNameEdited = useRef(!!saved.appName);

  useEffect(() => {
    const settings: SavedSettings = {
      domain, resolver, appName, port, targetService, ghOwner, ghRepo, ghPath,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [domain, resolver, appName, port, targetService, ghOwner, ghRepo, ghPath]);

  // Auto-update ghPath when appName changes (unless user has set it manually)
  const ghPathEdited = useRef(!!saved.ghPath);
  useEffect(() => {
    if (!ghPathEdited.current && appName) {
      setGhPath(`${appName}/compose.yml`);
    }
  }, [appName]);

  useEffect(() => {
    if (!inputYaml.trim()) {
      setOutputYaml('');
      setServiceNames([]);
      setSecretsStripped(0);
      return;
    }

    try {
      const parsed = yaml.load(inputYaml) as Record<string, unknown> | null;
      if (!parsed || typeof parsed !== 'object') { setOutputYaml(''); return; }

      // Tolerate compose files without a top-level `services:` key
      const hasServices = 'services' in parsed && parsed.services && typeof parsed.services === 'object';
      const normalised: Record<string, unknown> & { services: Record<string, unknown> } = hasServices
        ? parsed as any
        : { services: parsed };

      const names = getServiceNames(normalised);
      if (names.length === 0) { setOutputYaml(''); return; }
      setServiceNames(names);

      // Auto-select best web service
      const bestService = detectWebService(normalised.services as Record<string, unknown>);
      const effectiveTarget = names.includes(targetService) ? targetService : bestService;

      if (effectiveTarget !== targetService) {
        setTargetService(effectiveTarget);
        // Auto-fill app name from service name
        if (!appNameEdited.current) {
          setAppName(effectiveTarget);
        }
        // Auto-detect port
        const svc = (normalised.services as Record<string, Record<string, unknown>>)[effectiveTarget];
        if (svc) setPort(detectContainerPort(svc));
      }

      const cloned = JSON.parse(JSON.stringify(normalised)) as typeof normalised;

      // Strip secrets from all services
      let totalStripped = 0;
      Object.keys(cloned.services).forEach((svc) => {
        const service = cloned.services[svc] as Record<string, unknown>;
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

      const effectivePort = /^\d+$/.test(String(port)) ? port : '80';
      const effectiveAppName = appName || effectiveTarget;
      const config: TraefikConfig = {
        targetService: effectiveTarget,
        appName: effectiveAppName,
        domain,
        resolver,
        port: effectivePort,
      };
      const modified = injectTraefikLabels(cloned, config);
      const raw = yaml.dump(modified, { lineWidth: -1 });
      // js-yaml renders empty named volumes/networks as `key: null` — strip to `key:`
      const cleaned = raw.replace(/^( {2}[\w-]+): null$/gm, '$1:');
      setOutputYaml(cleaned);
    } catch {
      // Silent — keep output blank, don't show any error to user
      setOutputYaml('');
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
    a.download = 'compose.yml';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handlePushToGitHub() {
    if (!ghToken || !ghOwner || !ghRepo || !ghPath) {
      setPushStatus({ type: 'error', message: 'Fill in all four GitHub fields first.' });
      return;
    }
    setShowConfirm(false);
    setPushStatus({ type: 'loading', message: '' });
    try {
      await pushToGitHub({ token: ghToken, owner: ghOwner, repo: ghRepo, path: ghPath }, outputYaml);
      setPushStatus({ type: 'success', message: `Saved → ${ghOwner}/${ghRepo}/${ghPath}` });
      setGhToken('');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Unknown error';
      const friendly = raw.includes('404') ? 'Repo or path not found — check owner/repo name.'
        : raw.includes('401') || raw.includes('403') ? 'Token rejected — check it has repo scope.'
        : raw.includes('422') ? 'File conflict — it may already exist with different content.'
        : raw;
      setPushStatus({ type: 'error', message: friendly });
    }
  }

  const hasOutput = !!outputYaml;
  const urlPreview = domain && appName ? `https://${appName}.${domain}` : null;

  return (
    <div className="flex flex-col gap-4">

      {/* Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Step 5 — Configure &amp; Generate
          </h2>
          {urlPreview && (
            <span className="text-xs text-slate-400 font-mono">
              Your app → <span className="text-blue-600 font-semibold">{urlPreview}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          <Tooltip text="Auto-detected from your compose file. Change this if you want a different service exposed (e.g. skip the database, pick the web app).">
            <Field icon={<Server size={12} />} label="Service" hint="auto-detected">
              <select
                value={targetService}
                onChange={(e) => {
                  const name = e.target.value;
                  setTargetService(name);
                  if (!appNameEdited.current) setAppName(name);
                  try {
                    const parsed = yaml.load(inputYaml) as any;
                    const svc = parsed?.services?.[name] ?? parsed?.[name] ?? {};
                    setPort(detectContainerPort(svc));
                  } catch { /* ignore */ }
                }}
                className={inputCls}
              >
                {serviceNames.length === 0
                  ? <option value="">— paste a compose file first —</option>
                  : serviceNames.map((n) => <option key={n} value={n}>{n}</option>)
                }
              </select>
            </Field>
          </Tooltip>

          <Tooltip text="Your root domain. The app will live at [App Name].[Domain]. E.g. domain 'talz.net' + app name 'vaultwarden' → https://vaultwarden.talz.net">
            <Field icon={<Globe size={12} />} label="Domain" hint="your domain">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={inputCls}
                placeholder="talz.net"
              />
            </Field>
          </Tooltip>

          <Tooltip text="Becomes the subdomain. Auto-filled from the service name. Use lowercase and hyphens only.">
            <Field icon={<Tag size={12} />} label="App Name" hint="subdomain">
              <input
                type="text"
                value={appName}
                onChange={(e) => { appNameEdited.current = true; setAppName(e.target.value); }}
                className={inputCls}
                placeholder="vaultwarden"
              />
            </Field>
          </Tooltip>

          <Tooltip text="The port your container listens on inside Docker. Auto-detected from your compose file. Common: 80 (nginx/wordpress), 3000 (node/gitea), 8080 (java/go).">
            <Field icon={<Zap size={12} />} label="Port" hint="auto-detected">
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className={inputCls}
                placeholder="80"
              />
            </Field>
          </Tooltip>

          <Tooltip text="The TLS certificate resolver in your traefik.yaml. It's 'cloudflare' if you followed the Getting Started guide above.">
            <Field icon={<Shield size={12} />} label="TLS Resolver" hint="from traefik.yaml">
              <input
                type="text"
                value={resolver}
                onChange={(e) => setResolver(e.target.value)}
                className={inputCls}
                placeholder="cloudflare"
              />
            </Field>
          </Tooltip>

        </div>
      </div>

      {/* Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[360px]">

        {/* Input */}
        <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-600">Paste any docker-compose.yml</span>
            <span className="text-[11px] text-emerald-600 font-medium">→ auto-converts</span>
          </div>
          <textarea
            value={inputYaml}
            onChange={(e) => setInputYaml(e.target.value)}
            className="flex-grow w-full p-4 font-mono text-sm focus:outline-none resize-none bg-white text-slate-800 placeholder-slate-300 min-h-[320px]"
            placeholder={`Paste any docker-compose.yml here, for example:

services:
  vaultwarden:
    image: vaultwarden/server:latest
    ports:
      - "80:80"
    environment:
      DOMAIN: https://vw.example.com
      DATABASE_URL: postgresql://secret@db/vw`}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col rounded-xl border border-slate-700 shadow-sm overflow-hidden bg-slate-900">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Traefik-ready output</span>
              {hasOutput && (
                <>
                  <span className="text-[10px] font-semibold bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded-full">
                    Ready
                  </span>
                  {secretsStripped > 0 && (
                    <span className="text-[10px] font-semibold bg-amber-900 text-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Shield size={9} />
                      {secretsStripped} secret{secretsStripped !== 1 ? 's' : ''} hidden
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!hasOutput}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!hasOutput}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download size={11} />
                Save
              </button>
            </div>
          </div>
          <div className="flex-grow overflow-auto p-4 min-h-[320px]">
            {hasOutput ? (
              <pre className="text-emerald-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">{outputYaml}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center px-6 gap-3">
                <div className="text-4xl opacity-40">⚡</div>
                <p className="text-slate-400 text-sm font-medium">Output appears instantly</p>
                <p className="text-slate-600 text-xs leading-relaxed max-w-xs">
                  Paste any docker-compose.yml on the left. Traefik labels will be added,
                  exposed ports removed, and secrets replaced with safe <code className="text-slate-400">${'{VAR}'}</code> placeholders.
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
            <div>
              <span className="text-sm font-semibold text-slate-700">Push to GitHub</span>
              <span className="ml-2 text-xs text-slate-400">saves the file to your repo → server auto-deploys within 60 s</span>
            </div>
          </div>
          {ghOpen
            ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" />
            : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
        </button>

        {ghOpen && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 mt-3 mb-4">
              Your token is <strong>never stored</strong> — cleared immediately after each push.{' '}
              Get one at: <span className="text-blue-600">GitHub → Settings → Developer settings → Personal access tokens → repo scope</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Tooltip text="GitHub Personal Access Token with 'repo' scope. Used once then cleared from memory.">
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

              <Field icon={<Github size={12} />} label="GitHub Username">
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
                  placeholder="traefik-gen"
                />
              </Field>

              <Tooltip text="Where the file goes in your repo. Auto-set to [app-name]/compose.yml to match the repo structure.">
                <Field icon={<FileText size={12} />} label="File Path" hint="auto-set">
                  <input
                    type="text"
                    value={ghPath}
                    onChange={(e) => { ghPathEdited.current = true; setGhPath(e.target.value); }}
                    className={inputCls}
                    placeholder="vaultwarden/compose.yml"
                  />
                </Field>
              </Tooltip>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!hasOutput}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Github size={14} />
                  Push to GitHub
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-amber-800">
                    Save to <strong className="font-mono">{ghOwner}/{ghRepo}/{ghPath}</strong>?
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
                <span className={`flex items-center gap-1.5 text-sm ${pushStatus.type === 'success' ? 'text-emerald-600' : 'text-amber-700'}`}>
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

import { useState } from 'react';
import {
  ChevronDown, ChevronUp, Copy, Check,
  Server, Network, Lock, RefreshCw, Zap,
} from 'lucide-react';

const GUIDE_KEY = 'traefikgen-guide-open';

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative mt-2 rounded-lg bg-slate-900 border border-slate-700 group">
      <button
        onClick={copy}
        className="absolute right-2 top-2 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
      <pre className="p-3 pr-10 text-xs font-mono text-emerald-300 whitespace-pre overflow-x-auto leading-relaxed">
        {code.trim()}
      </pre>
    </div>
  );
}

interface StepProps {
  num: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Step({ num, icon, title, children }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {num}
        </div>
        <div className="w-px flex-grow bg-slate-200 mt-2" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-slate-400">{icon}</span>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function GettingStarted() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(GUIDE_KEY) !== 'false'; } catch { return true; }
  });

  function toggle() {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(GUIDE_KEY, String(next)); } catch { /* ignore */ }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🚀</span>
          <div>
            <span className="text-sm font-semibold text-slate-800">Getting Started</span>
            <span className="ml-2 text-xs text-slate-400">one-time setup · takes ~5 minutes</span>
          </div>
        </div>
        {open
          ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" />
          : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pt-5 pb-2">
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            This repo is your <strong>source of truth</strong> for your home lab.
            Do these steps once — after that, all you do is paste, click Push, and your server updates automatically.
          </p>

          {/* Step 1 */}
          <Step num={1} icon={<Server size={14} />} title="Clone this repo onto your server (VPS)">
            <p className="text-xs text-slate-500 mb-1">SSH into your server, then run:</p>
            <CodeBlock code={`git clone https://github.com/cloudcap10/traefik-gen.git
cd traefik-gen`} />
          </Step>

          {/* Step 2 */}
          <Step num={2} icon={<Network size={14} />} title="Create the shared Docker network">
            <p className="text-xs text-slate-500 mb-1">
              Every app and Traefik itself will talk over this network.
            </p>
            <CodeBlock code="docker network create traefik-net" />
          </Step>

          {/* Step 3 */}
          <Step num={3} icon={<Lock size={14} />} title="Configure Traefik (already set up in traefik/)">
            <p className="text-xs text-slate-500 mb-1">
              The Traefik config is ready in <code className="bg-slate-100 px-1 rounded font-mono">traefik/</code>. You just need to fill in two things:
            </p>
            <div className="space-y-3 mt-2">
              <div>
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  a) Add your Cloudflare API Token
                </p>
                <CodeBlock code={`cd traefik
cp cf-token.example cf-token
nano cf-token        # Paste your Cloudflare DNS API token here`} />
                <p className="text-[11px] text-slate-400 mt-1">
                  Get it at: Cloudflare → My Profile → API Tokens → Create Token → "Edit zone DNS"
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  b) Set your email in traefik/config/traefik.yaml
                </p>
                <CodeBlock code={`nano config/traefik.yaml
# Change this line:
#   email: YOUR_EMAIL@EXAMPLE.COM
# To your real email (used for Let's Encrypt TLS certificates)`} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  c) Start Traefik
                </p>
                <CodeBlock code="docker compose up -d" />
                <p className="text-[11px] text-slate-400 mt-1">
                  Check it's running: <code className="bg-slate-100 px-1 rounded font-mono">docker ps | grep traefik</code>
                </p>
              </div>
            </div>
          </Step>

          {/* Step 4 */}
          <Step num={4} icon={<RefreshCw size={14} />} title="Enable auto-deploy (one command)">
            <p className="text-xs text-slate-500 mb-1">
              This sets up a cron job that checks GitHub every minute and deploys any new apps automatically.
            </p>
            <CodeBlock code={`cd ~/traefik-gen
(crontab -l 2>/dev/null; echo "* * * * * $(pwd)/auto-deploy.sh >> $(pwd)/deploy.log 2>&1") | crontab -`} />
            <p className="text-[11px] text-slate-400 mt-1">
              Verify it's set: <code className="bg-slate-100 px-1 rounded font-mono">crontab -l</code>
            </p>
          </Step>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                <Zap size={14} />
              </div>
            </div>
            <div className="pb-6 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-800">You're ready — use the generator below</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                To add any new app: <strong>Paste</strong> its compose file → <strong>set the App Name</strong> →
                point the DNS subdomain to your VPS IP in Cloudflare → <strong>Push to GitHub</strong>.
                Your server picks it up within 60 seconds.
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                <Check size={11} />
                Secrets are stripped before they reach GitHub — safe to commit
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

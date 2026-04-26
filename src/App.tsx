import { ExternalLink } from 'lucide-react';
import GeneratorUI from './components/GeneratorUI';
import GettingStarted from './components/GettingStarted';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-black text-lg leading-none">T</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">TraefikGen</h1>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full tracking-wide">v3</span>
              </div>
              <p className="text-xs text-slate-400 leading-tight">Docker Compose → Traefik labels in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
              {['Paste', 'Configure', 'Copy', 'Deploy'].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[11px]">{step}</span>
                  {i < arr.length - 1 && <span className="text-slate-300">→</span>}
                </span>
              ))}
            </div>
            <a
              href="https://github.com/cloudcap10/traefik-gen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ExternalLink size={13} />
              <span className="hidden md:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-6 flex flex-col gap-4 overflow-y-auto">
        <GettingStarted />
        <GeneratorUI />
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-8 text-center text-xs text-slate-400">
        TraefikGen — runs entirely in your browser. Nothing is sent to any server except GitHub when you choose to push.
      </footer>
    </div>
  );
}

export default App;

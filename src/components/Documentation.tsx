import React from 'react';

export const Documentation: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mt-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6 text-gray-900 border-b pb-4">🌟 TraefikGen: The Simple Guide</h2>
      
      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold text-blue-700">🚪 Traefik is your "Front Door"</h3>
          <p className="text-gray-700 leading-relaxed mt-2">
            In a professional Home Lab, you don't open 20 different doors (ports like 8000, 3001, 9000) to the internet. 
            You open <strong>ONE</strong> secure door: <strong>Traefik</strong>.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2 italic">
            This tool is a <strong>Smart Translator</strong>. When you paste a standard config, it removes those "Backdoor Ports" 
            and routes everything through Traefik's secure entrance with automatic SSL.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
            <span className="text-2xl">📋</span>
            <h4 className="font-bold text-blue-800 mt-2">1. Paste</h4>
            <p className="text-xs text-blue-700 mt-1">Paste any raw code from the internet.</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
            <span className="text-2xl">🪄</span>
            <h4 className="font-bold text-green-800 mt-2">2. Stamp</h4>
            <p className="text-xs text-green-700 mt-1">We add labels and lock the doors.</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-center">
            <span className="text-2xl">🌐</span>
            <h4 className="font-bold text-orange-800 mt-2">3. DNS</h4>
            <p className="text-xs text-orange-700 mt-1">Point your domain to your VPS.</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-center">
            <span className="text-2xl">🚀</span>
            <h4 className="font-bold text-purple-800 mt-2">4. Push</h4>
            <p className="text-xs text-purple-700 mt-1">One click to save to your GitHub.</p>
          </div>
        </section>

        <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-bold text-blue-800">🛡️ Why this is safer</h3>
          <ul className="mt-4 space-y-4 text-sm text-blue-900">
            <li>
              <strong>Automatic Port Stripping:</strong> The tool deletes <code>ports: - 8000:80</code>. This forces the app to hide behind Traefik, making it invisible to hackers scanning your IP.
            </li>
            <li>
              <strong>A+ Security Headers:</strong> Every app automatically inherits your server's master security rules (HSTS, XSS protection).
            </li>
            <li>
              <strong>Internal-Only Networking:</strong> Apps are placed on the <code>traefik-net</code>, so they can only talk to the Front Door, not the open internet.
            </li>
          </ul>
        </section>

        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 italic font-medium tracking-wide">
            DESIGNED FOR STABILITY. HARDENED FOR SECURITY. AUTOMATED FOR YOU.
          </p>
        </div>
      </div>
    </div>
  );
};

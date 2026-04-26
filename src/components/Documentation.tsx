import React from 'react';

export const Documentation: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mt-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6 text-gray-900 border-b pb-4">🌟 TraefikGen: The Simple Guide</h2>
      
      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold text-blue-700">🤔 What is this tool?</h3>
          <p className="text-gray-700 leading-relaxed mt-2">
            Think of this as a <strong>Translator</strong>. You find a "Standard" app config on the internet, 
            and this tool translates it into your <strong>"Production"</strong> config. It adds your domain, 
            your security rules, and your network automatically.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <span className="text-2xl">📋</span>
            <h4 className="font-bold text-blue-800 mt-2">1. Paste</h4>
            <p className="text-xs text-blue-700 mt-1">Paste any code you find online.</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <span className="text-2xl">🪄</span>
            <h4 className="font-bold text-green-800 mt-2">2. Stamp</h4>
            <p className="text-xs text-green-700 mt-1">Type a name. We add your server labels.</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <span className="text-2xl">🌐</span>
            <h4 className="font-bold text-orange-800 mt-2">3. DNS</h4>
            <p className="text-xs text-orange-700 mt-1">Point your domain to your VPS IP.</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <span className="text-2xl">🚀</span>
            <h4 className="font-bold text-purple-800 mt-2">4. Push</h4>
            <p className="text-xs text-purple-700 mt-1">One click to save to GitHub.</p>
          </div>
        </section>

        <section className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <h3 className="text-lg font-bold text-orange-800">⚠️ Critical DNS Step</h3>
          <p className="text-sm text-orange-700 mt-2">
            Traefik only works if traffic reaches it! After generating your config, you <strong>MUST</strong>:
          </p>
          <ul className="list-disc ml-6 mt-2 text-sm text-orange-700 space-y-1">
            <li>Log in to your DNS provider (e.g. Cloudflare).</li>
            <li>Create an <strong>A Record</strong> for your App Name (e.g. <code>my-app</code>).</li>
            <li>Point it to your <strong>VPS Public IP address</strong>.</li>
          </ul>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 underline underline-offset-4 decoration-blue-500">The "Magic" explained</h3>
          <ul className="mt-4 space-y-4 text-sm text-gray-700">
            <li>
              <strong>The "Include" line:</strong> This is a shortcut. It tells the app to use your server's global settings (networks and security) so you don't have to type them every time.
            </li>
            <li>
              <strong>SSL Resolver:</strong> This is the part of Traefik that talks to Cloudflare to get your secure <code>https</code> certificates automatically.
            </li>
          </ul>
        </section>

        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 italic">Built for the Home Lab Community. Secure. Automated. Stable.</p>
        </div>
      </div>
    </div>
  );
};

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

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <span className="text-2xl">📋</span>
            <h4 className="font-bold text-blue-800 mt-2">1. Paste</h4>
            <p className="text-sm text-blue-700 mt-1">Paste any compose file you find online.</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <span className="text-2xl">🪄</span>
            <h4 className="font-bold text-green-800 mt-2">2. Personalize</h4>
            <p className="text-sm text-green-700 mt-1">Type a name. We add the labels for you.</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <span className="text-2xl">🚀</span>
            <h4 className="font-bold text-purple-800 mt-2">3. Push</h4>
            <p className="text-sm text-purple-700 mt-1">One click to save it to your server's GitHub.</p>
          </div>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 underline underline-offset-4 decoration-blue-500">The "Magic" explained</h3>
          <ul className="mt-4 space-y-4 text-sm text-gray-700">
            <li>
              <strong>The "Include" line:</strong> This is a shortcut. It tells the app to use your server's global settings so you don't have to type them every time.
            </li>
            <li>
              <strong>HTTPS Redirect:</strong> The tool ensures that even if someone types <code>http</code>, they are safely moved to <code>https</code>.
            </li>
            <li>
              <strong>Secret Stripper:</strong> It searches for words like "Password" and hides them before they reach GitHub.
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

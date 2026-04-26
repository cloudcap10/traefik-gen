import React from 'react';

export const Documentation: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">📖 How to Use TraefikGen</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-blue-600">1. Setup Your "Engine" (First Time Only)</h3>
          <p className="text-gray-600 mt-1">
            Before using this tool, your server needs Traefik running. Use the configuration in the 
            <code className="bg-gray-100 px-1 rounded">traefik-base</code> folder of this repository.
          </p>
          <ul className="list-disc ml-6 mt-2 text-sm text-gray-600">
            <li>Create the network: <code className="bg-gray-100 px-1 rounded">docker network create traefik-net</code></li>
            <li>Deploy Traefik using the provided <code className="bg-gray-100 px-1 rounded">docker-compose.yml</code>.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-blue-600">2. Generate an App Config</h3>
          <p className="text-gray-600 mt-1">You have two ways to generate configs:</p>
          <ul className="list-disc ml-6 mt-2 text-sm text-gray-600">
            <li><strong>Manual:</strong> Enter the App Name, Image, and Port in the form.</li>
            <li><strong>Transform:</strong> Paste a raw <code className="bg-gray-100 px-1 rounded">docker-compose.yml</code> from the internet. The tool will inject your labels and strip secrets automatically.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-blue-600">3. Save to GitHub</h3>
          <p className="text-gray-600 mt-1">
            Fill in your GitHub details (Token, Repo, Path) and click <strong>"Push to GitHub"</strong>. 
            The file will be committed directly to your repository.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-blue-600">4. Auto-Deploy (Optional)</h3>
          <p className="text-gray-600 mt-1">
            Set up the <code className="bg-gray-100 px-1 rounded">auto-deploy.sh</code> script on your VPS to automatically 
            pull changes from GitHub and restart your containers every minute.
          </p>
        </section>
      </div>
    </div>
  );
};

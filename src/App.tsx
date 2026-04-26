import GeneratorUI from './components/GeneratorUI';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">TraefikGen</h1>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Docker Compose to Traefik v3 Label Generator
          </div>
        </div>
      </header>
      
      <main className="flex-grow max-w-7xl mx-auto w-full p-8 flex flex-col overflow-hidden">
        <GeneratorUI />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 px-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} TraefikGen Engine. Stitch-Ready UI.
      </footer>
    </div>
  )
}

export default App

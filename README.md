# TraefikGen 🚀

TraefikGen is a specialized web tool for automating the generation of Traefik-ready and GitHub-safe `docker-compose.yml` files. It is designed to match a stable production pattern using Traefik v2/v3, Docker networks, and Cloudflare DNS-based SSL.

## 🛠 Prerequisites (The Traefik Dependency)

This tool generates configuration files that **require** an existing Traefik setup. For the generated files to work, your server must have:

1.  **Traefik Running:** A Traefik container must already be active.
2.  **Docker Network:** An external Docker network named `traefik-net` must exist.
    ```bash
    docker network create traefik-net
    ```
3.  **TLS Resolver:** A certificate resolver named `cloudflare` (or your chosen name) must be configured in your main `traefik.yml` or labels.
4.  **Entrypoints:** An entrypoint named `websecure` must be defined for HTTPS traffic.

## 🚀 Getting Started

### Local Development
1. Clone the repository:
   ```bash
   git clone git@github.com:cloudcap10/traefik-gen.git
   cd traefik-gen
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

## 📖 Usage Guide

### 1. Global Settings
Enter your **Primary Domain** (e.g., `example.com`) and your **DNS Resolver** name (e.g., `cloudflare`). These are saved locally in your browser.

### 2. Modes of Operation
*   **Simple Form:** Quickly generate a new app by entering the Name, Image, and Port.
*   **Transform Mode (Paste):** Paste an existing `docker-compose.yml` (e.g., from an official documentation site). TraefikGen will:
    *   Inject your routing labels.
    *   Set the correct network.
    *   **Strip Secrets:** Automatically replace sensitive environment variables (passwords, tokens) with placeholders like `${DB_PASSWORD}` to keep your GitHub repo safe.

### 3. Pushing to GitHub
1. Enter your **GitHub Personal Access Token (PAT)**.
2. Enter the **Repo Owner**, **Repo Name**, and the **File Path** (e.g., `apps/vaultwarden/docker-compose.yml`).
3. Click **"Push to GitHub"**. The app will commit the file directly to your repository.

## 🔒 Security & Privacy
- **Client-Side Only:** All processing happens in your browser. Your API keys and secrets are never sent to any server other than GitHub's official API.
- **Secret Stripping:** The tool scans for common sensitive keywords (`PASS`, `SECRET`, `KEY`, `TOKEN`, `AUTH`) and prevents them from being saved to your repository.

## 🌐 Deployment (Cloudflare Pages)
This app is optimized for deployment on Cloudflare Pages. Simply connect your GitHub repository to Cloudflare Pages and use the following settings:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

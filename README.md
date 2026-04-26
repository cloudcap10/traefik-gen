# TraefikGen 🚀

The ultimate "Source of Truth" template for your Home Lab. Move from manual edits to an automated **GitOps** workflow.

---

## 🚦 Quick Start Guide (For New Users)

### 1. On your Server (VPS)
1. **Clone your new repo:** `git clone <your-repo-url>`
2. **Create the network:** `docker network create traefik-net`
3. **Configure Traefik:**
   - Go to `traefik-base/`.
   - Copy `.env.example` to `.env` and fill it in.
   - Copy `cf-token.example` to `cf-token` and paste your Cloudflare API token.
   - Edit `config/traefik.yaml` and put your real email.
4. **Start the Engine:** `docker compose up -d`

### 2. Setup Auto-Deployment
Run this command once to let your server check GitHub for updates every minute:
```bash
(crontab -l 2>/dev/null; echo "* * * * * $(pwd)/auto-deploy.sh >> $(pwd)/deploy.log 2>&1") | crontab -
```

### 3. Use the Web Generator
**Open the Tool:** [https://cloudcap10.github.io/traefik-gen/](https://cloudcap10.github.io/traefik-gen/)

1. **Paste** a compose file you found online.
2. **Personalize** the App Name.
3. **DNS:** Point your subdomain to your VPS IP in Cloudflare.
4. **Push:** Click "Push to GitHub". 

**Result:** Your server will see the update and start the app automatically within 60 seconds!

---

## 🔒 Security
- **Docker Secrets:** Your Cloudflare token is stored in a secure file, not an environment variable.
- **Hardened:** All apps automatically get `no-new-privileges` and A+ Security Headers.
- **Secret Stripping:** The web tool hides your passwords before they reach GitHub.

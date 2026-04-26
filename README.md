# TraefikGen 🚀

TraefikGen is a specialized web tool for automating the generation of Traefik-ready and GitHub-safe `docker-compose.yml` files.

---

## 🚦 Beginner's Guide: Zero to Traefik

If you are a beginner, follow these steps in order to get your server running.

### Step 0: Create the Network
Traefik and your apps need a "private hallway" to talk to each other.
```bash
docker network create traefik-net
```

### Step 1: Deploy the "Engine" (Traefik)
1. Go to the `traefik-base` folder in this repo.
2. Edit `data/traefik.yml` and change `your-email@example.com` to your real email.
3. Create a `.env` file in that folder:
   ```env
   CF_DNS_API_TOKEN=your_cloudflare_token_here
   DOMAIN=yourdomain.com
   ```
4. Run it: `docker-compose up -d`

### Step 2: Use the TraefikGen Web Tool
Now that Traefik is running, use our web tool to generate "App" configs.
**Live Tool:** [https://cloudcap10.github.io/traefik-gen/](https://cloudcap10.github.io/traefik-gen/)

1. Paste any `docker-compose.yml` you find on the internet into the tool.
2. The tool automatically adds the labels that tell the "Engine" (from Step 1) how to route traffic and get SSL certs.
3. Push the result to GitHub.

---

## 🛠 Prerequisites Summary
- A Cloudflare account (for DNS-based SSL).
- A VPS with Docker and Docker Compose installed.
- The `traefik-net` network created.

## 🔒 Security
TraefikGen automatically strips your passwords and tokens from the `environment:` section and replaces them with variables (e.g., ${DB_PASSWORD}) so you can safely share your configs on GitHub!

# Damcash v2 — Production Deployment Guide

## Architecture Overview

```
Internet → Nginx/CDN
                ├── static files → Vite/React (built to /dist)
                └── /api/*       → Deno backend (port 8000)
                    └── /ws      → WebSocket
```

---

## 1. Environment Setup

### Frontend (`.env.production`)
Copy `.env.production.template` to `.env.production` and fill in your real values:

```bash
cp .env.production.template .env.production
nano .env.production
```

> [!CAUTION]
> **NEVER commit `.env` or `.env.production` to git.** Check your `.gitignore`.

### Backend environment variables
Set these on your server or hosting platform:

| Variable | Description |
|----------|-------------|
| `ADMIN_SECRET` | Strong random secret (min 32 chars). Must match `VITE_ADMIN_SECRET` in frontend |
| `ALLOWED_ORIGIN` | Your frontend domain e.g. `https://damcash.com` |
| `PORT` | Backend port (default: 8000) |

Generate a strong secret:
```bash
openssl rand -hex 32
```

---

## 2. Build Frontend

```bash
# Install dependencies
npm ci

# Build for production (strips console.logs, splits chunks)
npm run build

# Preview locally to verify
npm run preview
```

Build output goes to `/dist`. Upload this to Netlify, Vercel, or your server.

---

## 3. Deploy Backend (Deno)

### Option A — Deno Deploy (recommended, free tier)
1. Push backend to a GitHub repo
2. Go to [deno.com/deploy](https://deno.com/deploy) → New Project
3. Select `backend/src/main.ts` as entrypoint
4. Set environment variables in the Deno Deploy dashboard

### Option B — VPS (DigitalOcean / Hetzner)
```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Run with systemd
sudo nano /etc/systemd/system/damcash-api.service
```

```ini
[Unit]
Description=Damcash API
After=network.target

[Service]
User=www-data
WorkingDirectory=/srv/damcash/backend
ExecStart=/usr/local/bin/deno run --allow-net --allow-read --allow-env src/main.ts
Restart=always
Environment=ADMIN_SECRET=your_strong_secret_here
Environment=ALLOWED_ORIGIN=https://damcash.com

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable damcash-api
sudo systemctl start damcash-api
```

---

## 4. Nginx Config (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name damcash.com www.damcash.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name damcash.com;

    ssl_certificate     /etc/letsencrypt/live/damcash.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/damcash.com/privkey.pem;

    # Frontend static files
    root /srv/damcash/dist;
    index index.html;

    # React SPA — fallback to index.html for client-side routing
    location / {
        try_files $uri $uri/ /index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        add_header Referrer-Policy "strict-origin-when-cross-origin";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com;";

        # Cache static assets for 1 year
        location ~* \.(js|css|png|jpg|svg|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

---

## 5. Netlify (Frontend Only)

If deploying frontend to Netlify and backend separately:

**`netlify.toml`** (create in project root):
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 6. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d damcash.com -d www.damcash.com
```

---

## 7. Pre-Launch Security Checklist

- [ ] `.env` / `.env.production` are in `.gitignore`
- [ ] `ADMIN_SECRET` changed from default to strong random value
- [ ] `ALLOWED_ORIGIN` set to your real domain (not `*`)
- [ ] `VITE_STRIPE_PUBLIC_KEY` is the **live** key (not test `pk_test_`)
- [ ] Supabase project switched to **production** with RLS enabled
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Backend health check reachable: `GET https://api.yourdomain.com/health`
- [ ] Admin dashboard accessible only from admin email
- [ ] No `console.log` in frontend (Vite strips them automatically in production build)

---

## 8. Quick Commands Reference

```bash
# Build frontend
npm run build

# Run backend locally
npm run backend

# Check backend health
curl https://api.yourdomain.com/health

# Test admin API
curl -H "X-Admin-Secret: YOUR_SECRET" https://api.yourdomain.com/api/admin/stats
```

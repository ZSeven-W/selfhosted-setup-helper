# 🐳 Selfhosted Setup Helper

> One-click Docker deployment wizard for self-hosted services. No more Googling "how to install Jellyfin with Docker".

## Features

- 🎯 **Interactive Wizard** — TUI-driven setup with ASCII art and color output
- 📦 **12 Pre-configured Services** — Nginx Proxy Manager, PostgreSQL, Redis, Jellyfin, Home Assistant, AdGuard Home, Gitea, Vaultwarden, Nextcloud, Portainer
- 🎬 **Smart Bundles** — Media Stack, Dev Stack, Home Stack, Full Stack
- 🔍 **Port Conflict Detection** — Auto-finds free ports when defaults are taken
- 🛡️ **Validation** — Runs `docker compose config --dry-run` before finishing
- 💾 **Backup Scripts** — Auto-generated per-service backup scripts
- ⚡ **Quick Mode** — `selfhosted quick media-stack` for non-interactive generation

## Quick Start

```bash
# Interactive wizard
npx ts-node src/index.ts wizard

# Or install globally
npm install -g
selfhosted wizard

# Quick generate a bundle
selfhosted quick media-stack

# List all services
selfhosted list

# Check Docker & port status
selfhosted check
```

## Services

| Service | Port | Category | Description |
|---------|------|----------|-------------|
| Nginx Proxy Manager | 80, 81, 443 | Network | Reverse proxy + free SSL |
| PostgreSQL | 5432 | Dev | Production database |
| Redis | 6379 | Dev | In-memory cache |
| Jellyfin | 8096 | Media | Media system |
| Home Assistant | 8123 | Media | Home automation |
| AdGuard Home | 53, 3000 | Network | DNS ad-blocker |
| Gitea | 3000 | Dev | Self-hosted Git |
| Vaultwarden | 8080 | Security | Password manager |
| Nextcloud | 8080 | Storage | File sync & productivity |
| Portainer | 9000 | Dev | Docker management UI |

## Bundles

```
selfhosted quick media-stack   # Jellyfin + AdGuard
selfhosted quick dev-stack    # Gitea + PostgreSQL + Redis
selfhosted quick home-stack   # HomeAssistant + AdGuard + Vaultwarden
selfhosted quick full-stack   # Everything
```

## Output

After running `selfhosted wizard`, you'll get:

```
selfhosted-output/
├── docker-compose.yml   # Ready to run
├── .env                # Environment variables
└── backup.sh           # Run to backup all services
```

Then:
```bash
cd selfhosted-output
docker compose up -d
```

## Requirements

- Node.js >= 18
- Docker + Docker Compose V2

## License

MIT

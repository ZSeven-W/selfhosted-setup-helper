"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORIES = exports.BUNDLES = exports.SERVICES = void 0;
exports.SERVICES = {
    'nginx-proxy-manager': {
        name: 'Nginx Proxy Manager',
        version: 'latest',
        category: 'network',
        description: 'Reverse proxy with free SSL via Let\'s Encrypt',
        ports: [
            { host: 80, container: 80, protocol: 'tcp' },
            { host: 81, container: 81, protocol: 'tcp' },
            { host: 443, container: 443, protocol: 'tcp' },
        ],
        volumes: [
            { host: './data/nginx-proxy-manager/data', container: '/data' },
            { host: './data/nginx-proxy-manager/letsencrypt', container: '/letsencrypt' },
        ],
        envVars: [
            { key: 'PUID', description: 'User ID', default: '1000' },
            { key: 'PGID', description: 'Group ID', default: '1000' },
        ],
        healthCheck: 'curl -f http://localhost:81/ || exit 1',
        composeTemplate: (v) => `services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data/nginx-proxy-manager/data:/data
      - ./data/nginx-proxy-manager/letsencrypt:/letsencrypt
    environment:
      PUID: ${v['PUID'] || '1000'}
      PGID: ${v['PGID'] || '1000'}
      DB_MYSQL_HOST: 'nginx-proxy-manager-db'
      DB_MYSQL_PORT: 3306
      DB_MYSQL_USER: 'npm'
      DB_MYSQL_PASSWORD: '${v['DB_MYSQL_PASSWORD'] || 'npm_password'}'
      DB_MYSQL_NAME: 'npm'

  nginx-proxy-manager-db:
    image: 'jc21/mariadb:latest'
    container_name: nginx-proxy-manager-db
    restart: unless-stopped
    volumes:
      - ./data/nginx-proxy-manager/mysql:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: '${v['MYSQL_ROOT_PASSWORD'] || 'root_password'}'
      MYSQL_DATABASE: 'npm'
      MYSQL_USER: 'npm'
      MYSQL_PASSWORD: '${v['DB_MYSQL_PASSWORD'] || 'npm_password'}'`,
        backupScript: (v) => `#!/bin/bash
# Backup Nginx Proxy Manager
BACKUP_DIR="./backups/nginx-proxy-manager"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/npm-$(date +%Y%m%d-%H%M%S).tar.gz" \
  ./data/nginx-proxy-manager/data \
  ./data/nginx-proxy-manager/letsencrypt
echo "Backup saved to $BACKUP_DIR"`,
    },
    postgresql: {
        name: 'PostgreSQL',
        version: '16-alpine',
        category: 'dev',
        description: 'Production-ready PostgreSQL database',
        ports: [{ host: 5432, container: 5432, protocol: 'tcp' }],
        volumes: [
            { host: './data/postgres/data', container: '/var/lib/postgresql/data' },
        ],
        envVars: [
            { key: 'POSTGRES_USER', description: 'Database user', default: 'admin', required: true },
            { key: 'POSTGRES_PASSWORD', description: 'Database password', required: true },
            { key: 'POSTGRES_DB', description: 'Database name', default: 'app' },
        ],
        healthCheck: 'pg_isready -U ${POSTGRES_USER}',
        composeTemplate: (v) => `services:
  postgres:
    image: postgres:${v['version'] || '16-alpine'}
    container_name: postgres
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '5432'}:5432'
    volumes:
      - ./data/postgres/data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${v['POSTGRES_USER'] || 'admin'}
      POSTGRES_PASSWORD: ${v['POSTGRES_PASSWORD'] || 'change_me'}
      POSTGRES_DB: ${v['POSTGRES_DB'] || 'app'}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${v['POSTGRES_USER'] || 'admin'}"]
      interval: 10s
      timeout: 5s
      retries: 5`,
        backupScript: () => `#!/bin/bash
# Backup PostgreSQL
BACKUP_DIR="./backups/postgres"
mkdir -p "$BACKUP_DIR"
docker exec postgres pg_dump -U admin app | gzip > "$BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql.gz"
echo "Backup saved to $BACKUP_DIR"`,
    },
    redis: {
        name: 'Redis',
        version: '7-alpine',
        category: 'dev',
        description: 'In-memory data store for caching and sessions',
        ports: [{ host: 6379, container: 6379, protocol: 'tcp' }],
        volumes: [
            { host: './data/redis/data', container: '/data' },
        ],
        envVars: [
            { key: 'REDIS_PASSWORD', description: 'Redis password', required: true },
        ],
        healthCheck: 'redis-cli ping',
        composeTemplate: (v) => `services:
  redis:
    image: redis:${v['version'] || '7-alpine'}
    container_name: redis
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '6379'}:6379'
    volumes:
      - ./data/redis/data:/data
    command: redis-server --requirepass ${v['REDIS_PASSWORD'] || 'change_me'}
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${v['REDIS_PASSWORD'] || 'change_me'}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5`,
        backupScript: () => `#!/bin/bash
# Backup Redis
BACKUP_DIR="./backups/redis"
mkdir -p "$BACKUP_DIR"
docker exec redis redis-cli SAVE
docker cp redis:/data/dump.rdb "$BACKUP_DIR/dump-$(date +%Y%m%d-%H%M%S).rdb"
echo "Backup saved to $BACKUP_DIR"`,
    },
    jellyfin: {
        name: 'Jellyfin',
        version: 'latest',
        category: 'media',
        description: 'Free software media system for movies, TV, music & books',
        ports: [
            { host: 8096, container: 8096, protocol: 'tcp' },
            { host: 8920, container: 8920, protocol: 'tcp' },
        ],
        volumes: [
            { host: './data/jellyfin/config', container: '/config' },
            { host: './data/jellyfin/cache', container: '/cache' },
            { host: './media', container: '/media' },
        ],
        envVars: [
            { key: 'PUID', description: 'User ID', default: '1000' },
            { key: 'PGID', description: 'Group ID', default: '1000' },
        ],
        healthCheck: 'curl -f http://localhost:8096/health || exit 1',
        composeTemplate: (v) => `services:
  jellyfin:
    image: jellyfin/jellyfin:${v['version'] || 'latest'}
    container_name: jellyfin
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '8096'}:8096'
      - '8920:8920'
    volumes:
      - ./data/jellyfin/config:/config
      - ./data/jellyfin/cache:/cache
      - ./media:/media
    environment:
      PUID: ${v['PUID'] || '1000'}
      PGID: ${v['PGID'] || '1000'}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8096/health"]
      interval: 30s
      timeout: 10s
      retries: 3`,
        backupScript: () => `#!/bin/bash
# Backup Jellyfin
BACKUP_DIR="./backups/jellyfin"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/jellyfin-$(date +%Y%m%d-%H%M%S).tar.gz" \
  ./data/jellyfin/config \
  ./data/jellyfin/cache
echo "Backup saved to $BACKUP_DIR"`,
    },
    homeassistant: {
        name: 'Home Assistant',
        version: 'latest',
        category: 'media',
        description: 'Open source home automation platform',
        ports: [{ host: 8123, container: 8123, protocol: 'tcp' }],
        volumes: [
            { host: './data/homeassistant/config', container: '/config' },
            { host: '/etc/localtime:/etc/localtime:ro', container: '/etc/localtime' },
            { host: '/run/dbus:/run/dbus:ro', container: '/run/dbus' },
        ],
        envVars: [],
        healthCheck: 'curl -f http://localhost:8123/ || exit 1',
        composeTemplate: (v) => `services:
  homeassistant:
    image: homeassistant/home-assistant:${v['version'] || 'latest'}
    container_name: homeassistant
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '8123'}:8123'
    volumes:
      - ./data/homeassistant/config:/config
      - /etc/localtime:/etc/localtime:ro
      - /run/dbus:/run/dbus:ro
    network_mode: host
    privileged: true
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8123/"]
      interval: 30s
      timeout: 10s
      retries: 3`,
        backupScript: () => `#!/bin/bash
# Backup Home Assistant
BACKUP_DIR="./backups/homeassistant"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/homeassistant-$(date +%Y%m%d-%H%M%S).tar.gz" \
  ./data/homeassistant/config
echo "Backup saved to $BACKUP_DIR"`,
    },
    adguard: {
        name: 'AdGuard Home',
        version: 'latest',
        category: 'network',
        description: 'Network-wide ad & tracker blocking DNS server',
        ports: [
            { host: 53, container: 53, protocol: 'tcp' },
            { host: 53, container: 53, protocol: 'udp' },
            { host: 3000, container: 3000, protocol: 'tcp' },
            { host: 853, container: 853, protocol: 'tcp' },
        ],
        volumes: [
            { host: './data/adguard/work', container: '/opt/adguard/work' },
            { host: './data/adguard/conf', container: '/opt/adguard/conf' },
        ],
        envVars: [],
        healthCheck: 'curl -f http://localhost:3000/ || exit 1',
        composeTemplate: (v) => `services:
  adguard:
    image: adguard/adguardhome:${v['version'] || 'latest'}
    container_name: adguard
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '3000'}:3000'
      - '53:53/tcp'
      - '53:53/udp'
      - '853:853/tcp'
    volumes:
      - ./data/adguard/work:/opt/adguard/work
      - ./data/adguard/conf:/opt/adguard/conf`,
        backupScript: () => `#!/bin/bash
# Backup AdGuard Home
BACKUP_DIR="./backups/adguard"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/adguard-$(date +%Y%m%d-%H%M%S).tar.gz" \
  ./data/adguard/work \
  ./data/adguard/conf
echo "Backup saved to $BACKUP_DIR"`,
    },
    gitea: {
        name: 'Gitea',
        version: '1.22',
        category: 'dev',
        description: 'Self-hosted Git service, lightweight GitHub alternative',
        ports: [
            { host: 3000, container: 3000, protocol: 'tcp' },
            { host: 2222, container: 22, protocol: 'tcp' },
        ],
        volumes: [
            { host: './data/gitea/repos', container: '/data/git/repositories' },
            { host: './data/gitea/data', container: '/data/gitea' },
        ],
        envVars: [
            { key: 'GITEA__database__DB_TYPE', description: 'Database type', default: 'sqlite3' },
            { key: 'GITEA__server__ROOT_URL', description: 'Root URL', default: 'http://localhost:3000' },
            { key: 'GITEA__server__HTTP_PORT', description: 'HTTP port', default: '3000' },
            { key: 'GITEA__server__SSH_PORT', description: 'SSH port', default: '2222' },
        ],
        healthCheck: 'curl -f http://localhost:3000/ || exit 1',
        dependsOn: [],
        composeTemplate: (v) => `services:
  gitea:
    image: gitea/gitea:${v['version'] || '1.22'}
    container_name: gitea
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '3000'}:3000'
      - '2222:22'
    volumes:
      - ./data/gitea/repos:/data/git/repositories
      - ./data/gitea/data:/data/gitea
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    environment:
      - GITEA__database__DB_TYPE=${v['GITEA__database__DB_TYPE'] || 'sqlite3'}
      - GITEA__server__ROOT_URL=${v['GITEA__server__ROOT_URL'] || 'http://localhost:3000'}
      - GITEA__server__HTTP_PORT=${v['GITEA__server__HTTP_PORT'] || '3000'}
      - GITEA__server__SSH_PORT=${v['GITEA__server__SSH_PORT'] || '2222'}
      - GITEA__security__INSTALL_LOCK=true
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3`,
        backupScript: () => `#!/bin/bash
# Backup Gitea
BACKUP_DIR="./backups/gitea"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/gitea-$(date +%Y%m%d-%H%M%S).tar.gz" \
  ./data/gitea/data \
  ./data/gitea/repos
echo "Backup saved to $BACKUP_DIR"`,
    },
    vaultwarden: {
        name: 'Vaultwarden',
        version: '1.32',
        category: 'security',
        description: 'Self-hosted Bitwarden® compatible password manager',
        ports: [{ host: 8080, container: 80, protocol: 'tcp' }],
        volumes: [
            { host: './data/vaultwarden/data', container: '/data' },
        ],
        envVars: [
            { key: 'SIGNUPS_ALLOWED', description: 'Allow new signups', default: 'true' },
            { key: 'ADMIN_TOKEN', description: 'Admin panel token (generate with: openssl rand -base64 48)', required: true },
        ],
        healthCheck: 'curl -f http://localhost:8080/ || exit 1',
        composeTemplate: (v) => `services:
  vaultwarden:
    image: vaultwarden/server:${v['version'] || '1.32'}
    container_name: vaultwarden
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '8080'}:80'
    volumes:
      - ./data/vaultwarden/data:/data
    environment:
      SIGNUPS_ALLOWED: ${v['SIGNUPS_ALLOWED'] || 'true'}
      ADMIN_TOKEN: ${v['ADMIN_TOKEN'] || ''}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 3`,
        backupScript: () => `#!/bin/bash
# Backup Vaultwarden
BACKUP_DIR="./backups/vaultwarden"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/vaultwarden-$(date +%Y%m%d-%H%M%S).tar.gz" \
  ./data/vaultwarden/data
echo "Backup saved to $BACKUP_DIR"`,
    },
    nextcloud: {
        name: 'Nextcloud',
        version: '29',
        category: 'storage',
        description: 'Self-hosted productivity platform with files, chat, calendar & more',
        ports: [{ host: 8080, container: 80, protocol: 'tcp' }],
        volumes: [
            { host: './data/nextcloud/html', container: '/var/www/html' },
            { host: './data/nextcloud/data', container: '/var/www/data' },
            { host: './data/nextcloud/config', container: '/var/www/config' },
        ],
        dependsOn: ['postgres'],
        envVars: [
            { key: 'MYSQL_HOST', description: 'Database host', default: 'postgres' },
            { key: 'MYSQL_DATABASE', description: 'Database name', default: 'nextcloud' },
            { key: 'MYSQL_USER', description: 'Database user', default: 'nextcloud' },
            { key: 'MYSQL_PASSWORD', description: 'Database password', required: true },
        ],
        healthCheck: 'curl -f http://localhost:8080/ || exit 1',
        composeTemplate: (v) => `services:
  nextcloud:
    image: nextcloud:${v['version'] || '29'}
    container_name: nextcloud
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '8080'}:80'
    volumes:
      - ./data/nextcloud/html:/var/www/html
      - ./data/nextcloud/data:/var/www/data
      - ./data/nextcloud/config:/var/www/config
    environment:
      MYSQL_HOST: ${v['MYSQL_HOST'] || 'postgres'}
      MYSQL_DATABASE: ${v['MYSQL_DATABASE'] || 'nextcloud'}
      MYSQL_USER: ${v['MYSQL_USER'] || 'nextcloud'}
      MYSQL_PASSWORD: ${v['MYSQL_PASSWORD'] || ''}
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:${v['postgres_version'] || '16-alpine'}
    container_name: nextcloud-db
    restart: unless-stopped
    volumes:
      - ./data/nextcloud-db:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${v['MYSQL_DATABASE'] || 'nextcloud'}
      POSTGRES_USER: ${v['MYSQL_USER'] || 'nextcloud'}
      POSTGRES_PASSWORD: ${v['MYSQL_PASSWORD'] || ''}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${v['MYSQL_USER'] || 'nextcloud'}"]
      interval: 10s
      timeout: 5s
      retries: 5`,
        backupScript: () => `#!/bin/bash
# Backup Nextcloud
BACKUP_DIR="./backups/nextcloud"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/nextcloud-$(date +%Y%m%d-%H%M%S).tar.gz" \
  ./data/nextcloud/html \
  ./data/nextcloud/data \
  ./data/nextcloud/config
docker exec nextcloud-db pg_dump -U nextcloud nextcloud | gzip > "$BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql.gz"
echo "Backup saved to $BACKUP_DIR"`,
    },
    portainer: {
        name: 'Portainer',
        version: 'latest',
        category: 'dev',
        description: 'Container management UI for Docker and Kubernetes',
        ports: [{ host: 9000, container: 9000, protocol: 'tcp' }],
        volumes: [
            { host: '/var/run/docker.sock', container: '/var/run/docker.sock' },
            { host: './data/portainer/data', container: '/data' },
        ],
        envVars: [],
        healthCheck: 'curl -f http://localhost:9000/ || exit 1',
        composeTemplate: (v) => `services:
  portainer:
    image: portainer/portainer-ce:${v['version'] || 'latest'}
    container_name: portainer
    restart: unless-stopped
    ports:
      - '${v['PORT'] || '9000'}:9000'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data/portainer/data:/data
    command: --http-enabled
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/"]
      interval: 30s
      timeout: 10s
      retries: 3`,
        backupScript: () => `#!/bin/bash
# Backup Portainer
BACKUP_DIR="./backups/portainer"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/portainer-$(date +%Y%m%d-%H%M%S).tar.gz" \
  ./data/portainer/data
echo "Backup saved to $BACKUP_DIR"`,
    },
};
exports.BUNDLES = {
    'media-stack': {
        name: '🎬 Media Stack',
        description: 'Jellyfin + AdGuard Home (complete media & ad-blocking setup)',
        services: ['jellyfin', 'adguard'],
    },
    'dev-stack': {
        name: '💻 Dev Stack',
        description: 'Gitea + PostgreSQL + Redis (full dev environment)',
        services: ['gitea', 'postgresql', 'redis'],
    },
    'home-stack': {
        name: '🏠 Home Stack',
        description: 'Home Assistant + AdGuard + Vaultwarden (smart home & security)',
        services: ['homeassistant', 'adguard', 'vaultwarden'],
    },
    'full-stack': {
        name: '🚀 Full Stack',
        description: 'Everything: Gitea + Jellyfin + HomeAssistant + Vaultwarden + AdGuard + Nginx Proxy Manager',
        services: ['gitea', 'jellyfin', 'homeassistant', 'vaultwarden', 'adguard', 'nginx-proxy-manager'],
    },
};
exports.CATEGORIES = [
    { key: 'all', label: 'All Services', emoji: '🌐' },
    { key: 'media', label: 'Media', emoji: '🎬' },
    { key: 'dev', label: 'Development', emoji: '💻' },
    { key: 'network', label: 'Network', emoji: '🔗' },
    { key: 'storage', label: 'Storage', emoji: '💾' },
    { key: 'security', label: 'Security', emoji: '🔒' },
];
//# sourceMappingURL=index.js.map
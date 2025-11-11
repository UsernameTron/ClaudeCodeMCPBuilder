# Deployment Guide

Complete guide for deploying the ISPN Helpdesk Bridge MCP Server to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Building for Production](#building-for-production)
4. [Process Management](#process-management)
5. [Reverse Proxy Setup](#reverse-proxy-setup)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Logging](#logging)
9. [Backup & Recovery](#backup--recovery)
10. [Scaling Strategies](#scaling-strategies)
11. [Security Checklist](#security-checklist)

---

## Prerequisites

### System Requirements

- **Node.js:** >= 18.0.0 (LTS recommended)
- **npm:** >= 9.0.0
- **Memory:** 512 MB minimum, 1 GB recommended
- **Disk:** 500 MB for application + logs
- **OS:** Linux (Ubuntu 20.04+, CentOS 8+, Debian 11+) or macOS

### Network Requirements

- **HTTP API:** Port 3000 (configurable via `PORT` env var)
- **MCP Server:** Stdio transport (no network port)
- **Outbound:** HTTPS access to helpdesk API

### Dependencies

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential git curl

# CentOS/RHEL
sudo yum install -y gcc-c++ make git curl

# Install Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

---

## Environment Setup

### 1. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/yourorg/ispn-helpdesk-mcp.git
cd ispn-helpdesk-mcp
```

### 2. Install Dependencies

```bash
npm ci --production
```

**Note:** Use `npm ci` (not `npm install`) for deterministic builds.

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env

# Generate secure secrets
export AUTH_TOKEN=$(openssl rand -hex 32)
export WEBHOOK_SECRET=$(openssl rand -hex 32)

# Update .env file
nano .env
```

**Required Changes:**
- `AUTH_TOKEN` - Use generated value
- `WEBHOOK_SECRET` - Use generated value
- `HELPDESK_API_URL` - Your helpdesk system URL
- `HELPDESK_API_KEY` - Your helpdesk API key
- `NODE_ENV=production`
- `LOG_LEVEL=info` (or `warn` for less verbosity)

**Security:**
```bash
# Restrict .env permissions
chmod 600 .env
chown appuser:appuser .env
```

### 4. Create Service User

```bash
# Create dedicated user (no shell access)
sudo useradd -r -s /bin/false -d /opt/ispn-helpdesk-mcp appuser
sudo chown -R appuser:appuser /opt/ispn-helpdesk-mcp
```

---

## Building for Production

### Compile TypeScript

```bash
# Run as appuser
sudo -u appuser npm run build
```

**Output:** Compiled JavaScript in `dist/` directory

### Verify Build

```bash
# Check dist directory
ls -la dist/

# Expected files:
# - dist/mcp-server.js
# - dist/http-server.js
# - dist/tools/*.js
# - dist/services/*.js
# - dist/schemas/*.js
# - dist/middleware/*.js
# - dist/routes/*.js
# - dist/utils/*.js
# - dist/errors/*.js
# - dist/types/*.js
```

---

## Process Management

### Option 1: PM2 (Recommended)

#### Install PM2

```bash
sudo npm install -g pm2
```

#### Create PM2 Ecosystem File

**File:** `ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'ispn-http',
      script: 'dist/http-server.js',
      cwd: '/opt/ispn-helpdesk-mcp',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/ispn-helpdesk/http-error.log',
      out_file: '/var/log/ispn-helpdesk/http-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_memory_restart: '512M',
      watch: false
    },
    {
      name: 'ispn-mcp',
      script: 'dist/mcp-server.js',
      cwd: '/opt/ispn-helpdesk-mcp',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/ispn-helpdesk/mcp-error.log',
      out_file: '/var/log/ispn-helpdesk/mcp-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_memory_restart: '256M',
      watch: false
    }
  ]
};
```

#### Start Services

```bash
# Create log directory
sudo mkdir -p /var/log/ispn-helpdesk
sudo chown appuser:appuser /var/log/ispn-helpdesk

# Start as appuser
sudo -u appuser pm2 start ecosystem.config.js

# Save PM2 configuration
sudo -u appuser pm2 save

# Setup PM2 startup script
sudo pm2 startup systemd -u appuser --hp /home/appuser
```

#### PM2 Management Commands

```bash
# Status
pm2 status

# Logs
pm2 logs ispn-http
pm2 logs ispn-mcp

# Restart
pm2 restart ispn-http
pm2 restart ispn-mcp

# Stop
pm2 stop ispn-http
pm2 stop ispn-mcp

# Delete
pm2 delete ispn-http
pm2 delete ispn-mcp

# Monitoring
pm2 monit
```

### Option 2: Systemd

#### Create Service Files

**File:** `/etc/systemd/system/ispn-http.service`

```ini
[Unit]
Description=ISPN Helpdesk Bridge HTTP Server
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/ispn-helpdesk-mcp
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/opt/ispn-helpdesk-mcp/.env
ExecStart=/usr/bin/node /opt/ispn-helpdesk-mcp/dist/http-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ispn-http

[Install]
WantedBy=multi-user.target
```

**File:** `/etc/systemd/system/ispn-mcp.service`

```ini
[Unit]
Description=ISPN Helpdesk Bridge MCP Server
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/ispn-helpdesk-mcp
Environment=NODE_ENV=production
EnvironmentFile=/opt/ispn-helpdesk-mcp/.env
ExecStart=/usr/bin/node /opt/ispn-helpdesk-mcp/dist/mcp-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ispn-mcp

[Install]
WantedBy=multi-user.target
```

#### Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable ispn-http
sudo systemctl enable ispn-mcp

# Start services
sudo systemctl start ispn-http
sudo systemctl start ispn-mcp

# Check status
sudo systemctl status ispn-http
sudo systemctl status ispn-mcp

# View logs
sudo journalctl -u ispn-http -f
sudo journalctl -u ispn-mcp -f
```

---

## Reverse Proxy Setup

### nginx Configuration

**File:** `/etc/nginx/sites-available/ispn-helpdesk`

```nginx
upstream ispn_http {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    server_name api.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL Configuration (see SSL/TLS section)
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/ispn-access.log combined;
    error_log /var/log/nginx/ispn-error.log warn;

    # Health Checks (no auth required)
    location /healthz {
        proxy_pass http://ispn_http;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        access_log off;
    }

    location /readyz {
        proxy_pass http://ispn_http;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        access_log off;
    }

    # API Endpoints
    location /ingest/ {
        proxy_pass http://ispn_http;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Request size limits
        client_max_body_size 1M;
    }
}
```

**Enable Site:**

```bash
sudo ln -s /etc/nginx/sites-available/ispn-helpdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.example.com

# Auto-renewal (crontab)
sudo crontab -e
# Add line:
0 0 1 * * certbot renew --quiet
```

### Option 2: Custom Certificate

```bash
# Place certificates
sudo cp your-cert.crt /etc/ssl/certs/ispn-helpdesk.crt
sudo cp your-key.key /etc/ssl/private/ispn-helpdesk.key

# Set permissions
sudo chmod 644 /etc/ssl/certs/ispn-helpdesk.crt
sudo chmod 600 /etc/ssl/private/ispn-helpdesk.key
```

---

## Monitoring & Health Checks

### Health Endpoints

**Liveness Probe:**
```bash
curl http://localhost:3000/healthz
# Expected: {"status":"ok","service":"ispn-helpdesk-bridge","timestamp":"..."}
```

**Readiness Probe:**
```bash
curl http://localhost:3000/readyz
# Expected: {"status":"ready","service":"ispn-helpdesk-bridge","checks":{"helpdesk":"healthy"},"timestamp":"..."}
```

### Monitoring Tools

#### Prometheus Metrics (TODO: Add prometheus-client)

**Future Enhancement:**
```typescript
// Add to http-server.ts
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

#### External Monitoring

**Uptime Monitoring:**
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://www.pingdom.com
- StatusCake: https://www.statuscake.com

**Configuration:**
- Monitor: `GET /healthz`
- Interval: 1 minute
- Alert: Email/SMS on failure
- Timeout: 30 seconds

---

## Logging

### Log Aggregation

#### Option 1: PM2 Logs

```bash
# View logs
pm2 logs

# Specific service
pm2 logs ispn-http

# Follow logs
pm2 logs --follow

# Clear logs
pm2 flush
```

#### Option 2: Systemd Journal

```bash
# View logs
sudo journalctl -u ispn-http -f

# Last 100 lines
sudo journalctl -u ispn-http -n 100

# Since date
sudo journalctl -u ispn-http --since "2025-11-11"

# JSON format
sudo journalctl -u ispn-http -o json
```

### Log Rotation

**File:** `/etc/logrotate.d/ispn-helpdesk`

```
/var/log/ispn-helpdesk/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 appuser appuser
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Backup & Recovery

### Configuration Backup

```bash
# Backup .env file
sudo cp /opt/ispn-helpdesk-mcp/.env /backup/.env.$(date +%Y%m%d)

# Encrypt backup
gpg --symmetric --cipher-algo AES256 /backup/.env.$(date +%Y%m%d)
```

### Application Backup

```bash
# Backup entire application
tar -czf /backup/ispn-helpdesk-$(date +%Y%m%d).tar.gz \
  /opt/ispn-helpdesk-mcp \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git
```

### Recovery Procedure

```bash
# Stop services
pm2 stop all

# Restore application
cd /opt
sudo rm -rf ispn-helpdesk-mcp
sudo tar -xzf /backup/ispn-helpdesk-latest.tar.gz

# Restore .env
sudo cp /backup/.env.latest /opt/ispn-helpdesk-mcp/.env
sudo chmod 600 /opt/ispn-helpdesk-mcp/.env

# Rebuild
cd ispn-helpdesk-mcp
npm ci --production
npm run build

# Restart services
pm2 restart all
```

---

## Scaling Strategies

### Horizontal Scaling (Multi-Instance)

**Current Limitation:** In-memory storage (ticket cache, idempotency cache)

**Solution:** Replace with Redis

#### Redis Setup

```bash
# Install Redis
sudo apt-get install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: bind 127.0.0.1
# Set: maxmemory 512mb
# Set: maxmemory-policy allkeys-lru

# Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### Update Code (Future)

```typescript
// Replace in-memory stores with Redis
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});
```

### Load Balancing

**nginx Configuration:**

```nginx
upstream ispn_http {
    least_conn;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3003 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

---

## Security Checklist

### Pre-Deployment

- [ ] Change `AUTH_TOKEN` from default value
- [ ] Change `WEBHOOK_SECRET` from default value
- [ ] Set `NODE_ENV=production`
- [ ] Restrict `.env` permissions (`chmod 600`)
- [ ] Use dedicated service user (no shell access)
- [ ] Enable firewall (allow only necessary ports)
- [ ] Configure SSL/TLS with valid certificate
- [ ] Set up rate limiting in nginx
- [ ] Configure security headers in nginx
- [ ] Disable unnecessary services
- [ ] Update all system packages

### Post-Deployment

- [ ] Verify health endpoints working
- [ ] Test authentication (both token and HMAC)
- [ ] Verify rate limiting working
- [ ] Check logs for errors
- [ ] Set up monitoring alerts
- [ ] Document deployment date and version
- [ ] Schedule regular security audits
- [ ] Configure backup automation
- [ ] Test backup restoration procedure

### Ongoing Maintenance

- [ ] Rotate secrets quarterly
- [ ] Update dependencies monthly (`npm audit`)
- [ ] Review logs weekly
- [ ] Test backups monthly
- [ ] Monitor resource usage
- [ ] Review access logs for anomalies

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
pm2 logs ispn-http --lines 50

# Check environment
sudo -u appuser printenv | grep -E 'NODE_ENV|PORT'

# Check permissions
ls -la /opt/ispn-helpdesk-mcp/.env

# Verify build
ls -la /opt/ispn-helpdesk-mcp/dist/
```

### High Memory Usage

```bash
# Check PM2 memory
pm2 status

# Set memory limit
pm2 restart ispn-http --max-memory-restart 512M

# Check for memory leaks
node --inspect dist/http-server.js
```

### Connection Refused

```bash
# Check if service is running
pm2 status

# Check port binding
sudo netstat -tulpn | grep 3000

# Check firewall
sudo ufw status

# Check nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## Support

For deployment issues, contact:
- **Email:** support@example.com
- **Documentation:** https://docs.example.com
- **Issues:** https://github.com/yourorg/ispn-helpdesk-mcp/issues

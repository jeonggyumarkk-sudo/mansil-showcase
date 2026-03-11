# Mansil Platform — Deployment Guide

## Quick Start (Docker Compose)

```bash
# 1. Set environment variables
cp .env.example .env
# Edit .env with your values (especially JWT_SECRET)

# 2. Build and start all services
docker compose up -d

# 3. Verify services are running
docker compose ps
curl http://localhost:3001/health
curl http://localhost:3000
```

## Production Deployment

### Docker Compose (Recommended for single-server)

```bash
# Build and run with production overrides
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View logs
docker compose logs -f api
docker compose logs -f web

# Stop services
docker compose down
```

### PM2 (Without Docker)

```bash
# Install PM2 globally
npm install -g pm2

# Build the project
npm ci
npx prisma generate --schema=packages/database/prisma/schema.prisma
npx turbo run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs mansil-api

# Set up startup script (auto-restart on reboot)
pm2 startup
pm2 save
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | SQLite file path (e.g., `file:/app/data/mansil.db`) or PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing. Must be a strong random string in production |
| `JWT_EXPIRATION` | No | `15m` | JWT token expiration time |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed CORS origins |
| `PORT` | No | `3001` | API server port |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`) |
| `NEXT_PUBLIC_API_URL` | Yes (web) | — | API URL for the web frontend |
| `SENTRY_DSN` | No | — | Sentry DSN for error monitoring |

### Generating a JWT Secret

```bash
openssl rand -base64 48
```

## SQLite Production Considerations

SQLite is the default database provider. For small-to-medium deployments (single server, moderate traffic), it can work in production with the following hardening:

### Enable WAL Mode

WAL (Write-Ahead Logging) mode improves concurrent read performance:

```sql
PRAGMA journal_mode=WAL;
```

Configure this in your application startup or database initialization.

### Set Busy Timeout

Prevents immediate failures when the database is locked by another writer:

```sql
PRAGMA busy_timeout=5000;
```

### File Permissions

```bash
# Create a dedicated data directory
mkdir -p /data/mansil
chmod 700 /data/mansil

# Set database file permissions
chmod 600 /data/mansil/mansil.db
```

### Backup Strategy

```bash
# Simple backup (with WAL checkpoint first)
sqlite3 /data/mansil/mansil.db "PRAGMA wal_checkpoint(TRUNCATE);"
cp /data/mansil/mansil.db /backups/mansil-$(date +%Y%m%d-%H%M%S).db

# Or use the .backup command for a consistent snapshot
sqlite3 /data/mansil/mansil.db ".backup /backups/mansil-$(date +%Y%m%d-%H%M%S).db"
```

Set up a cron job for automated backups:

```bash
# Daily backup at 2 AM
0 2 * * * sqlite3 /data/mansil/mansil.db ".backup /backups/mansil-$(date +\%Y\%m\%d).db" && find /backups -name "mansil-*.db" -mtime +30 -delete
```

### Limitations

- **Single-writer**: Only one write operation can proceed at a time. Multiple API instances cannot safely share a single SQLite file.
- **No network access**: The database must be on a local filesystem — cannot separate DB from app server.
- **No replication**: No built-in read replicas or failover.

## PostgreSQL Migration Path

For higher traffic or multi-server deployments, migrate to PostgreSQL:

### 1. Update Prisma Schema

In `packages/database/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Update Connection String

```bash
DATABASE_URL="postgresql://user:password@host:5432/mansil?schema=public"
```

### 3. Re-run Migrations

```bash
npx prisma migrate dev --name postgres-migration
# For production:
npx prisma migrate deploy
```

### 4. Schema Adjustments

- The `preferences` field on `Customer` (currently a `String` storing JSON) can be changed to the native `Json` type.
- String-based enum fields can be replaced with native PostgreSQL enums if desired.
- `BigInt` fields work natively in PostgreSQL.

## Health Check Monitoring

The API exposes a `/health` endpoint. Use it for:

- **Docker healthchecks**: Configured in `docker-compose.prod.yml`
- **Load balancer probes**: Point health checks to `GET /health`
- **External monitoring**: Use an uptime service to poll `/health`

Expected healthy response:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

## Troubleshooting

### Build failures

```bash
# Clear all build artifacts and reinstall
npm run clean
rm -rf node_modules
npm ci
npx prisma generate --schema=packages/database/prisma/schema.prisma
npx turbo run build
```

### Database locked errors

If you see `SQLITE_BUSY` errors:

1. Ensure WAL mode is enabled: `PRAGMA journal_mode=WAL;`
2. Increase busy timeout: `PRAGMA busy_timeout=5000;`
3. Ensure only one API instance writes to the database
4. Check for long-running transactions

### Docker container won't start

```bash
# Check container logs
docker compose logs api
docker compose logs web

# Verify environment variables
docker compose config

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port conflicts

If ports 3000 or 3001 are already in use:

```bash
# Check what's using the port
lsof -i :3001

# Or change ports in docker-compose.yml:
# ports:
#   - "8080:3001"  # Map host port 8080 to container port 3001
```

### PM2 process not starting

```bash
# Check PM2 logs for errors
pm2 logs mansil-api --lines 50

# Verify the dist directory exists
ls -la apps/api/dist/main.js

# Reset PM2
pm2 delete all
pm2 start ecosystem.config.js --env production
```

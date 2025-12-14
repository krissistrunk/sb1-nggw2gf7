# Docker Local Development Setup

This guide explains how to run the RPM App locally using Docker with a local Supabase stack.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Docker Network (supabase_network_sb1-nggw2gf7)                 │
│                                                                 │
│  ┌──────────────┐         ┌──────────────────────────────────┐  │
│  │   rpm-app    │────────▶│      Supabase Stack              │  │
│  │  (Vite/React)│         │                                  │  │
│  │  Port: 5173  │         │  ┌─────────────────────────────┐ │  │
│  └──────────────┘         │  │ kong (API Gateway)          │ │  │
│                           │  │ Port: 54321                 │ │  │
│                           │  └─────────────────────────────┘ │  │
│                           │              │                    │  │
│                           │  ┌───────────┴───────────┐       │  │
│                           │  │                       │       │  │
│                           │  ▼                       ▼       │  │
│                           │  ┌───────────┐  ┌─────────────┐  │  │
│                           │  │supabase-  │  │ supabase-   │  │  │
│                           │  │auth       │  │ rest        │  │  │
│                           │  │Port: 9999 │  │ Port: 3000  │  │  │
│                           │  └───────────┘  └─────────────┘  │  │
│                           │         │              │         │  │
│                           │         └──────┬───────┘         │  │
│                           │                ▼                 │  │
│                           │  ┌─────────────────────────────┐ │  │
│                           │  │   supabase-db (PostgreSQL)  │ │  │
│                           │  │   Port: 5432                │ │  │
│                           │  └─────────────────────────────┘ │  │
│                           │                                  │  │
│                           │  ┌─────────────────────────────┐ │  │
│                           │  │   supabase-studio           │ │  │
│                           │  │   Port: 54323               │ │  │
│                           │  └─────────────────────────────┘ │  │
│                           │                                  │  │
│                           │  ┌─────────────────────────────┐ │  │
│                           │  │   supabase-inbucket (Email) │ │  │
│                           │  │   Port: 54324               │ │  │
│                           │  └─────────────────────────────┘ │  │
│                           └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Docker Desktop** installed and running
2. **Git** (to clone/update the repo)

## Quick Start

### 1. Start Everything

```bash
cd /Volumes/Mac/WorkingFiles/Sistronics/Repos/sb1-nggw2gf7

# Make scripts executable
chmod +x scripts/*.sh

# Start all services
./scripts/start-local.sh
```

### 2. Apply Database Migrations

After the database is running, apply the schema migrations:

```bash
# Apply all migrations
./scripts/apply-migrations.sh
```

Or apply manually:
```bash
docker-compose exec supabase-db psql -U postgres -d postgres -f /migrations/MIGRATION_FILE.sql
```

### 3. Access the App

| Service | URL | Description |
|---------|-----|-------------|
| **App** | http://localhost:5173 | React/Vite application |
| **Supabase API** | http://localhost:54321 | REST API endpoint |
| **Supabase Studio** | http://localhost:54323 | Database GUI |
| **Email Testing** | http://localhost:54324 | Catch test emails |
| **PostgreSQL** | localhost:5432 | Direct DB access |

## Common Commands

### Starting & Stopping

```bash
# Start all services (detached)
docker-compose up -d

# Start and see logs
docker-compose up

# Stop all services (keeps data)
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Restart a single service
docker-compose restart rpm-app
```

### Viewing Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f rpm-app
docker-compose logs -f supabase-db
docker-compose logs -f supabase-auth
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec supabase-db psql -U postgres

# Run a SQL file
docker-compose exec -T supabase-db psql -U postgres -d postgres -f /path/to/file.sql

# Export database
docker-compose exec supabase-db pg_dump -U postgres > backup.sql
```

### Rebuilding

```bash
# Rebuild app container after Dockerfile changes
docker-compose build rpm-app

# Rebuild and restart
docker-compose up -d --build rpm-app

# Force rebuild without cache
docker-compose build --no-cache rpm-app
```

## Environment Variables

The `.env.local` file contains local development credentials:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | http://localhost:54321 | Local Supabase API |
| `VITE_SUPABASE_ANON_KEY` | (JWT token) | Anonymous access key |
| `SUPABASE_SERVICE_ROLE_KEY` | (JWT token) | Admin access key |
| `JWT_SECRET` | (secret string) | JWT signing secret |

**These are demo keys for local development only!**

## Troubleshooting

### Container won't start

```bash
# Check what's running
docker-compose ps

# Check logs for errors
docker-compose logs supabase-db

# Remove everything and start fresh
docker-compose down -v
docker-compose up -d
```

### Database connection issues

```bash
# Check if database is ready
docker-compose exec supabase-db pg_isready -U postgres

# Check database logs
docker-compose logs supabase-db
```

### Auth not working

1. Check the auth service logs: `docker-compose logs supabase-auth`
2. Ensure `GOTRUE_DB_DATABASE_URL` is correct
3. Check that the database roles exist

### Hot reload not working

1. Ensure volume mounts are correct in docker-compose.yml
2. Check that `--host 0.0.0.0` is in the dev command
3. Try restarting: `docker-compose restart rpm-app`

### Port conflicts

If ports are already in use, modify the left side of port mappings in `docker-compose.yml`:
```yaml
ports:
  - "5174:5173"  # Changed from 5173:5173
```

## Alternative: Supabase CLI (Simpler)

If you prefer, you can use Supabase CLI which manages Docker containers for you:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize (if needed)
supabase init

# Start Supabase (creates containers automatically)
supabase start

# The app can then run outside Docker
npm run dev
```

The CLI approach:
- ✅ Simpler setup
- ✅ Automatic migrations
- ✅ Better Supabase integration
- ❌ App runs outside Docker
- ❌ Less control over configuration

## Files Created

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for app |
| `docker-compose.yml` | Full stack orchestration |
| `.env.local` | Local environment variables |
| `supabase/kong.yml` | API gateway configuration |
| `supabase/init/00-initial-setup.sql` | Database role initialization |
| `scripts/start-local.sh` | Startup helper script |
| `scripts/apply-migrations.sh` | Migration runner |

## Data Persistence

Database data is stored in a Docker volume: `supabase-db-data`

To persist data between restarts, use `docker-compose down` (without `-v`).

To start fresh with a clean database, use `docker-compose down -v`.

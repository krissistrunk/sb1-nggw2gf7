#!/bin/bash

# Supabase Auth Fix Script
# Fixes the "schema auth does not exist" error in Docker

set -e

echo "=== Supabase Auth Fix Script ==="
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Step 1: Apply initialization SQL
echo "Step 1: Applying database initialization..."
docker exec -i supabase-db psql -U postgres < supabase/init/00-initial-setup.sql || true

# Step 2: Fix ownership
echo ""
echo "Step 2: Fixing schema ownership..."
docker exec supabase-db psql -U postgres -c "
ALTER SCHEMA auth OWNER TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON SCHEMA auth TO supabase_auth_admin;
GRANT CREATE ON SCHEMA auth TO supabase_auth_admin;
"

# Step 3: Set search path
echo ""
echo "Step 3: Setting search path..."
docker exec supabase-db psql -U postgres -c "
ALTER ROLE supabase_auth_admin SET search_path TO auth, public;
"

# Step 4: Restart auth service
echo ""
echo "Step 4: Restarting auth service..."
docker-compose up -d --force-recreate supabase-auth

# Wait for service to start
echo ""
echo "Waiting for auth service to start (this may take 1-2 minutes for migrations)..."
for i in {1..24}; do
    sleep 5
    HEALTH=$(curl -s http://localhost:54321/auth/v1/health 2>/dev/null || echo "")
    if echo "$HEALTH" | grep -q "GoTrue"; then
        break
    fi
    echo "  Still waiting... ($((i * 5))s)"
done

# Step 5: Verify
echo ""
echo "Step 5: Verifying health..."
HEALTH=$(curl -s http://localhost:54321/auth/v1/health)
echo "Health check response: $HEALTH"

if echo "$HEALTH" | grep -q "GoTrue"; then
    echo ""
    echo "============================================"
    echo "  SUCCESS! Auth service is now running"
    echo "============================================"
    echo ""
    echo "You can now:"
    echo "  - Login at http://localhost:5173/login"
    echo "  - Signup at http://localhost:5173/signup"
    echo "  - View Studio at http://localhost:54323"
else
    echo ""
    echo "============================================"
    echo "  Auth service may still be starting"
    echo "============================================"
    echo ""
    echo "Check logs with:"
    echo "  docker logs supabase-auth"
fi

# Supabase Docker Authentication Fix

## Problem Summary

The Supabase authentication service (GoTrue) was failing to start in Docker with the error:

```
ERROR: schema "auth" does not exist (SQLSTATE 3F000)
```

This prevented users from logging in, causing the application to show "An unexpected error occurred" when attempting authentication.

## Root Cause

The `supabase/init/00-initial-setup.sql` initialization script was never executed because:

1. Docker's `docker-entrypoint-initdb.d` scripts only run on **first container creation**
2. The database volume (`supabase-db-data`) was created before the init scripts were added
3. Therefore, the `auth` schema and required roles were never created

## Solution

### Step 1: Create the Auth Schema and Roles

Run the initialization SQL against the running database:

```bash
docker exec -i supabase-db psql -U postgres < supabase/init/00-initial-setup.sql
```

### Step 2: Fix Schema Ownership and Permissions

Ensure the `supabase_auth_admin` user owns the auth schema:

```bash
docker exec supabase-db psql -U postgres -c "
ALTER SCHEMA auth OWNER TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON SCHEMA auth TO supabase_auth_admin;
GRANT CREATE ON SCHEMA auth TO supabase_auth_admin;
"
```

### Step 3: Set the Search Path

Configure the search path for the auth user:

```bash
docker exec supabase-db psql -U postgres -c "
ALTER ROLE supabase_auth_admin SET search_path TO auth, public;
"
```

### Step 4: Recreate the Auth Service

Force recreate the auth container to pick up the database changes:

```bash
docker-compose up -d --force-recreate supabase-auth
```

### Step 5: Verify

Check that the auth service is healthy:

```bash
curl http://localhost:54321/auth/v1/health
```

Expected response:
```json
{"version":"","name":"GoTrue","description":"GoTrue is a user registration and authentication API"}
```

## Complete Fix Script

Save this as `scripts/fix-auth.sh`:

```bash
#!/bin/bash

echo "=== Supabase Auth Fix Script ==="

# Step 1: Apply initialization SQL
echo "Step 1: Applying database initialization..."
docker exec -i supabase-db psql -U postgres < supabase/init/00-initial-setup.sql

# Step 2: Fix ownership
echo "Step 2: Fixing schema ownership..."
docker exec supabase-db psql -U postgres -c "
ALTER SCHEMA auth OWNER TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON SCHEMA auth TO supabase_auth_admin;
GRANT CREATE ON SCHEMA auth TO supabase_auth_admin;
"

# Step 3: Set search path
echo "Step 3: Setting search path..."
docker exec supabase-db psql -U postgres -c "
ALTER ROLE supabase_auth_admin SET search_path TO auth, public;
"

# Step 4: Restart auth service
echo "Step 4: Restarting auth service..."
docker-compose up -d --force-recreate supabase-auth

# Wait for service to start
echo "Waiting for auth service to start (this may take 1-2 minutes for migrations)..."
sleep 60

# Step 5: Verify
echo "Step 5: Verifying health..."
HEALTH=$(curl -s http://localhost:54321/auth/v1/health)
echo "Health check response: $HEALTH"

if echo "$HEALTH" | grep -q "GoTrue"; then
    echo ""
    echo "=== SUCCESS! Auth service is now running ==="
else
    echo ""
    echo "=== Auth service may still be starting. Check logs with: ==="
    echo "docker logs supabase-auth"
fi
```

## Prevention

To prevent this issue in the future:

### Option 1: Fresh Start

When setting up a new environment, ensure the database volume doesn't exist before starting:

```bash
docker-compose down -v  # This removes volumes
docker-compose up -d
```

### Option 2: Always Run Init Script

Add this to your `scripts/start-local.sh`:

```bash
# Wait for database to be ready
until docker exec supabase-db pg_isready -U postgres; do
    sleep 2
done

# Apply init script (idempotent - safe to run multiple times)
docker exec -i supabase-db psql -U postgres < supabase/init/00-initial-setup.sql
```

### Option 3: Add Health Check to docker-compose.yml

Add a healthcheck for the auth service:

```yaml
supabase-auth:
  # ... existing config ...
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost:9999/health"]
    interval: 10s
    timeout: 5s
    retries: 5
```

## Verification Commands

Check database schemas exist:
```bash
docker exec supabase-db psql -U postgres -c "\dn"
```

Check roles exist:
```bash
docker exec supabase-db psql -U postgres -c "\du"
```

Check auth tables were created:
```bash
docker exec supabase-db psql -U postgres -c "\dt auth.*"
```

Check auth service logs:
```bash
docker logs supabase-auth --tail 50
```

## Additional Fix: RLS Policy Recursion

After fixing the auth schema, you may encounter "infinite recursion detected in policy" errors when querying organizations. This is caused by circular RLS policies.

### Fix Organization RLS Policies

```bash
docker exec supabase-db psql -U postgres -c "
-- Drop problematic policies
DROP POLICY IF EXISTS \"Users can view their organization\" ON organizations;
DROP POLICY IF EXISTS \"Users can view members of their organization\" ON organization_members;
DROP POLICY IF EXISTS \"Users can view org members\" ON organization_members;

-- Create simpler policies without recursion
CREATE POLICY \"Users can view own membership\" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY \"Users can view their organization\" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );
"
```

## Creating Test Users

If test users don't exist, create them with RLS temporarily disabled:

```bash
docker exec supabase-db psql -U postgres << 'EOSQL'
-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Create organization
INSERT INTO public.organizations (id, name, subdomain, subscription_tier, primary_color)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Personal Growth Academy', 'sarah-growth', 'STARTER', '#10B981');

-- Get auth user ID (assumes user was created via signup or auth.users insert)
-- Then create public user record
INSERT INTO public.users (id, email, name, organization_id)
SELECT id, email, 'Sarah Johnson', 'a0000000-0000-0000-0000-000000000001'
FROM auth.users WHERE email = 'sarah@test.com';

-- Create organization membership
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 'a0000000-0000-0000-0000-000000000001', id, 'ADMIN'
FROM auth.users WHERE email = 'sarah@test.com';

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
EOSQL
```

## Test Accounts

| Email | Password | Organization |
|-------|----------|--------------|
| sarah@test.com | test123 | Personal Growth Academy |
| mike@test.com | test123 | Corporate Training Solutions |
| emma@test.com | test123 | Course Creator Hub |
| james@test.com | test123 | Enterprise Admin Co |
| lisa@test.com | test123 | Team Leadership Group |

## Related Files

- `supabase/init/00-initial-setup.sql` - Database initialization script
- `docker-compose.yml` - Docker Compose configuration
- `.env.local` - Local environment variables
- `scripts/fix-auth.sh` - Automated auth fix script

## Troubleshooting

### "schema auth does not exist"
Run Steps 1-3 above to create the schema and fix permissions.

### Auth service keeps restarting
Check logs with `docker logs supabase-auth`. Usually means migrations are failing due to missing schema or permissions.

### Connection refused on port 9999
The auth service is still starting or has crashed. Wait a minute and check logs.

### Kong returns 502 Bad Gateway
Kong cannot reach the auth service. Ensure the auth container is running and on the same Docker network.

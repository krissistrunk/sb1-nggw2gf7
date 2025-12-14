#!/bin/bash
# Apply Supabase migrations to local Docker database
# Run this from the project root directory

set -e

echo "📊 Applying database migrations..."
echo ""

# Check if database is running
if ! docker-compose exec -T supabase-db pg_isready -U postgres > /dev/null 2>&1; then
    echo "❌ Database is not running. Start it first with: ./scripts/start-local.sh"
    exit 1
fi

# Apply all migrations in order
MIGRATIONS_DIR="./supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

echo "Found migrations directory: $MIGRATIONS_DIR"
echo ""

# Sort and apply migrations
for migration in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    filename=$(basename "$migration")
    echo "  Applying: $filename"
    docker-compose exec -T supabase-db psql -U postgres -d postgres -f "/migrations/$filename"
done

echo ""
echo "✅ All migrations applied successfully!"
echo ""
echo "You can now:"
echo "  - Access Supabase Studio at http://localhost:54323"
echo "  - Start the app at http://localhost:5173"

#!/bin/bash
# RPM App Local Development Startup Script
# Run this from the project root directory

set -e

echo "🚀 Starting RPM App Local Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Creating from template..."
    cp .env.example .env.local 2>/dev/null || echo "No .env.example found, using defaults"
fi

echo "✅ Environment file ready"

# Pull images first (optional but shows progress better)
echo ""
echo "📦 Pulling Docker images (this may take a while first time)..."
docker-compose pull

# Start all services
echo ""
echo "🐳 Starting services..."
docker-compose up -d

# Wait for database to be healthy
echo ""
echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T supabase-db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
    echo "   Still waiting for database..."
done
echo "✅ Database is ready"

# Check if migrations need to be applied
echo ""
echo "📊 To apply database migrations, run:"
echo "   docker-compose exec supabase-db psql -U postgres -d postgres -f /path/to/migration.sql"
echo ""
echo "   Or use the Supabase CLI:"
echo "   supabase db push"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 Local development environment is running!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📱 App:              http://localhost:5173"
echo "🗄️  Supabase API:     http://localhost:54321"
echo "🎨 Supabase Studio:  http://localhost:54323"
echo "📧 Email Testing:    http://localhost:54324"
echo "🐘 PostgreSQL:       localhost:5432 (postgres/postgres)"
echo ""
echo "To view logs:        docker-compose logs -f"
echo "To stop:             docker-compose down"
echo "To stop & cleanup:   docker-compose down -v"
echo ""

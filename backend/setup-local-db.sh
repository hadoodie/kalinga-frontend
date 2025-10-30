#!/bin/bash
# Local Database Setup Script
# Run this after cloning the repository to set up local database failover

echo "🚀 Kalinga Database Setup Script"
echo "=================================="
echo ""

# Check if PostgreSQL is installed
echo "📋 Checking prerequisites..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Please install PostgreSQL 17.x first:"
    echo "  - Windows: https://www.postgresql.org/download/windows/"
    echo "  - Mac: brew install postgresql@17"
    echo "  - Linux: sudo apt install postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Prompt for PostgreSQL password
echo "Please enter your PostgreSQL 'postgres' user password:"
read -s POSTGRES_PASSWORD
echo ""

# Create database
echo "📦 Creating local database..."
PGPASSWORD=$POSTGRES_PASSWORD psql -U postgres -c "CREATE DATABASE db_kalinga;" 2>&1 | grep -v "already exists"

if [ $? -eq 0 ]; then
    echo "✅ Database created (or already exists)"
else
    echo "⚠️  Database might already exist"
fi
echo ""

# Update .env file
echo "🔧 Updating .env file..."
if [ -f .env ]; then
    # Update LOCAL_DB_PASSWORD in .env
    if grep -q "LOCAL_DB_PASSWORD=" .env; then
        sed -i "s/LOCAL_DB_PASSWORD=.*/LOCAL_DB_PASSWORD=$POSTGRES_PASSWORD/" .env
        echo "✅ .env updated with local database password"
    else
        echo "⚠️  LOCAL_DB_PASSWORD not found in .env"
    fi
else
    echo "❌ .env file not found! Please copy .env.example to .env first"
    exit 1
fi
echo ""

# Run migrations
echo "🔨 Running migrations on local database..."
php artisan migrate --database=pgsql_local --force

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed"
else
    echo "❌ Migration failed"
    exit 1
fi
echo ""

# Initial sync
echo "🔄 Syncing data from cloud to local..."
php artisan db:sync-cloud-to-local --skip-confirm

if [ $? -eq 0 ]; then
    echo "✅ Initial sync completed"
else
    echo "❌ Sync failed - check cloud database connection"
    exit 1
fi
echo ""

# Verify setup
echo "✅ Checking setup..."
php artisan db:status
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend: php artisan serve"
echo "2. Start the scheduler: php artisan schedule:work"
echo ""
echo "The scheduler will automatically sync:"
echo "  - Cloud → Local: Every minute"
echo "  - Local → Cloud: When recovering from failover"
echo ""
echo "For more information, see: SETUP_LOCAL_DATABASE.md"
echo "=========================================="

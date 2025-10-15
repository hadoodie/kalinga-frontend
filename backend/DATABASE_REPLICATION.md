# Database Replication: Cloud to Local Backup System

## Overview

This system automatically syncs data from your Supabase cloud database to a local PostgreSQL database for backup and offline development purposes.

## Architecture

```
┌─────────────────────────┐
│  Supabase Cloud DB      │  (Source - Production)
│  aws-1-ap-southeast-1   │
└───────────┬─────────────┘
            │
            │ Sync Command
            │ (One-way)
            ▼
┌─────────────────────────┐
│  Local PostgreSQL DB    │  (Destination - Backup)
│  127.0.0.1:5432         │
└─────────────────────────┘
```

## Features

✅ **One-way sync** from cloud to local
✅ **Selective table sync** - sync specific tables or all
✅ **Automatic chunking** for large datasets
✅ **Progress tracking** with detailed output
✅ **Connection validation** before sync
✅ **Safe confirmation** prompts (can be skipped for automation)
✅ **Error handling** with detailed messages

## Setup Instructions

### 1. Create Local Database

```bash
# Using PostgreSQL command line
createdb db_kalinga_local

# Or using psql
psql -U postgres
CREATE DATABASE db_kalinga_local;
\q
```

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Cloud Database (Supabase)
CLOUD_DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
CLOUD_DB_PORT=5432
CLOUD_DB_DATABASE=postgres
CLOUD_DB_USERNAME=postgres.psblyvwfbgmwyrtzoyhz
CLOUD_DB_PASSWORD=KalingaDB2526
CLOUD_DB_SSLMODE=require

# Local Database (Backup)
LOCAL_DB_HOST=127.0.0.1
LOCAL_DB_PORT=5432
LOCAL_DB_DATABASE=db_kalinga_local
LOCAL_DB_USERNAME=postgres
LOCAL_DB_PASSWORD=your_local_password_here
```

### 3. Run Migrations on Local Database

```bash
php artisan migrate --database=pgsql_local
```

This creates all necessary tables in your local database.

### 4. Test the Sync Command

```bash
# Sync all tables (with confirmation)
php artisan db:sync-cloud-to-local

# Sync specific tables
php artisan db:sync-cloud-to-local --tables=users --tables=resources

# Skip confirmation (for automation)
php artisan db:sync-cloud-to-local --skip-confirm
```

## Usage

### Manual Sync

Run the sync command whenever you want to update your local backup:

```bash
cd backend
php artisan db:sync-cloud-to-local
```

**Example Output:**
```
🔄 Starting Cloud to Local Database Sync...

🔍 Checking database connections...
✅ Cloud database connected
✅ Local database connected

This will overwrite local data with cloud data. Continue? (yes/no) [yes]:
> yes

📦 Syncing table: users
  ✅ Synced 15 records
📦 Syncing table: resources
  ✅ Synced 42 records
📦 Syncing table: vehicles
  ✅ Synced 8 records

✅ Sync completed successfully!
📊 Total records synced: 65
⏱️  Time taken: 2.34 seconds
```

### Automatic Sync (Scheduled)

#### Option 1: Task Scheduler (Recommended for Development)

Add to `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Sync every hour
    $schedule->command('db:sync-cloud-to-local --skip-confirm')
             ->hourly()
             ->withoutOverlapping()
             ->runInBackground();
    
    // Or sync every 6 hours
    $schedule->command('db:sync-cloud-to-local --skip-confirm')
             ->everySixHours();
    
    // Or sync daily at 2 AM
    $schedule->command('db:sync-cloud-to-local --skip-confirm')
             ->dailyAt('02:00');
}
```

Then run the scheduler:
```bash
php artisan schedule:work
```

#### Option 2: Cron Job (Production)

Add to your server's crontab:
```bash
# Run every hour
0 * * * * cd /path/to/backend && php artisan db:sync-cloud-to-local --skip-confirm >> /dev/null 2>&1

# Or run every 6 hours
0 */6 * * * cd /path/to/backend && php artisan db:sync-cloud-to-local --skip-confirm >> /dev/null 2>&1
```

## Command Options

| Option | Description |
|--------|-------------|
| `--tables=TABLE_NAME` | Sync specific table(s). Can be used multiple times. |
| `--skip-confirm` | Skip confirmation prompt (required for automation) |

### Examples

```bash
# Sync only users table
php artisan db:sync-cloud-to-local --tables=users

# Sync users and resources tables
php artisan db:sync-cloud-to-local --tables=users --tables=resources

# Automated sync (no confirmation)
php artisan db:sync-cloud-to-local --skip-confirm
```

## Tables Synced by Default

- `users`
- `resources`
- `resource_requests`
- `vehicles`
- `hospitals`
- `personal_access_tokens`

To sync additional tables, use the `--tables` option.

## Important Notes

### ⚠️ Warning

- This is a **ONE-WAY sync** (Cloud → Local)
- Local changes will be **overwritten**
- Always backup important local data before syncing

### 🔒 Security

- Never commit `.env` file to git
- Keep cloud credentials secure
- Use separate passwords for cloud and local databases

### 📊 Performance

- Large datasets are automatically chunked (100 records per batch)
- Sync time depends on data size and network speed
- Use `--tables` option to sync only needed tables

## Switching Between Databases

### Use Cloud Database (Default)

```env
DB_CONNECTION=pgsql
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
...
```

### Use Local Database

```env
DB_CONNECTION=pgsql_local
DB_HOST=127.0.0.1
...
```

Or use in code:
```php
// Use cloud database
$users = DB::connection('pgsql_cloud')->table('users')->get();

// Use local database
$users = DB::connection('pgsql_local')->table('users')->get();
```

## Troubleshooting

### Connection Failed

**Error:** `Cloud database connection failed`

**Solution:**
- Check your internet connection
- Verify Supabase credentials in `.env`
- Ensure `CLOUD_DB_HOST` uses session pooler endpoint

### Local Database Not Found

**Error:** `Local database connection failed`

**Solution:**
```bash
# Create the database
createdb db_kalinga_local

# Run migrations
php artisan migrate --database=pgsql_local
```

### Table Does Not Exist

**Error:** `Table 'xyz' does not exist in local database`

**Solution:**
```bash
php artisan migrate --database=pgsql_local
```

### Permission Denied

**Error:** `SQLSTATE[42501]: Insufficient privilege`

**Solution:**
- Grant proper permissions to local PostgreSQL user
- Or use a user with CREATE/INSERT/TRUNCATE privileges

## Team Collaboration

### For Team Members

1. **Get credentials** from team lead:
   - Cloud DB credentials (read from `.env.example.replication`)
   - Local DB password

2. **Set up local database:**
   ```bash
   createdb db_kalinga_local
   php artisan migrate --database=pgsql_local
   ```

3. **Sync data:**
   ```bash
   php artisan db:sync-cloud-to-local
   ```

4. **Work locally** (optional):
   - Change `DB_CONNECTION=pgsql_local` in `.env`
   - Run `php artisan config:clear`

### Best Practices

- ✅ Sync daily or before starting work
- ✅ Use cloud DB for development (stay in sync with team)
- ✅ Use local DB for testing/offline work
- ✅ Never modify cloud DB structure without team coordination

## Advanced Usage

### Custom Sync Script

Create your own sync workflow:

```php
use Illuminate\Support\Facades\Artisan;

// Sync before running tests
Artisan::call('db:sync-cloud-to-local', [
    '--tables' => ['users', 'resources'],
    '--skip-confirm' => true
]);
```

### Monitoring

Log sync operations:

```bash
php artisan db:sync-cloud-to-local --skip-confirm >> storage/logs/db-sync.log 2>&1
```

## Support

For issues or questions:
1. Check this documentation
2. Review error messages carefully
3. Verify database connections
4. Contact team lead if problems persist

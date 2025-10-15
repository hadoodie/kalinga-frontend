# Automatic Database Sync Setup

## Overview

The database replication system is configured to automatically sync from the cloud database (Supabase) to the local backup database every hour.

## Configuration

### Schedule Configuration

Located in: `routes/console.php`

```php
Schedule::command('db:sync-cloud-to-local --skip-confirm')
    ->hourly()
    ->withoutOverlapping()
    ->onSuccess(function () {
        info('Database sync completed successfully at ' . now());
    })
    ->onFailure(function () {
        info('Database sync failed at ' . now());
    });
```

### What This Does

-   **Runs every hour** - Syncs data from cloud to local database
-   **Without overlapping** - Prevents multiple sync processes from running simultaneously
-   **Success/Failure logging** - Logs sync results to `storage/logs/laravel.log`
-   **Skips confirmation** - Runs automatically without user input

## Running the Scheduler

### Development Environment

To run the scheduler during development:

```bash
php artisan schedule:work
```

This command will run in the foreground and execute scheduled tasks at their defined times.

### Production Environment

#### Option 1: Windows Task Scheduler (Recommended for Windows)

1. Open Task Scheduler
2. Create a new task with these settings:
    - **Trigger**: Daily at 00:00
    - **Action**: Start a program
    - **Program**: `php`
    - **Arguments**: `artisan schedule:run`
    - **Start in**: `C:\path\to\kalinga-frontend\backend`
    - **Repeat**: Every 1 minute for duration of 24 hours

#### Option 2: Cron Job (Linux/Mac)

Add this to your crontab:

```bash
* * * * * cd /path/to/kalinga-frontend/backend && php artisan schedule:run >> /dev/null 2>&1
```

## Verification

### Check Schedule Status

```bash
php artisan schedule:list
```

Expected output:

```
0 * * * *  php artisan db:sync-cloud-to-local --skip-confirm .... Next Due: XX minutes from now
```

### Test Manual Sync

```bash
php artisan db:sync-cloud-to-local
```

### Check Sync Logs

View the logs in `storage/logs/laravel.log`:

```bash
# Windows PowerShell
Get-Content storage\logs\laravel.log -Tail 50

# Linux/Mac
tail -f storage/logs/laravel.log
```

## Customizing Sync Frequency

You can modify the sync frequency in `routes/console.php`:

### Every 30 Minutes

```php
Schedule::command('db:sync-cloud-to-local --skip-confirm')
    ->everyThirtyMinutes()
```

### Every 6 Hours

```php
Schedule::command('db:sync-cloud-to-local --skip-confirm')
    ->everySixHours()
```

### Daily at 2 AM

```php
Schedule::command('db:sync-cloud-to-local --skip-confirm')
    ->dailyAt('02:00')
```

### Weekdays Only at 9 AM

```php
Schedule::command('db:sync-cloud-to-local --skip-confirm')
    ->weekdays()
    ->dailyAt('09:00')
```

## Monitoring

### Success Indicators

-   ✅ Command exits with status 0
-   ✅ Log shows "Database sync completed successfully"
-   ✅ Local database records match cloud database

### Failure Indicators

-   ❌ Command exits with non-zero status
-   ❌ Log shows "Database sync failed"
-   ❌ Connection errors in logs

### Common Issues

#### Issue: Schedule not running

**Solution**: Make sure `schedule:work` is running in development, or Task Scheduler/cron is properly configured in production

#### Issue: Connection failures

**Solution**:

-   Verify cloud database credentials in `.env`
-   Check network connectivity
-   Ensure SSL mode is correct (`require` for cloud, `prefer` for local)

#### Issue: Permission denied

**Solution**:

-   Verify local database user has write permissions
-   Check that the local database exists: `psql -U postgres -l | grep db_kalinga`

## Testing the Automatic Sync

1. **Start the scheduler**:

    ```bash
    php artisan schedule:work
    ```

2. **Make a change in cloud database** (via Supabase dashboard or API)

3. **Wait for next scheduled run** (check with `php artisan schedule:list`)

4. **Verify changes synced to local**:
    ```bash
    psql -U postgres -d db_kalinga -c "SELECT * FROM users LIMIT 5;"
    ```

## Disabling Automatic Sync

To disable automatic syncing, comment out the schedule in `routes/console.php`:

```php
// Schedule::command('db:sync-cloud-to-local --skip-confirm')
//     ->hourly()
//     ->withoutOverlapping();
```

## Manual Sync Command

You can always run manual sync:

```bash
# Sync all default tables
php artisan db:sync-cloud-to-local

# Sync specific tables
php artisan db:sync-cloud-to-local --tables=users --tables=resources

# Skip confirmation (for automation)
php artisan db:sync-cloud-to-local --skip-confirm
```

## Best Practices

1. **Monitor logs regularly** - Check for sync failures
2. **Test in development first** - Verify sync works before production
3. **Backup before major changes** - Take database snapshots before large updates
4. **Adjust frequency as needed** - Balance between freshness and system load
5. **Alert on failures** - Set up notifications for failed syncs (optional)

## Related Documentation

-   [DATABASE_REPLICATION.md](./DATABASE_REPLICATION.md) - Complete replication system documentation
-   [REPLICATION_SETUP.md](../REPLICATION_SETUP.md) - Quick setup guide
-   `.env.example.replication` - Environment variable template

## Support

For issues or questions:

1. Check logs: `storage/logs/laravel.log`
2. Test manual sync: `php artisan db:sync-cloud-to-local`
3. Verify connections: Check both cloud and local database connectivity
4. Review documentation: Read the full DATABASE_REPLICATION.md guide

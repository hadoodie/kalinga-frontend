# Database Replication Setup - Quick Start

## ✅ Your branch is now synced with upstream/main!

All changes have been merged and pushed successfully.

---

## 🔄 New Feature: Cloud-to-Local Database Replication

We've implemented automatic database backup from Supabase (cloud) to your local PostgreSQL.

### Quick Setup (5 minutes)

#### 1. Create Local Database

```bash
createdb db_kalinga_local
```

#### 2. Add to your `.env` file

```env
# Local Database (for backup)
LOCAL_DB_HOST=127.0.0.1
LOCAL_DB_PORT=5432
LOCAL_DB_DATABASE=db_kalinga_local
LOCAL_DB_USERNAME=postgres
LOCAL_DB_PASSWORD=your_password_here
```

#### 3. Run Migrations on Local DB

```bash
cd backend
php artisan migrate --database=pgsql_local
```

#### 4. Sync Data from Cloud

```bash
php artisan db:sync-cloud-to-local
```

That's it! Your local database now has a backup of all cloud data.

### Usage

**Manual sync anytime:**

```bash
php artisan db:sync-cloud-to-local
```

**Sync specific tables:**

```bash
php artisan db:sync-cloud-to-local --tables=users --tables=resources
```

**For automation (skip confirmation):**

```bash
php artisan db:sync-cloud-to-local --skip-confirm
```

### What This Does

- ✅ Creates a local copy of cloud database
- ✅ Keeps your data backed up
- ✅ Enables offline development
- ✅ Syncs automatically (if you set up scheduler)

### Documentation

See `DATABASE_REPLICATION.md` for complete documentation including:

- Automatic scheduling
- Advanced options
- Troubleshooting
- Team collaboration guide

### Important Notes

⚠️ **This is ONE-WAY sync** (Cloud → Local)

- Local changes will be overwritten when you sync
- Use cloud DB for active development
- Use local DB for testing/backup

---

## Files Changed

- ✅ `config/database.php` - Added cloud and local DB connections
- ✅ `app/Console/Commands/SyncCloudToLocal.php` - Sync command
- ✅ `DATABASE_REPLICATION.md` - Full documentation
- ✅ `.env.example.replication` - Environment variable template

## Next Steps

1. ✅ Merge commit pushed to `improvements/patient`
2. ✅ Database replication system implemented
3. ⏳ Test the sync command
4. ⏳ Set up automatic scheduling (optional)
5. ⏳ Share setup instructions with team

Enjoy your new backup system! 🎉

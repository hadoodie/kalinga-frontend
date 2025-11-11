<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

# Kalinga Backend API

Laravel 11 backend API with automatic database failover and synchronization between cloud (Supabase) and local PostgreSQL databases.

## Table of Contents
- [Quick Start](#-quick-start)
- [Database Failover System](#-database-failover-system)
- [Local Database Setup](#-local-database-setup)
- [Automatic Sync Scheduler](#-automatic-sync-scheduler)
- [Available Commands](#-available-commands)
- [How It Works](#-how-it-works)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- PostgreSQL 17.x (for local failover)
- Node.js & npm

### Installation

1. **Install Dependencies**
```bash
composer install
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
php artisan key:generate
```

3. **Update `.env`** with your credentials (cloud credentials are pre-configured)

4. **Run Migrations**
```bash
# Cloud database (primary)
php artisan migrate

# Seed sample data
php artisan db:seed
```

5. **Start Development Server**
```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

---

## 🔄 Database Failover System

This application features automatic database failover for high availability:

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│         NORMAL OPERATION (Cloud Available)              │
├─────────────────────────────────────────────────────────┤
│  • All requests → Cloud Database (Supabase)             │
│  • Automatic backup to local every minute               │
│  • No interruption to service                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         FAILOVER MODE (Cloud Unavailable)               │
├─────────────────────────────────────────────────────────┤
│  • System detects cloud failure                         │
│  • Switches to Local Database automatically             │
│  • All operations continue normally                     │
│  • Changes saved locally                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         RECOVERY (Cloud Back Online)                    │
├─────────────────────────────────────────────────────────┤
│  • System detects cloud is available                    │
│  • Syncs local changes → Cloud                          │
│  • Switches back to cloud                               │
│  • Clears failover status                               │
└─────────────────────────────────────────────────────────┘
```

### Features
- ✅ **Automatic Failover** - Seamless switch when cloud is unavailable
- ✅ **Bidirectional Sync** - Cloud ↔ Local data synchronization
- ✅ **Zero Downtime** - Service continues during outages
- ✅ **Data Consistency** - Automatic reconciliation after recovery

---

## 💾 Local Database Setup

### Quick Setup with Scripts

**Windows:**
```bash
setup-local-db.bat
```

**Mac/Linux:**
```bash
chmod +x setup-local-db.sh
./setup-local-db.sh
```

### Manual Setup

#### 1. Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Remember your postgres password during installation
- Default port: 5432

**Mac (Homebrew):**
```bash
brew install postgresql@17
brew services start postgresql@17
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2. Create Local Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE db_kalinga;
\q
```

#### 3. Configure `.env`

Update your local database credentials:

```env
LOCAL_DB_HOST=127.0.0.1
LOCAL_DB_PORT=5432
LOCAL_DB_DATABASE=db_kalinga
LOCAL_DB_USERNAME=postgres
LOCAL_DB_PASSWORD=your_postgres_password_here
```

#### 4. Run Migrations on Local Database

```bash
php artisan migrate --database=pgsql_local
```

#### 5. Initial Data Sync

```bash
php artisan db:sync-cloud-to-local --skip-confirm
```

#### 6. Verify Setup

```bash
php artisan db:status
```

Expected output:
```
☁️  Cloud Database (Supabase):
   Status: ● Online

💾 Local Database (Backup):
   Status: ● Online

🎯 Active Connection: Cloud (Supabase)
📊 System Status: ✅ Healthy
```

---

## ⏰ Automatic Sync Scheduler

The scheduler automatically syncs data between cloud and local databases.

### Running the Scheduler

**Development (keep running in separate terminal):**
```bash
php artisan schedule:work
```

**Production:**

#### Windows Task Scheduler
1. Open Task Scheduler
2. Create new task:
   - **Trigger**: At startup, repeat every 1 minute
   - **Action**: Run program
   - **Program**: `php`
   - **Arguments**: `artisan schedule:run`
   - **Start in**: `C:\path\to\kalinga-hotfix-db\backend`

#### Linux/Mac Cron Job
Add to crontab (`crontab -e`):
```bash
* * * * * cd /path/to/kalinga-hotfix-db/backend && php artisan schedule:run >> /dev/null 2>&1
```

### Sync Schedule

Configured in `routes/console.php`:

- **Cloud → Local**: Every minute (backup)
  - Only runs when cloud is available
  - Prevents data loss during outages

- **Local → Cloud**: Every minute (recovery)
  - Only runs during failover recovery
  - Syncs local changes back to cloud

### Verify Scheduler

Check scheduled tasks:
```bash
php artisan schedule:list
```

View sync logs:
```bash
# Windows
Get-Content storage\logs\laravel.log -Tail 50

# Mac/Linux
tail -f storage/logs/laravel.log
```

---

## 🛠 Available Commands

### Database Status
```bash
# Check connection status
php artisan db:status

# Force reconnect to cloud
php artisan db:status --force-reconnect
```

### Manual Sync
```bash
# Sync cloud → local
php artisan db:sync-cloud-to-local

# Sync local → cloud
php artisan db:sync-local-to-cloud

# Sync specific tables
php artisan db:sync-cloud-to-local --tables=users --tables=appointments
```

### Database Management
```bash
# View database info
php artisan db:show
php artisan db:show --database=pgsql_local

# Run migrations
php artisan migrate
php artisan migrate --database=pgsql_local

# Seed data
php artisan db:seed
php artisan db:seed --class=AppointmentsSeeder
```

---

## 📋 How It Works

### Failover Detection

The `DatabaseFailoverMiddleware` automatically detects database availability:

1. **Every Request**: Checks cloud database connection
2. **Cloud Available**: Routes to cloud database (primary)
3. **Cloud Unavailable**: Routes to local database (backup)
4. **Status Cached**: Prevents repeated connection checks

### Sync Process

**Cloud to Local (Backup):**
```php
Schedule::command('db:sync-cloud-to-local --skip-confirm')
    ->everyMinute()
    ->when(function () {
        return DatabaseConnectionManager::isCloudAvailable();
    });
```

**Local to Cloud (Recovery):**
```php
Schedule::command('db:sync-local-to-cloud --skip-confirm')
    ->everyMinute()
    ->when(function () {
        $wasInFailover = cache()->has('db_failover_status');
        $cloudNowAvailable = DatabaseConnectionManager::isCloudAvailable();
        return $wasInFailover && $cloudNowAvailable;
    });
```

### Tables Synced

All application tables are automatically synced:
- `users`, `personal_access_tokens`
- `appointments`, `notifications`
- `lab_results`, `test_results`, `test_result_details`
- `allergies`, `diagnoses`, `immunizations`, `medications`
- `hospitals`, `resources`, `resource_requests`, `vehicles`

---

## 🔧 Troubleshooting

### "Local database connection failed"

**Check PostgreSQL is running:**
```bash
# Windows
services.msc  # Look for postgresql-x64-17

# Mac
brew services list

# Linux
sudo systemctl status postgresql
```

**Verify credentials:**
Test connection:
```bash
psql -U postgres -d db_kalinga
```

### "Table does not exist in local database"

Run migrations:
```bash
php artisan migrate --database=pgsql_local
```

### "No scheduled commands are ready to run"

This is normal! The scheduler checks every minute. Your tasks are scheduled at specific intervals:
- Next sync will run at the next minute mark
- Use `php artisan schedule:list` to see when tasks will run

### "Scheduler not running"

Ensure `php artisan schedule:work` is running in a terminal or as a background service.

### Testing Failover

**Simulate cloud failure:**
1. Temporarily change cloud credentials in `.env` to invalid values
2. Clear cache: `php artisan cache:clear`
3. Make a request - should switch to local database
4. Restore correct credentials
5. Wait 1 minute - should sync and switch back to cloud

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── Console/Commands/
│   │   ├── CheckDatabaseStatus.php      # Check DB status
│   │   ├── SyncCloudToLocal.php         # Cloud → Local sync
│   │   └── SyncLocalToCloud.php         # Local → Cloud sync
│   ├── Http/Middleware/
│   │   └── DatabaseFailoverMiddleware.php  # Auto failover
│   └── Services/
│       └── DatabaseConnectionManager.php   # Connection management
├── config/database.php                     # DB configuration
├── routes/console.php                      # Scheduler config
├── setup-local-db.bat                      # Windows setup script
├── setup-local-db.sh                       # Linux/Mac setup script
└── README.md                               # This file
```

---

## 🤝 Contributing

When cloning this repository, others will need to:

1. Install PostgreSQL locally
2. Run `setup-local-db.bat` (Windows) or `./setup-local-db.sh` (Mac/Linux)
3. Keep `php artisan schedule:work` running during development

---

## 📝 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

---

<p align="center">Built with ❤️ using Laravel 11</p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com/)**
- **[Tighten Co.](https://tighten.co)**
- **[WebReinvent](https://webreinvent.com/)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel/)**
- **[Cyber-Duck](https://cyber-duck.co.uk)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Jump24](https://jump24.co.uk)**
- **[Redberry](https://redberry.international/laravel/)**
- **[Active Logic](https://activelogic.com)**
- **[byte5](https://byte5.de)**
- **[OP.GG](https://op.gg)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Real-Time Messaging with Laravel Reverb

This application includes a real-time messaging system using Laravel Reverb (WebSocket server) for presence channels.

### Setup

1. **Install Dependencies**
```bash
composer require pusher/pusher-php-server
npm install laravel-echo pusher-js
```

2. **Configure Environment**
Add to `.env`:
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

3. **Start Reverb Server**
```bash
php artisan reverb:start
```

### Database Setup

Run the messages seeder to populate sample conversations:
```bash
php artisan db:seed --class=MessagesSeeder
```

The seeder creates:
- Sample conversations between users
- Messages with various statuses
- Group conversations
- Message attachments (references only)

### User Seeder

To populate users (including verified responders for presence testing):
```bash
php artisan db:seed --class=UserSeeder
```

The seeder uses `updateOrCreate` to be idempotent - safe to run multiple times without duplicate key errors.

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

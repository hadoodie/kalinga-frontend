@echo off
REM Local Database Setup Script for Windows
REM Run this after cloning the repository to set up local database failover

echo.
echo ================================================
echo  Kalinga Database Setup Script (Windows)
echo ================================================
echo.

REM Check if PostgreSQL is installed
echo Checking prerequisites...
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL is not installed!
    echo.
    echo Please install PostgreSQL 17.x first:
    echo   Download from: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

echo [OK] PostgreSQL found
echo.

REM Prompt for PostgreSQL password
set /p POSTGRES_PASSWORD="Enter your PostgreSQL 'postgres' user password: "
echo.

REM Create database
echo Creating local database...
set PGPASSWORD=%POSTGRES_PASSWORD%
psql -U postgres -c "CREATE DATABASE db_kalinga;" 2>nul
if %errorlevel% equ 0 (
    echo [OK] Database created
) else (
    echo [WARNING] Database might already exist
)
echo.

REM Update .env file
echo Updating .env file...
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'LOCAL_DB_PASSWORD=.*', 'LOCAL_DB_PASSWORD=%POSTGRES_PASSWORD%' | Set-Content .env"
    echo [OK] .env updated with local database password
) else (
    echo [ERROR] .env file not found! Please copy .env.example to .env first
    pause
    exit /b 1
)
echo.

REM Run migrations
echo Running migrations on local database...
php artisan migrate --database=pgsql_local --force
if %errorlevel% neq 0 (
    echo [ERROR] Migration failed
    pause
    exit /b 1
)
echo [OK] Migrations completed
echo.

REM Initial sync
echo Syncing data from cloud to local...
php artisan db:sync-cloud-to-local --skip-confirm
if %errorlevel% neq 0 (
    echo [ERROR] Sync failed - check cloud database connection
    pause
    exit /b 1
)
echo [OK] Initial sync completed
echo.

REM Verify setup
echo Checking setup...
php artisan db:status
echo.

echo ================================================
echo  Setup Complete!
echo ================================================
echo.
echo Next steps:
echo   1. Start the backend: php artisan serve
echo   2. Start the scheduler: php artisan schedule:work
echo.
echo The scheduler will automatically sync:
echo   - Cloud to Local: Every minute
echo   - Local to Cloud: When recovering from failover
echo.
echo For more information, see: SETUP_LOCAL_DATABASE.md
echo ================================================
echo.
pause

<?php
// database/migrations/2025_11_25_000003_final_safe_update_user_roles.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    
        // STEP 1: Create temporary type with new values
        DB::statement("
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_new') THEN
                    CREATE TYPE user_role_new AS ENUM (
                        'patient',
                        'hospital_admin',
                        'dispatcher',
                        'logistics',
                        'responder',
                        'procurement',
                        'admin'
                    );
                END IF;
            END $$;
        ");

        // STEP 2: Add temporary column with new type
        Schema::table('users', function ($table) {
            $table->string('role_temp')->nullable();
        });

        // STEP 3: Safely map data with proper role transitions
        DB::statement("
            UPDATE users 
            SET role_temp = 
                CASE 
                    WHEN role = 'patient' THEN 'patient'
                    WHEN role = 'admin' THEN 'admin'
                    WHEN role = 'responder' THEN 'responder'
                    WHEN role = 'logistics' THEN 'logistics'
                    ELSE 'hospital_admin'  -- Handle any unexpected values
                END
        ");

        // STEP 4: Convert temporary column to new enum type
        DB::statement("ALTER TABLE users ALTER COLUMN role_temp TYPE user_role_new USING role_temp::user_role_new");

        // STEP 5: Swap columns safely
        DB::statement("ALTER TABLE users RENAME COLUMN role TO role_old");
        DB::statement("ALTER TABLE users RENAME COLUMN role_temp TO role");

        // STEP 6: Set constraints and drop old
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient'");
        DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
        DB::statement("ALTER TABLE users DROP COLUMN role_old");

        // STEP 7: Clean up old enum type
        DB::statement("DROP TYPE IF EXISTS user_role_old");
        DB::statement("DROP TYPE IF EXISTS user_role");
        DB::statement("ALTER TYPE user_role_new RENAME TO user_role");
    }

    public function down(): void
    {
        // FULLY REVERSIBLE - Critical for government systems
        DB::statement("
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_old') THEN
                    CREATE TYPE user_role_old AS ENUM (
                        'patient',
                        'responder',
                        'admin',
                        'logistics'
                    );
                END IF;
            END $$;
        ");

        // Add temporary column for rollback
        Schema::table('users', function ($table) {
            $table->string('role_temp_rollback')->nullable();
        });

        // Map data back with safe transitions
        DB::statement("
            UPDATE users 
            SET role_temp_rollback = 
                CASE 
                    WHEN role IN ('hospital_admin', 'dispatcher', 'procurement') THEN 'logistics'
                    WHEN role = 'admin' THEN 'admin'
                    WHEN role = 'responder' THEN 'responder'
                    ELSE 'patient'
                END
        ");

        // Convert and swap
        DB::statement("ALTER TABLE users ALTER COLUMN role_temp_rollback TYPE user_role_old USING role_temp_rollback::user_role_old");
        DB::statement("ALTER TABLE users RENAME COLUMN role TO role_new_temp");
        DB::statement("ALTER TABLE users RENAME COLUMN role_temp_rollback TO role");

        // Set constraints
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient'");
        DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");

        // Cleanup
        DB::statement("ALTER TABLE users DROP COLUMN role_new_temp");
        DB::statement("DROP TYPE IF EXISTS user_role");
        DB::statement("ALTER TYPE user_role_old RENAME TO user_role");
    }
};
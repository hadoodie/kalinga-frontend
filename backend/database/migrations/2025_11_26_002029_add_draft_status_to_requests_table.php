<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
       
        DB::statement('ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check');

       
        DB::statement("
            ALTER TABLE requests 
            ADD CONSTRAINT requests_status_check 
            CHECK (status IN (
                'draft',
                'pending',
                'under_review',
                'matched',
                'allocated',
                'in_transit',
                'delivered',
                'verified',
                'rejected',
                'failed'
            ))
        ");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check');
        
        DB::statement("
            ALTER TABLE requests 
            ADD CONSTRAINT requests_status_check 
            CHECK (status IN (
                'pending','under_review','matched','allocated',
                'in_transit','delivered','verified','rejected','failed'
            ))
        ");
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // database/migrations/2025_11_24_000002_create_maintenance_records_table.php
public function up()
{
    if (Schema::hasTable('stock_movements')) {
        return;
    }

    
    Schema::create('maintenance_records', function (Blueprint $table) {
        $table->id();
        $table->string('asset_id'); // references asset_code
        $table->date('scheduled_date');
        $table->date('completed_date')->nullable();
        $table->text('description');

        $table->enum('status', ['scheduled', 'completed', 'overdue'])
              ->default('scheduled')
              ->index();

        $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
        $table->enum('maintenance_type', ['routine', 'repair', 'inspection', 'emergency'])
              ->default('routine');

        $table->string('technician')->nullable();
        $table->decimal('cost', 12, 2)->nullable();

        $table->foreign('asset_id')
              ->references('asset_code')
              ->on('assets')
              ->onDelete('cascade');

        $table->timestamps();

        // Critical compound indexes for your frontend
        $table->index(['status', 'scheduled_date']);           // Overdue query
        $table->index(['asset_id', 'status']);                 // Asset-specific view
        $table->index('scheduled_date');
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_records');
    }
};

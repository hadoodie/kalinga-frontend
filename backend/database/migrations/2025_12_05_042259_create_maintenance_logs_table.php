<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up()
{
    Schema::create('maintenance_logs', function (Blueprint $table) {
        $table->id();
        $table->string('maintenance_code')->unique()->nullable();
        $table->foreignId('asset_id')->constrained()->onDelete('cascade');
        $table->date('scheduled_date')->index();
        $table->date('completed_date')->nullable();
        $table->text('description')->nullable();
        $table->string('status')->default('scheduled')
              ->check("status IN ('scheduled', 'overdue', 'completed')");
        $table->string('priority')->default('medium')
              ->check("priority IN ('low', 'medium', 'high')");
        $table->string('technician')->nullable();
        $table->decimal('cost', 10, 2)->nullable();
        $table->text('notes')->nullable();
        $table->foreignId('created_by')->nullable()->constrained('users');
        $table->timestamps();
    });
}
};

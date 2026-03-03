<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('stock_movements')) {
        return;
    }
    
        // notification_logs — powers every banner, email, SMS, and Viber alert
Schema::create('notification_logs', function (Blueprint $table) {
    $table->id();
    $table->string('type'); // "request_created", "allocation_confirmed", "temperature_alert", "pod_overdue"
    $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();
    $table->morphs('notifiable'); // Can attach to allocation, request, delivery_log, etc.
    $table->text('message');
    $table->string('channel')->default('database'); // database, mail, sms, broadcast
    $table->enum('status', ['pending', 'sent', 'failed', 'read'])->default('pending');
    $table->timestamp('sent_at')->nullable();
    $table->timestamp('read_at')->nullable();
    $jsonb('meta')->nullable();
    $table->timestamps();

    $table->index(['type', 'created_at']);
    $table->index('status');
    $table->index('recipient_id');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};

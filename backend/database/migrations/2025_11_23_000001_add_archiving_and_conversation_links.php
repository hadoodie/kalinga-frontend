<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            if (!Schema::hasColumn('conversations', 'is_archived')) {
                $table->boolean('is_archived')->default(false)->after('user_id2');
            }

            if (!Schema::hasColumn('conversations', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('is_archived');
            }
        });

        Schema::table('incidents', function (Blueprint $table) {
            if (!Schema::hasColumn('incidents', 'conversation_id')) {
                $table->foreignId('conversation_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('conversations')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            if (Schema::hasColumn('incidents', 'conversation_id')) {
                $table->dropConstrainedForeignId('conversation_id');
            }
        });

        Schema::table('conversations', function (Blueprint $table) {
            if (Schema::hasColumn('conversations', 'archived_at')) {
                $table->dropColumn('archived_at');
            }

            if (Schema::hasColumn('conversations', 'is_archived')) {
                $table->dropColumn('is_archived');
            }
        });
    }
};

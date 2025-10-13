<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed users with different roles, hospitals and resources
        $this->call([
            UserSeeder::class,
            HospitalSeeder::class,
            ResourceSeeder::class,
        ]);
    }
}

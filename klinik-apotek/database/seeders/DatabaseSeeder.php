<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seeding Owner Admin
        User::factory()->create([
            'name' => 'Owner Admin',
            'email' => 'admin@delcom.org',
            'password' => bcrypt('SDI@2027'),
            'role' => 'owner',
        ]);

        // Seeding Cashier Staff
        User::factory()->create([
            'name' => 'Cashier Staff',
            'email' => 'cashier@delcom.org',
            'password' => bcrypt('SDI@2027'),
            'role' => 'cashier',
        ]);
    }
}

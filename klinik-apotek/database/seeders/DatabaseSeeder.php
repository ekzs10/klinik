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
        User::updateOrCreate(
            ['email' => 'admin@delcom.org'],
            [
                'name' => 'Owner Admin',
                'password' => bcrypt('SDI@2027'),
                'role' => 'owner',
            ]
        );

        // Seeding Cashier Staff
        User::updateOrCreate(
            ['email' => 'cashier@delcom.org'],
            [
                'name' => 'Cashier Staff',
                'password' => bcrypt('SDI@2027'),
                'role' => 'cashier',
            ]
        );
    }
}

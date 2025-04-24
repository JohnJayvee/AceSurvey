<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'username' => 'admin',
                'password' => Hash::make('password'),
            ],
            [
                'name' => 'Jayvee',
                'email' => 'jsiuagan@gmail.com',
                'username' => 'jj',
                'password' => Hash::make('4'),
            ]
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}

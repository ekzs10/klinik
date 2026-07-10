<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['in', 'out']);
            $table->integer('quantity');
            $table->integer('stock_remain')->default(0); 
            $table->date('expired_date')->nullable(); 
            $table->integer('revenue')->default(0);
            $table->integer('capital')->default(0);
            $table->date('transaction_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
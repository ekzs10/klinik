<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;

// --- HALAMAN PUBLIK ---
Route::get('/', [PublicController::class, 'index'])->name('public.index');
Route::post('/quick-deduct', [PublicController::class, 'quickDeduct'])->name('public.deduct');

// --- HALAMAN ADMIN PANEL PANEL ---
Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/medicines', [MedicineController::class, 'store'])->name('medicines.store');
    Route::put('/medicines/{medicine}', [MedicineController::class, 'update'])->name('medicines.update');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::get('/export-csv', [DashboardController::class, 'exportCsv'])->name('admin.export');
});

// PENTING: Harus di paling bawah luar grup middleware
require __DIR__.'/auth.php';
<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryService
{
    public function recordTransaction(Medicine $medicine, string $type, int $qty, ?string $expiredDate = null): void
    {
        DB::transaction(function () use ($medicine, $type, $qty, $expiredDate) {
            
            if ($type === 'in') {
                Transaction::create([
                    'medicine_id' => $medicine->id,
                    'type' => 'in',
                    'quantity' => $qty,
                    'stock_remain' => $qty,
                    'expired_date' => $expiredDate,
                    'transaction_date' => Carbon::now('Asia/Jakarta')->toDateString(),
                ]);
                $medicine->increment('stock', $qty); 
            } 
            
            else if ($type === 'out') {
                if ($medicine->stock < $qty) {
                    throw new \Exception("Stok tidak mencukupi.");
                }

                $availableBatches = Transaction::where('medicine_id', $medicine->id)
                    ->where('type', 'in')
                    ->where('stock_remain', '>', 0)
                    ->orderBy('expired_date', 'asc')
                    ->lockForUpdate()
                    ->get();

                $remainingQtyToDeduct = $qty;
                $totalRevenue = 0;
                $totalCapital = 0;

                foreach ($availableBatches as $batch) {
                    if ($remainingQtyToDeduct <= 0) break;

                    $qtyTakenFromBatch = min($batch->stock_remain, $remainingQtyToDeduct);
                    $batch->stock_remain -= $qtyTakenFromBatch;
                    $batch->save();

                    $totalRevenue += ($medicine->selling_price * $qtyTakenFromBatch);
                    $totalCapital += ($medicine->purchase_price * $qtyTakenFromBatch);
                    $remainingQtyToDeduct -= $qtyTakenFromBatch;
                }

                Transaction::create([
                    'medicine_id' => $medicine->id,
                    'type' => 'out',
                    'quantity' => $qty,
                    'revenue' => $totalRevenue,
                    'capital' => $totalCapital,
                    'transaction_date' => Carbon::now('Asia/Jakarta')->toDateString(),
                ]);

                $medicine->decrement('stock', $qty);
            }
        });
    }

    public function getProfitLoss(?string $filterType = 'monthly', ?string $filterValue = null): array
    {
        $query = Transaction::where('type', 'out');
        $period = 'monthly';

        if ($filterType === 'yearly' && $filterValue) {
            $query->whereYear('transaction_date', $filterValue);
            $period = 'yearly';
        } elseif ($filterType === 'monthly' && $filterValue) {
            $parts = explode('-', $filterValue);
            if (count($parts) === 2) {
                $query->whereYear('transaction_date', $parts[0])->whereMonth('transaction_date', $parts[1]);
            }
        } else {
            $query->whereMonth('transaction_date', Carbon::now('Asia/Jakarta')->month)
                  ->whereYear('transaction_date', Carbon::now('Asia/Jakarta')->year);
        }

        $transactions = $query->get();
        $totalRevenue = $transactions->sum('revenue');
        $totalCapital = $transactions->sum('capital');

        // FITUR BARU: Generate data khusus untuk Chart (Grafik)
        $chartData = [];
        if ($period === 'yearly') {
            $grouped = $transactions->groupBy(function($date) {
                return Carbon::parse($date->transaction_date)->format('M');
            });
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            foreach ($months as $m) {
                $monthTxs = $grouped->get($m, collect([]));
                $chartData[] = [
                    'name' => $m,
                    'Pendapatan' => $monthTxs->sum('revenue'),
                    'Modal' => $monthTxs->sum('capital'),
                    'Laba' => $monthTxs->sum('revenue') - $monthTxs->sum('capital'),
                ];
            }
        } else {
            $grouped = $transactions->groupBy(function($date) {
                return Carbon::parse($date->transaction_date)->format('d');
            });
            $dateObj = $filterValue ? Carbon::parse($filterValue . '-01') : Carbon::now('Asia/Jakarta');
            $daysInMonth = $dateObj->daysInMonth;
            
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $dayStr = str_pad($i, 2, '0', STR_PAD_LEFT);
                $dayTxs = $grouped->get($dayStr, collect([]));
                $chartData[] = [
                    'name' => $i . ' ' . $dateObj->format('M'),
                    'Pendapatan' => $dayTxs->sum('revenue'),
                    'Modal' => $dayTxs->sum('capital'),
                    'Laba' => $dayTxs->sum('revenue') - $dayTxs->sum('capital'),
                ];
            }
        }

        return [
            'revenue' => $totalRevenue,
            'capital' => $totalCapital,
            'net_profit' => $totalRevenue - $totalCapital,
            'chart_data' => $chartData // Data ini otomatis akan diterima oleh React
        ];
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\Transaction;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicController extends Controller
{
    public function index()
    {
        $availableStock = Transaction::with('medicine')
            ->where('type', 'in')
            ->where('stock_remain', '>', 0)
            ->orderBy('expired_date', 'asc')
            ->get()
            ->map(function ($batch) {
                return [
                    'id' => $batch->medicine->id,
                    'name' => $batch->medicine->name,
                    'selling_price' => $batch->medicine->selling_price,
                    'stock_remain' => $batch->stock_remain,
                    'expired_date' => $batch->expired_date,
                ];
            });

        return Inertia::render('Public/Index', [
            'availableStock' => $availableStock
        ]);
    }

    public function quickDeduct(Request $request, InventoryService $inventory)
    {
        $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $medicine = Medicine::findOrFail($request->medicine_id);

        try {
            $inventory->recordTransaction($medicine, 'out', $request->quantity);
            return redirect()->back();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
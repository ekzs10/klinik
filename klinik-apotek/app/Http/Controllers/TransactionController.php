<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function store(Request $request, InventoryService $inventory)
    {
        $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'expired_date' => 'required_if:type,in|nullable|date', 
        ]);

        $medicine = Medicine::findOrFail($request->medicine_id);

        try {
            $inventory->recordTransaction($medicine, $request->type, $request->quantity, $request->expired_date);
            return redirect()->back();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['quantity' => $e->getMessage()]);
        }
    }
}
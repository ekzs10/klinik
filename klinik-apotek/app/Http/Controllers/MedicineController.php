<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    public function store(Request $request)
    {
        if ($request->has('name')) {
            $request->merge(['name' => ucwords(strtolower($request->name))]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:medicines,name',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'minimum_stock' => 'required|numeric|min:1',
        ], [
            'name.unique' => 'Nama obat ini sudah terdaftar di Master Data apotek.',
        ]);

        Medicine::create($validated);
        return redirect()->back();
    }

    // FITUR BARU: Update Data Master Obat
    public function update(Request $request, Medicine $medicine)
    {
        if ($request->has('name')) {
            $request->merge(['name' => ucwords(strtolower($request->name))]);
        }

        $validated = $request->validate([
            // Abaikan ID obat ini sendiri saat mengecek duplikat
            'name' => 'required|string|max:255|unique:medicines,name,' . $medicine->id,
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'minimum_stock' => 'required|numeric|min:1',
        ], [
            'name.unique' => 'Nama obat ini sudah digunakan oleh data lain.',
        ]);

        $medicine->update($validated);
        return redirect()->back();
    }
}
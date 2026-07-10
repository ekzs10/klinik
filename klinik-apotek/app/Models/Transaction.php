<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id', 'type', 'quantity', 'stock_remain', 
        'expired_date', 'revenue', 'capital', 'transaction_date'
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
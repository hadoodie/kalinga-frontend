<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AllocationRequest extends Model {
    use HasFactory;
    protected $guarded = []; 
    protected $casts = [
        'tracking_history' => 'array', 
    ];
}
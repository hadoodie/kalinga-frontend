<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Vital extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'patient_name', // Added this so it saves to DB
        'temperature',
        'bpm',
        'spo2'
    ];
}

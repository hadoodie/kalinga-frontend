<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'category',
        'description',
        'unit',
        'quantity',
        'minimum_stock',
        'status',
        'location',
        'hospital_id',
        'expiry_date',
        'image_url',
        'is_critical',
        'requires_refrigeration',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'minimum_stock' => 'decimal:2',
          'is_critical' => 'boolean',
        'requires_refrigeration' => 'boolean',
        'expiry_date' => 'date',
    ];

    /**
     * Relationships
     */

    // Belongs to hospital
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    // Get total value of this resource
    public function getTotalValueAttribute()
    {
        return 0; // Unit cost removed from migration
    }

    // Check if stock is low
    public function getIsLowStockAttribute()
    {
        return $this->quantity <= $this->minimum_stock && $this->quantity > 0;
    }

    // Check if out of stock
    public function getIsOutOfStockAttribute()
    {
        return $this->quantity <= 0;
    }

    // Check if expiring soon (within 30 days)
    public function getIsExpiringSoonAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date->diffInDays(now()) <= 30 && $this->expiry_date->isFuture();
    }

    // Check if expired
    public function getIsExpiredAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date->isPast();
    }

    /**
     * Scopes
     */

    // Get low stock items
    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity', '<=', 'minimum_stock')
                    ->where('quantity', '>', 0);
    }

    // Get out of stock items
    public function scopeOutOfStock($query)
    {
        return $query->where('quantity', '<=', 0);
    }

    // Get critical items
    public function scopeCritical($query)
    {
        return $query->where('is_critical', true);
    }

    // Get expiring soon items
    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->whereNotNull('expiry_date')
                    ->whereDate('expiry_date', '<=', now()->addDays($days))
                    ->whereDate('expiry_date', '>=', now());
    }

    // Get by category
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Get available (in stock)
    public function scopeAvailable($query)
    {
        return $query->where('quantity', '>', 0);
    }

    /**
     * Methods
     */

    // Update status based on quantity
    public function updateStatus()
    {
        if ($this->quantity <= 0) {
            $this->status = 'Out of Stock';
        } elseif ($this->quantity <= ($this->minimum_stock * 0.2)) {
            $this->status = 'Critical';
        } elseif ($this->quantity <= $this->minimum_stock) {
            $this->status = 'Low';
        } else {
            $this->status = 'High';
        }
        $this->save();
    }

    // Add stock
    public function addStock($quantity, $warehouse_id = null, $reason = null)
    {
        $previousQuantity = $this->quantity;
        $this->quantity += $quantity;
        $this->save();

        // Record stock movement
        StockMovement::create([
            'resource_id' => $this->id,
            'warehouse_id' => $warehouse_id ?? $this->warehouse_id,
            'movement_type' => 'in',
            'quantity' => $quantity,
            'previous_quantity' => $previousQuantity,
            'new_quantity' => $this->quantity,
            'performed_by' => auth()->id(),
            'reason' => $reason,
        ]);

        $this->updateStatus();
        return $this;
    }

    // Remove stock
    public function removeStock($quantity, $warehouse_id = null, $reason = null)
    {
        if ($this->quantity < $quantity) {
            throw new \Exception("Insufficient stock. Available: {$this->quantity}, Requested: {$quantity}");
        }

        $previousQuantity = $this->quantity;
        $this->quantity -= $quantity;
        $this->save();

        // Record stock movement
        StockMovement::create([
            'resource_id' => $this->id,
            'warehouse_id' => $warehouse_id ?? $this->warehouse_id,
            'movement_type' => 'out',
            'quantity' => $quantity,
            'previous_quantity' => $previousQuantity,
            'new_quantity' => $this->quantity,
            'performed_by' => auth()->id(),
            'reason' => $reason,
        ]);

        $this->updateStatus();
        return $this;
    }
}
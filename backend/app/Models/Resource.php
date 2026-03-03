<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

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
        'received',
        'distributed',
        'minimum_stock',
        'status',
        'location',
        'hospital_id',
        'expiry_date',
        'image_url',
        'is_critical',
        'requires_refrigeration',
        // NEW: History tracking fields
        'last_stock_movement_date',
        'last_status_change_date',
        'significant_quantity_date',
        'expiry_alert_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'received' => 'decimal:2',
        'distributed' => 'decimal:2',
        'minimum_stock' => 'decimal:2',
        'is_critical' => 'boolean',
        'requires_refrigeration' => 'boolean',
        'expiry_date' => 'date',
        // NEW: Cast history fields
        'last_stock_movement_date' => 'date',
        'last_status_change_date' => 'date',
        'significant_quantity_date' => 'date',
        'expiry_alert_date' => 'date',
    ];

    /**
     * Relationships
     */

    // Belongs to hospital
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    // NEW: Stock movements relationship
    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
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

    // NEW: Check if needs expiry alert
    public function getNeedsExpiryAlertAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date->diffInDays(now()) <= 30;
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

    // NEW: Get items with recent stock movements
    public function scopeWithRecentMovements($query, $days = 7)
    {
        return $query->whereNotNull('last_stock_movement_date')
                    ->where('last_stock_movement_date', '>=', now()->subDays($days));
    }

    /**
     * Methods
     */

    // Update status based on quantity
    public function updateStatus()
    {
        $previousStatus = $this->status;
        
        if ($this->quantity <= 0) {
            $this->status = 'Out of Stock';
        } elseif ($this->quantity <= ($this->minimum_stock * 0.2)) {
            $this->status = 'Critical';
        } elseif ($this->quantity <= $this->minimum_stock) {
            $this->status = 'Low';
        } else {
            $this->status = 'High';
        }

        // Record status change if it changed
        if ($previousStatus !== $this->status) {
            $this->last_status_change_date = now();
            
            // Create status change event for calendar
            $this->recordStatusChangeEvent($previousStatus, $this->status);
        }

        $this->save();
    }

    // NEW: Record stock movement with calendar tracking
    public function recordStockMovement($type, $quantity, $reason = null)
    {
        $movement = StockMovement::create([
            'resource_id' => $this->id,
            'movement_type' => $type,
            'quantity' => $quantity,
            'previous_quantity' => $this->quantity,
            'new_quantity' => $this->quantity, // Will be updated after quantity change
            'reason' => $reason ?? 'Manual adjustment',
            'performed_by' => auth()->id(),
        ]);

        $this->last_stock_movement_date = now();
        
        // Check for significant quantity changes
        $this->checkSignificantQuantityChange();

        return $movement;
    }

    // NEW: Check for significant quantity threshold crossings
    public function checkSignificantQuantityChange()
    {
        $previousQuantity = $this->getOriginal('quantity');
        $currentQuantity = $this->quantity;

        // Check if crossed important thresholds
        $thresholds = [
            $this->minimum_stock * 0.2, // Critical threshold (20% of min stock)
            $this->minimum_stock,        // Low stock threshold
            0,                           // Out of stock threshold
        ];

        foreach ($thresholds as $threshold) {
            if (($previousQuantity > $threshold && $currentQuantity <= $threshold) ||
                ($previousQuantity <= $threshold && $currentQuantity > $threshold)) {
                $this->significant_quantity_date = now();
                break;
            }
        }
    }

    // NEW: Record status change event for calendar
    public function recordStatusChangeEvent($fromStatus, $toStatus)
    {
        // This creates a special calendar event for status changes
        // You can log this to a separate table or include in stock movements
        Log::info("Resource status changed", [
            'resource_id' => $this->id,
            'resource_name' => $this->name,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'facility' => $this->location,
            'timestamp' => now()
        ]);
    }

    // UPDATED: Add stock with enhanced tracking
    public function addStock($quantity, $reason = null)
    {
        $previousQuantity = $this->quantity;
        $this->quantity += $quantity;
        $this->received += $quantity;
        $this->save();

        // Update the stock movement with correct new quantity
        $movement = $this->recordStockMovement('in', $quantity, $reason);
        $movement->update([
            'new_quantity' => $this->quantity,
            'previous_quantity' => $previousQuantity
        ]);

        $this->updateStatus();
        return $this;
    }

    // UPDATED: Remove stock with enhanced tracking
    public function removeStock($quantity, $reason = null)
    {
        if ($this->quantity < $quantity) {
            throw new \Exception("Insufficient stock. Available: {$this->quantity}, Requested: {$quantity}");
        }

        $previousQuantity = $this->quantity;
        $this->quantity -= $quantity;
        $this->distributed += $quantity;
        $this->save();

        // Update the stock movement with correct new quantity
        $movement = $this->recordStockMovement('out', $quantity, $reason);
        $movement->update([
            'new_quantity' => $this->quantity,
            'previous_quantity' => $previousQuantity
        ]);

        $this->updateStatus();
        return $this;
    }

    // NEW: Update expiry alert date
    public function updateExpiryAlert()
    {
        if ($this->expiry_date) {
            $this->expiry_alert_date = $this->expiry_date->subDays(30);
            $this->save();
        }
    }

    // NEW: Get calendar events for this resource
    public function getCalendarEvents($startDate = null, $endDate = null)
    {
        $query = $this->stockMovements()->with('performedBy');

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}
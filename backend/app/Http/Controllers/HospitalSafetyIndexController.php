<?php

namespace App\Http\Controllers;

use App\Models\Hospital;
use App\Models\HospitalSafetyAssessment;
use App\Models\ResourceResilienceConfig;
use App\Models\TankTelemetry;
use App\Models\TankLevelHistory;
use App\Models\VendorAgreement;
use App\Services\ResilienceCalculatorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HospitalSafetyIndexController extends Controller
{
    protected ResilienceCalculatorService $resilienceService;

    public function __construct(ResilienceCalculatorService $resilienceService)
    {
        $this->resilienceService = $resilienceService;
    }

    // ==========================================
    // DASHBOARD & OVERVIEW
    // ==========================================

    /**
     * Get system-wide HSI dashboard data
     */
    public function dashboard(): JsonResponse
    {
        $systemResilience = $this->resilienceService->getSystemResilience();
        
        return response()->json([
            'success' => true,
            'data' => $systemResilience,
        ]);
    }

    /**
     * Get HSI compliance report for a specific hospital
     */
    public function hospitalCompliance(Hospital $hospital): JsonResponse
    {
        $report = $this->resilienceService->getHsiComplianceReport($hospital);
        
        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Simulate disaster scenario for a hospital
     */
    public function simulateDisaster(Request $request, Hospital $hospital): JsonResponse
    {
        $request->validate([
            'surge_multiplier' => 'nullable|numeric|min:1|max:5',
            'duration_hours' => 'nullable|integer|min:1|max:720',
        ]);

        $simulation = $this->resilienceService->simulateDisaster(
            $hospital,
            $request->input('surge_multiplier', 1.5),
            $request->input('duration_hours', 72)
        );

        return response()->json([
            'success' => true,
            'data' => $simulation,
        ]);
    }

    // ==========================================
    // SAFETY ASSESSMENTS
    // ==========================================

    /**
     * List assessments for a hospital
     */
    public function assessments(Hospital $hospital): JsonResponse
    {
        $assessments = $hospital->safetyAssessments()
            ->with('assessor:id,name')
            ->orderBy('assessment_date', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $assessments,
        ]);
    }

    /**
     * Store a new safety assessment
     */
    public function storeAssessment(Request $request, Hospital $hospital): JsonResponse
    {
        $validated = $request->validate([
            // General Information
            'routine_bed_capacity' => 'nullable|integer|min:1',
            'maximum_bed_capacity' => 'nullable|integer|min:1',
            'routine_staff_count' => 'nullable|integer|min:0',
            'maximum_staff_count' => 'nullable|integer|min:0',
            'conducted_at' => 'nullable|date',
            'conducted_via' => 'nullable|string|max:255',
            'checklist' => 'nullable|array',
            'overall_index' => 'nullable|numeric|min:0|max:100',
            'category' => 'nullable|string|max:10',
            
            // Module 2: Structural
            'structural_score' => 'required|numeric|min:0|max:100',
            'has_prior_damage' => 'boolean',
            'meets_current_standards' => 'boolean',
            
            // Module 3: Non-Structural
            'non_structural_score' => 'required|numeric|min:0|max:100',
            'generator_starts_within_10s' => 'boolean',
            'generator_coverage_percent' => 'nullable|numeric|min:0|max:100',
            'fuel_reserve_hours' => 'nullable|numeric|min:0',
            'water_reserve_liters' => 'nullable|numeric|min:0',
            'water_consumption_per_bed_day' => 'nullable|numeric|min:0',
            'oxygen_reserve_days' => 'nullable|numeric|min:0',
            'medical_gas_reserve_days' => 'nullable|numeric|min:0',
            'ventilator_survival_hours' => 'nullable|numeric|min:0',
            'power_rating' => 'nullable|in:low,medium,high',
            'water_rating' => 'nullable|in:low,medium,high',
            'medical_gas_rating' => 'nullable|in:low,medium,high',
            'life_support_rating' => 'nullable|in:low,medium,high',
            'evidence_structural_drawings' => 'nullable|string|max:2048',
            'evidence_maintenance_logs' => 'nullable|string|max:2048',
            'evidence_training_certificates' => 'nullable|string|max:2048',
            'evidence_water_coa' => 'nullable|string|max:2048',
            'seismic_bracing_medical_gas' => 'boolean',
            'flexible_connections_pipes' => 'boolean',
            'electrical_panels_above_flood' => 'boolean',
            'risk_model' => 'nullable|in:high_risk,low_risk',
            'max_emergency_beds' => 'nullable|integer|min:0',
            'hazards_geological' => 'nullable|array',
            'hazards_hydrometeorological' => 'nullable|array',
            'hazards_biological' => 'nullable|array',
            'hazards_societal' => 'nullable|array',
            
            // Module 4: Emergency Management
            'emergency_mgmt_score' => 'required|numeric|min:0|max:100',
            'has_disaster_committee' => 'boolean',
            'has_eoc' => 'boolean',
            'has_backup_communications' => 'boolean',
            'has_vendor_mous' => 'boolean',
            'has_staff_contact_list' => 'boolean',
            
            'notes' => 'nullable|string|max:5000',
        ]);

        // Apply sensible defaults from hospital profile when omitted by UI
        $validated['routine_bed_capacity'] = $validated['routine_bed_capacity']
            ?? $hospital->routine_bed_capacity
            ?? $hospital->capacity
            ?? 0;

        $validated['maximum_bed_capacity'] = $validated['maximum_bed_capacity']
            ?? $hospital->maximum_bed_capacity
            ?? $hospital->capacity
            ?? $validated['routine_bed_capacity'];

        $validated['hospital_id'] = $hospital->id;
        $validated['assessor_id'] = $request->user()->id;
        $validated['risk_model'] = $validated['risk_model'] ?? \App\Models\HospitalSafetyAssessment::MODEL_HIGH_RISK;
        $validated['assessment_date'] = $validated['conducted_at'] ?? now();
        $validated['next_assessment_due'] = now()->addYear();
        $validated['status'] = 'completed';

        // Calculate water reserve hours
        $maxBeds = $validated['max_emergency_beds']
            ?? $validated['maximum_bed_capacity']
            ?? $hospital->max_emergency_beds
            ?? $hospital->maximum_bed_capacity
            ?? $hospital->capacity;

        if (isset($validated['water_reserve_liters']) && isset($validated['water_consumption_per_bed_day'])) {
            $dailyUsage = $maxBeds * $validated['water_consumption_per_bed_day'];
            $validated['water_reserve_hours'] = $dailyUsage > 0 
                ? ($validated['water_reserve_liters'] / ($dailyUsage / 24)) 
                : 0;
        }

        // Enforce critical thresholds when ratings are declared High
        $this->enforceCriticalSystemThresholds($validated, $maxBeds);

        // Check oxygen meets 15-day requirement
        $validated['oxygen_meets_15day_requirement'] = ($validated['oxygen_reserve_days'] ?? 0) >= 15;

        // Calculate overall index
        $validated['overall_safety_index'] = $this->resilienceService->calculateOverallSafetyIndex(
            $validated['structural_score'],
            $validated['non_structural_score'],
            $validated['emergency_mgmt_score'],
            $validated['risk_model']
        );

        // Determine safety category
        $validated['safety_category'] = $this->resilienceService->determineSafetyCategory(
            $validated['overall_safety_index']
        );

        DB::beginTransaction();
        try {
            $assessment = HospitalSafetyAssessment::create($validated);

            // Update hospital's current safety status
            $hospital->update([
                'current_safety_index' => $assessment->overall_safety_index,
                'safety_category' => $assessment->safety_category,
                'last_assessment_date' => $assessment->assessment_date,
                'routine_bed_capacity' => $assessment->routine_bed_capacity,
                'maximum_bed_capacity' => $assessment->maximum_bed_capacity,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Assessment saved successfully',
                'data' => $assessment->load('assessor:id,name'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to save assessment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific assessment
     */
    public function showAssessment(HospitalSafetyAssessment $assessment): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $assessment->load(['hospital', 'assessor:id,name']),
        ]);
    }

    /**
     * Enforce DOH high-rating gates and hazard-driven critical items.
     */
    protected function enforceCriticalSystemThresholds(array &$validated, int $maxBeds): void
    {
        // Water: 300 L/bed/day for 72h
        if (($validated['water_rating'] ?? null) === 'high') {
            $requiredLiters = $maxBeds * 300 * 3; // 300 L/bed/day * 3 days
            $actual = $validated['water_reserve_liters'] ?? 0;
            if ($actual < $requiredLiters) {
                abort(422, 'Water rating High requires at least 300L/bed/day for 72h.');
            }
            if (empty($validated['evidence_water_coa'])) {
                abort(422, 'Water rating High requires a Certificate of Analysis upload.');
            }
        }

        // Generator + fuel: start <=10s and 72h fuel
        if (($validated['power_rating'] ?? null) === 'high') {
            if (empty($validated['generator_starts_within_10s'])) {
                abort(422, 'Power rating High requires generator start within 10 seconds.');
            }
            if (($validated['fuel_reserve_hours'] ?? 0) < 72) {
                abort(422, 'Power rating High requires at least 72 hours of fuel reserve.');
            }
            if (empty($validated['evidence_maintenance_logs'])) {
                abort(422, 'Power rating High requires maintenance/testing logs for generators/pumps.');
            }
        }

        // Medical gases: 15 days reserve
        if (($validated['medical_gas_rating'] ?? null) === 'high') {
            if (($validated['medical_gas_reserve_days'] ?? 0) < 15) {
                abort(422, 'Medical gas rating High requires 15 days reserve capacity.');
            }
        }

        // Life support: ventilators 72h
        if (($validated['life_support_rating'] ?? null) === 'high') {
            if (($validated['ventilator_survival_hours'] ?? 0) < 72) {
                abort(422, 'Life support rating High requires ventilator/life support availability for 72 hours.');
            }
        }

        // Evidence for structural, maintenance, training
        if (($validated['structural_score'] ?? 0) >= 80 && empty($validated['evidence_structural_drawings'])) {
            abort(422, 'High structural rating requires as-built drawings upload.');
        }
        if (($validated['emergency_mgmt_score'] ?? 0) >= 80 && empty($validated['evidence_training_certificates'])) {
            abort(422, 'High emergency management rating requires training certificates.');
        }

        // Hazard-driven critical flags
        $geologicalHazards = $validated['hazards_geological'] ?? [];
        $hydroHazards = $validated['hazards_hydrometeorological'] ?? [];

        $geoHigh = is_array($geologicalHazards) && (in_array('high', $geologicalHazards, true) || in_array('High', $geologicalHazards, true));
        $floodHigh = is_array($hydroHazards) && (in_array('flood_high', $hydroHazards, true) || in_array('flood', $hydroHazards, true) || in_array('high', $hydroHazards, true));

        if ($geoHigh) {
            if (empty($validated['seismic_bracing_medical_gas']) || empty($validated['flexible_connections_pipes'])) {
                abort(422, 'Geological hazard High requires seismic bracing for medical gases and flexible pipe connections.');
            }
        }

        if ($floodHigh) {
            if (empty($validated['electrical_panels_above_flood'])) {
                abort(422, 'Flood hazard High requires electrical panels located above flood level.');
            }
        }
    }

    // ==========================================
    // TANK TELEMETRY
    // ==========================================

    /**
     * List tanks for a hospital
     */
    public function tanks(Hospital $hospital): JsonResponse
    {
        $tanks = $hospital->tanks()
            ->with('recordedBy:id,name')
            ->orderBy('tank_type')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tanks,
        ]);
    }

    /**
     * Create a new tank
     */
    public function storeTank(Request $request, Hospital $hospital): JsonResponse
    {
        $validated = $request->validate([
            'tank_name' => 'required|string|max:255',
            'tank_code' => 'nullable|string|max:100',
            'tank_type' => ['required', Rule::in([
                TankTelemetry::TYPE_WATER,
                TankTelemetry::TYPE_FUEL_DIESEL,
                TankTelemetry::TYPE_FUEL_GASOLINE,
                TankTelemetry::TYPE_LPG,
                TankTelemetry::TYPE_OXYGEN,
                TankTelemetry::TYPE_OTHER,
            ])],
            'location_description' => 'nullable|string|max:500',
            'total_capacity_liters' => 'required|numeric|min:1',
            'usable_capacity_liters' => 'nullable|numeric|min:1',
            'minimum_safe_level_liters' => 'nullable|numeric|min:0',
            'current_level_liters' => 'required|numeric|min:0',
            'normal_daily_consumption' => 'nullable|numeric|min:0',
            'surge_daily_consumption' => 'nullable|numeric|min:0',
            'critical_level_percent' => 'nullable|numeric|min:0|max:100',
            'warning_level_percent' => 'nullable|numeric|min:0|max:100',
            'refill_level_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        $validated['hospital_id'] = $hospital->id;
        $validated['recorded_by_user_id'] = $request->user()->id;
        $validated['entry_method'] = TankTelemetry::ENTRY_MANUAL;
        $validated['level_recorded_at'] = now();
        $validated['is_active'] = true;

        // Calculate HSI required capacity based on bed count
        $maxBeds = $hospital->maximum_bed_capacity ?? $hospital->capacity;
        $tank = new TankTelemetry($validated);
        $validated['hsi_required_capacity_liters'] = $tank->calculateHsiRequiredCapacity($maxBeds);

        // Set defaults for thresholds if not provided
        $validated['critical_level_percent'] ??= 15;
        $validated['warning_level_percent'] ??= 25;
        $validated['refill_level_percent'] ??= 80;
        $validated['usable_capacity_liters'] ??= $validated['total_capacity_liters'];

        // Calculate current percentage
        $validated['current_level_percent'] = 
            ($validated['current_level_liters'] / $validated['usable_capacity_liters']) * 100;

        $tank = TankTelemetry::create($validated);
        $tank->recalculateMetrics()->save();

        // Record initial level in history
        $tank->levelHistory()->create([
            'level_liters' => $validated['current_level_liters'],
            'level_percent' => $tank->current_level_percent,
            'change_type' => TankLevelHistory::TYPE_READING,
            'change_amount_liters' => $validated['current_level_liters'],
            'recorded_by' => $request->user()->id,
            'notes' => 'Initial tank registration',
            'recorded_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tank registered successfully',
            'data' => $tank->load('recordedBy:id,name'),
        ], 201);
    }

    /**
     * Update tank level (manual entry)
     */
    public function updateTankLevel(Request $request, TankTelemetry $tank): JsonResponse
    {
        $validated = $request->validate([
            'current_level_liters' => 'required|numeric|min:0',
            'change_type' => ['nullable', Rule::in([
                TankLevelHistory::TYPE_READING,
                TankLevelHistory::TYPE_REFILL,
                TankLevelHistory::TYPE_CONSUMPTION,
                TankLevelHistory::TYPE_ADJUSTMENT,
            ])],
            'notes' => 'nullable|string|max:1000',
        ]);

        $tank->updateLevel(
            $validated['current_level_liters'],
            $request->user()->id,
            $validated['change_type'] ?? TankLevelHistory::TYPE_READING,
            $validated['notes'] ?? null
        );
        $tank->save();

        return response()->json([
            'success' => true,
            'message' => 'Tank level updated',
            'data' => $tank->fresh(['recordedBy:id,name']),
        ]);
    }

    /**
     * Record a tank refill
     */
    public function refillTank(Request $request, TankTelemetry $tank): JsonResponse
    {
        $validated = $request->validate([
            'amount_liters' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:1000',
        ]);

        $tank->recordRefill(
            $validated['amount_liters'],
            $request->user()->id,
            $validated['notes'] ?? null
        );
        $tank->save();

        return response()->json([
            'success' => true,
            'message' => 'Refill recorded successfully',
            'data' => $tank->fresh(['recordedBy:id,name']),
        ]);
    }

    /**
     * Get tank level history
     */
    public function tankHistory(TankTelemetry $tank): JsonResponse
    {
        $history = $tank->levelHistory()
            ->with('recorder:id,name')
            ->orderBy('recorded_at', 'desc')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    // ==========================================
    // VENDOR AGREEMENTS
    // ==========================================

    /**
     * List vendor agreements for a hospital
     */
    public function vendors(Hospital $hospital): JsonResponse
    {
        $vendors = $hospital->vendorAgreements()
            ->orderBy('priority_level')
            ->orderBy('resource_category')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $vendors,
        ]);
    }

    /**
     * Store a new vendor agreement
     */
    public function storeVendor(Request $request, Hospital $hospital): JsonResponse
    {
        $validated = $request->validate([
            'vendor_name' => 'required|string|max:255',
            'vendor_code' => 'nullable|string|max:100',
            'contact_person' => 'required|string|max:255',
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'required|string|max:50',
            'contact_phone_alt' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            
            'mou_reference_number' => 'nullable|string|max:100',
            'agreement_start_date' => 'nullable|date',
            'agreement_end_date' => 'nullable|date|after:agreement_start_date',
            
            'resource_category' => ['required', Rule::in([
                VendorAgreement::CATEGORY_FUEL,
                VendorAgreement::CATEGORY_WATER,
                VendorAgreement::CATEGORY_MEDICAL_GASES,
                VendorAgreement::CATEGORY_MEDICINES,
                VendorAgreement::CATEGORY_FOOD,
                VendorAgreement::CATEGORY_MEDICAL_SUPPLIES,
                VendorAgreement::CATEGORY_BLOOD_PRODUCTS,
                VendorAgreement::CATEGORY_PPE,
                VendorAgreement::CATEGORY_OTHER,
            ])],
            'resource_subcategory' => 'nullable|string|max:100',
            
            'priority_level' => 'nullable|integer|min:1|max:10',
            'guaranteed_response_hours' => 'nullable|integer|min:1',
            'minimum_order_quantity' => 'nullable|numeric|min:0',
            'minimum_order_unit' => 'nullable|string|max:50',
            'maximum_supply_capacity' => 'nullable|numeric|min:0',
            'maximum_supply_unit' => 'nullable|string|max:50',
            
            'unit_price' => 'nullable|numeric|min:0',
            'price_unit' => 'nullable|string|max:50',
            'emergency_pricing_applies' => 'boolean',
            'emergency_price_multiplier' => 'nullable|numeric|min:1|max:5',
            
            'auto_trigger_enabled' => 'boolean',
            'auto_trigger_threshold_hours' => 'nullable|numeric|min:1',
            'auto_order_quantity' => 'nullable|integer|min:1',
            'auto_order_unit' => 'nullable|string|max:50',
            
            'terms_summary' => 'nullable|string|max:2000',
            'notes' => 'nullable|string|max:2000',
        ]);

        $validated['hospital_id'] = $hospital->id;
        $validated['is_active'] = true;
        $validated['priority_level'] ??= 5;

        $vendor = VendorAgreement::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Vendor agreement created successfully',
            'data' => $vendor,
        ], 201);
    }

    /**
     * Update a vendor agreement
     */
    public function updateVendor(Request $request, VendorAgreement $vendor): JsonResponse
    {
        $validated = $request->validate([
            'vendor_name' => 'sometimes|string|max:255',
            'contact_person' => 'sometimes|string|max:255',
            'contact_email' => 'sometimes|email|max:255',
            'contact_phone' => 'sometimes|string|max:50',
            'is_active' => 'sometimes|boolean',
            'auto_trigger_enabled' => 'sometimes|boolean',
            'auto_trigger_threshold_hours' => 'sometimes|nullable|numeric|min:1',
            'auto_order_quantity' => 'sometimes|nullable|integer|min:1',
            // ... other fields can be added as needed
        ]);

        $vendor->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Vendor agreement updated',
            'data' => $vendor,
        ]);
    }

    // ==========================================
    // RESILIENCE CONFIGS
    // ==========================================

    /**
     * List resilience configs for a hospital
     */
    public function resilienceConfigs(Hospital $hospital): JsonResponse
    {
        $configs = $hospital->resilienceConfigs()
            ->with(['resource', 'primaryVendor', 'backupVendor'])
            ->orderBy('resilience_category')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $configs,
        ]);
    }

    /**
     * Store a resilience config
     */
    public function storeResilienceConfig(Request $request, Hospital $hospital): JsonResponse
    {
        $validated = $request->validate([
            'resource_id' => 'required|exists:resources,id',
            'resilience_category' => ['required', Rule::in([
                ResourceResilienceConfig::CATEGORY_FUEL,
                ResourceResilienceConfig::CATEGORY_WATER,
                ResourceResilienceConfig::CATEGORY_OXYGEN,
                ResourceResilienceConfig::CATEGORY_MEDICAL_GASES_OTHER,
                ResourceResilienceConfig::CATEGORY_MEDICINES_CRITICAL,
                ResourceResilienceConfig::CATEGORY_BLOOD_PRODUCTS,
                ResourceResilienceConfig::CATEGORY_FOOD,
                ResourceResilienceConfig::CATEGORY_PPE,
                ResourceResilienceConfig::CATEGORY_OTHER,
            ])],
            'normal_daily_usage' => 'required|numeric|min:0',
            'usage_unit' => 'required|string|max:50',
            'surge_multiplier' => 'nullable|numeric|min:1|max:5',
            'critical_threshold_hours' => 'nullable|numeric|min:0',
            'warning_threshold_hours' => 'nullable|numeric|min:0',
            'optimal_threshold_hours' => 'nullable|numeric|min:0',
            'alerts_enabled' => 'boolean',
            'auto_vendor_trigger_enabled' => 'boolean',
            'primary_vendor_id' => 'nullable|exists:vendor_agreements,id',
            'backup_vendor_id' => 'nullable|exists:vendor_agreements,id',
        ]);

        $validated['hospital_id'] = $hospital->id;
        $validated['surge_multiplier'] ??= 1.5;
        
        // Set HSI requirements based on category
        $validated['is_hsi_critical'] = ResourceResilienceConfig::isHsiCriticalCategory($validated['resilience_category']);
        $validated['hsi_minimum_hours'] = ResourceResilienceConfig::getHsiThreshold($validated['resilience_category']);
        
        // Set default thresholds if not provided
        $hsiHours = $validated['hsi_minimum_hours'];
        $validated['critical_threshold_hours'] ??= $hsiHours;
        $validated['warning_threshold_hours'] ??= $hsiHours * 1.5;
        $validated['optimal_threshold_hours'] ??= $hsiHours * 2;

        $config = ResourceResilienceConfig::create($validated);
        $config->recalculate()->save();

        return response()->json([
            'success' => true,
            'message' => 'Resilience config created',
            'data' => $config->load(['resource', 'primaryVendor', 'backupVendor']),
        ], 201);
    }

    /**
     * Recalculate resilience for a hospital
     */
    public function recalculateResilience(Hospital $hospital): JsonResponse
    {
        $results = $this->resilienceService->recalculateHospitalResilience($hospital);

        // Send admin alert if there are critical alerts
        if (!empty($results['critical_alerts'])) {
            $this->resilienceService->sendAdminAlert($hospital, $results['critical_alerts']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Resilience recalculated',
            'data' => $results,
        ]);
    }

    // ==========================================
    // DISASTER MODE
    // ==========================================

    /**
     * Activate disaster mode for a hospital
     */
    public function activateDisasterMode(Request $request, Hospital $hospital): JsonResponse
    {
        $validated = $request->validate([
            'surge_multiplier' => 'nullable|numeric|min:1|max:5',
        ]);

        $hospital->activateDisasterMode($validated['surge_multiplier'] ?? 1.5);
        
        // Recalculate all resilience
        $results = $this->resilienceService->recalculateHospitalResilience($hospital);

        // Process auto-triggers
        $triggered = $this->resilienceService->processAutoTriggers($hospital);

        return response()->json([
            'success' => true,
            'message' => 'Disaster mode activated',
            'data' => [
                'hospital' => $hospital->fresh(),
                'resilience_results' => $results,
                'vendors_notified' => $triggered,
            ],
        ]);
    }

    /**
     * Deactivate disaster mode
     */
    public function deactivateDisasterMode(Hospital $hospital): JsonResponse
    {
        $hospital->deactivateDisasterMode();

        // Recalculate at normal rates
        $results = $this->resilienceService->recalculateHospitalResilience($hospital);

        return response()->json([
            'success' => true,
            'message' => 'Disaster mode deactivated',
            'data' => [
                'hospital' => $hospital->fresh(),
                'resilience_results' => $results,
            ],
        ]);
    }

    // ==========================================
    // MANUAL VENDOR TRIGGER
    // ==========================================

    /**
     * Manually trigger vendor notification
     */
    public function triggerVendor(Request $request, VendorAgreement $vendor): JsonResponse
    {
        $hospital = $vendor->hospital;
        
        // Find a related resilience config
        $config = ResourceResilienceConfig::where('hospital_id', $hospital->id)
            ->where(function($q) use ($vendor) {
                $q->where('primary_vendor_id', $vendor->id)
                  ->orWhere('backup_vendor_id', $vendor->id);
            })
            ->first();

        if (!$config) {
            // Create a dummy config for the notification
            $config = new ResourceResilienceConfig([
                'resilience_category' => $vendor->resource_category,
                'current_survival_hours' => 0,
                'resilience_status' => ResourceResilienceConfig::STATUS_CRITICAL,
            ]);
        }

        $success = $this->resilienceService->triggerVendorNotification(
            $vendor,
            $config,
            $hospital,
            ['manual_trigger' => true, 'triggered_by' => $request->user()->id]
        );

        return response()->json([
            'success' => $success,
            'message' => $success 
                ? 'Vendor notification sent successfully' 
                : 'Failed to send vendor notification',
        ]);
    }
}

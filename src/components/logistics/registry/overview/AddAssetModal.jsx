// src/components/logistics/registry/overview/AddAssetModal.jsx
import { useState } from "react";
import { X, Save, Truck, Zap, Shield, Home, Ship, Radio, Battery, Thermometer, MapPin, Calendar, DollarSign, User, Settings, Clock } from "lucide-react";
import assetService from "@/services/assetService";

export default function AddAssetModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information (from seeder)
    asset_code: "",
    type: "Mobile Generator",
    category: "Power Supply",
    capacity: "",
    status: "Standby",
    location: "",
    personnel: "",
    
    // Maintenance
    last_maintenance: "",
    next_maintenance: "",
    condition: "",
    
    // Specifications
    manufacturer: "",
    model: "",
    year: "",
    
    // Vehicle fields (from schema)
    plate_number: "",
    fuelLevel: "",
    mileage: "",
    current_fuel_level: "",
    
    // Equipment fields (from schema)
    operating_hours: "",
    power_source: "",
    setup_time: "",
    flight_time: "",
    
    // Financial
    value: "",
    purchase_date: "",
    
    // Capabilities (from seeder - JSON)
    capabilities: {
      temperature_control: false,
      refrigerated: false,
      power_generation: false,
      patient_transport: false,
      water_rescue: false,
      communication: false,
      medical_supplies: false,
      emergency_power: false,
      general: true
    }
  });

  const assetTypes = [
    { value: "Mobile Generator", label: "Mobile Generator", icon: Zap },
    { value: "Refrigerated Van", label: "Refrigerated Van", icon: Truck },
    { value: "Ambulance", label: "Ambulance", icon: Shield },
    { value: "Command Unit", label: "Command Unit", icon: Home },
    { value: "Rescue Boat", label: "Rescue Boat", icon: Ship },
    { value: "Communication Equipment", label: "Communication Equipment", icon: Radio },
    { value: "Medical Transport", label: "Medical Transport", icon: Truck },
    { value: "Support Vehicle", label: "Support Vehicle", icon: Truck }
  ];

  const categories = [
    "Power Supply",
    "Cold Chain Transport",
    "Medical Transport",
    "Rescue Equipment",
    "Command & Control",
    "Communication",
    "Medical Equipment",
    "Support Vehicle"
  ];

  const statusOptions = ["Operational", "Under Repair", "Standby", "Decommissioned"];
  const conditionOptions = ["Excellent", "Good", "Fair", "Poor"];
  const powerSources = ["Electric", "Diesel", "Gasoline", "Hybrid", "Solar", "Battery"];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('capability_')) {
      const capabilityName = name.replace('capability_', '');
      setFormData(prev => ({
        ...prev,
        capabilities: {
          ...prev.capabilities,
          [capabilityName]: checked
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Format data according to schema
      const submitData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        value: formData.value ? parseFloat(formData.value) : null,
        current_fuel_level: formData.current_fuel_level ? parseInt(formData.current_fuel_level) : null,
        // Send capabilities as an object so backend jsonb field receives a proper JSON object
        capabilities: Object.fromEntries(
          Object.entries(formData.capabilities).filter(([_, value]) => value)
        )
      };
      
      await assetService.createAsset(submitData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Failed to create asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-backdrop-blur" onClick={onClose}></div>
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full modal-blur">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Add New Asset</h2>
                <p className="text-green-200 mt-1">Register a new asset with complete details</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-green-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-6">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold ${
                    step === stepNum 
                      ? 'bg-white text-green-600' 
                      : step > stepNum 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-200 text-green-700'
                  }`}>
                    {step > stepNum ? '✓' : stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div className={`h-1 w-12 ${step > stepNum ? 'bg-green-500' : 'bg-green-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-green-900">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Asset Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Asset Code *
                    </label>
                    <input
                      type="text"
                      name="asset_code"
                      value={formData.asset_code}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="AST-GEN-001"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unique identifier for the asset</p>
                  </div>
                  
                  {/* Asset Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Asset Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {assetTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Capacity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Capacity
                    </label>
                    <input
                      type="text"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="150 kVA, 6 patients, 500L"
                    />
                  </div>
                  
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="DOH National Center"
                      />
                    </div>
                  </div>
                  
                  {/* Personnel */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assigned Personnel
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="personnel"
                        value={formData.personnel}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Assigned personnel name"
                      />
                    </div>
                  </div>
                  
                  {/* Condition */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Condition</option>
                      {conditionOptions.map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                  >
                    Next: Specifications
                  </button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-green-900">Specifications & Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Manufacturer name"
                    />
                  </div>
                  
                  {/* Model */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Model number/name"
                    />
                  </div>
                  
                  {/* Year */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="2024"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  
                  {/* Vehicle/Equipment Specific Fields */}
                  {formData.type === 'Refrigerated Van' || formData.type === 'Ambulance' || formData.type === 'Medical Transport' || formData.type === 'Support Vehicle' ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Plate Number
                        </label>
                        <input
                          type="text"
                          name="plate_number"
                          value={formData.plate_number}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="ABC-123"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Mileage
                        </label>
                        <input
                          type="text"
                          name="mileage"
                          value={formData.mileage}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="45,200 km"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Fuel Level (%)
                        </label>
                        <div className="relative">
                          <Battery className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="number"
                            name="current_fuel_level"
                            value={formData.current_fuel_level}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="75"
                          />
                        </div>
                      </div>
                    </>
                  ) : formData.type === 'Mobile Generator' ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Operating Hours
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="operating_hours"
                            value={formData.operating_hours}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="3,240 hrs"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Power Source
                        </label>
                        <select
                          name="power_source"
                          value={formData.power_source}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select Power Source</option>
                          {powerSources.map(source => (
                            <option key={source} value={source}>{source}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Setup Time
                        </label>
                        <div className="relative">
                          <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="setup_time"
                            value={formData.setup_time}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="45 minutes"
                          />
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
                
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                  >
                    Next: Capabilities
                  </button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-green-900">Capabilities & Features</h3>
                
                <div className="space-y-4">
                  <p className="text-gray-600">Select all capabilities that apply to this asset:</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(formData.capabilities).map(([key, value]) => (
                      <label 
                        key={key} 
                        className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${
                          value ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={`capability_${key}`}
                          checked={value}
                          onChange={handleChange}
                          className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <div>
                          <span className={`text-sm font-medium ${
                            value ? 'text-green-800' : 'text-gray-700'
                          }`}>
                            {key.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {key === 'general' && (
                            <p className="text-xs text-gray-500 mt-1">Basic operational capabilities</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                  >
                    Next: Financial & Maintenance
                  </button>
                </div>
              </div>
            )}
            
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-green-900">Financial & Maintenance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Asset Value */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Asset Value (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        name="value"
                        value={formData.value}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="4150000.00"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Monetary value of the asset</p>
                  </div>
                  
                  {/* Purchase Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Purchase Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="purchase_date"
                        value={formData.purchase_date}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  
                  {/* Last Maintenance */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Maintenance Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="last_maintenance"
                        value={formData.last_maintenance}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  
                  {/* Next Maintenance */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Next Maintenance Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="next_maintenance"
                        value={formData.next_maintenance}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  
                  {/* Flight Time (for aircraft) */}
                  {formData.type.includes('Aircraft') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Flight Time
                      </label>
                      <input
                        type="text"
                        name="flight_time"
                        value={formData.flight_time}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Flight hours"
                      />
                    </div>
                  )}
                  
                  {/* Fuel Level (general) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fuel Level Description
                    </label>
                    <input
                      type="text"
                      name="fuelLevel"
                      value={formData.fuelLevel}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Fuel level description"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating Asset...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Create Asset
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
// src/components/logistics/registry/AddAssetDrawer.jsx - UPDATED WITH BLURRED BACKGROUND & DYNAMIC QUANTITY
import { useState, useEffect } from "react";
import { X, Save, Plus, Minus } from "lucide-react";

const AddAssetDrawer = ({ isOpen, onClose, onSave, editingAsset }) => {
  const [formData, setFormData] = useState({
    type: "",
    category: "",
    quantity: 1,
    unit: "",
    status: "Active",
    location: "",
    personnel: "",
    lastMaintenance: "",
    nextMaintenance: ""
  });
  const [saving, setSaving] = useState(false);

  // Asset type options
  const assetTypeOptions = [
    "Ambulance",
    "Fire Truck", 
    "Generator",
    "Rescue Boat",
    "Mobile Command",
    "Water Purifier",
    "ATV",
    "Field Hospital",
    "Defibrillator",
    "Medical Supplies",
    "X-Ray Machine",
    "Operating Room"
  ];

  // Unit options based on asset type
  const unitOptions = {
    "Ambulance": ["patients"],
    "Fire Truck": ["L water", "gallons water"],
    "Generator": ["kW", "MW"],
    "Rescue Boat": ["persons", "people"],
    "Mobile Command": ["operators", "personnel"],
    "Water Purifier": ["L/hour", "gallons/hour"],
    "ATV": ["persons", "people"],
    "Field Hospital": ["beds", "patients"],
    "Defibrillator": ["units"],
    "Medical Supplies": ["units", "boxes", "kits"],
    "X-Ray Machine": ["machines", "units"],
    "Operating Room": ["rooms", "units"]
  };

  // Default units for each asset type
  const defaultUnits = {
    "Ambulance": "patients",
    "Fire Truck": "L water", 
    "Generator": "kW",
    "Rescue Boat": "persons",
    "Mobile Command": "operators",
    "Water Purifier": "L/hour",
    "ATV": "persons",
    "Field Hospital": "beds",
    "Defibrillator": "units",
    "Medical Supplies": "units",
    "X-Ray Machine": "machines",
    "Operating Room": "rooms"
  };

  // Reset form when editingAsset changes or drawer opens/closes
  useEffect(() => {
    if (editingAsset) {
      // Parse existing capacity into quantity and unit
      const existingCapacity = editingAsset.capacity || "";
      let quantity = 1;
      let unit = "";
      
      if (existingCapacity) {
        const match = existingCapacity.match(/^(\d+)\s*(.+)$/);
        if (match) {
          quantity = parseInt(match[1]);
          unit = match[2];
        }
      }

      setFormData({
        type: editingAsset.type || "",
        category: editingAsset.category || "",
        quantity: quantity,
        unit: unit,
        status: editingAsset.status || "Active",
        location: editingAsset.location || "",
        personnel: editingAsset.personnel || "",
        lastMaintenance: editingAsset.lastMaintenance || "",
        nextMaintenance: editingAsset.nextMaintenance || ""
      });
    } else {
      setFormData({
        type: "",
        category: "",
        quantity: 1,
        unit: "",
        status: "Active",
        location: "",
        personnel: "",
        lastMaintenance: "",
        nextMaintenance: ""
      });
    }
  }, [editingAsset, isOpen]);

  // Set default unit when asset type changes
  useEffect(() => {
    if (formData.type && defaultUnits[formData.type]) {
      setFormData(prev => ({
        ...prev,
        unit: defaultUnits[formData.type]
      }));
    }
  }, [formData.type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.type || !formData.category || !formData.unit || !formData.location || !formData.personnel) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    
    // Combine quantity and unit into capacity
    const assetData = {
      ...formData,
      capacity: `${formData.quantity} ${formData.unit}`
    };

    // Remove quantity and unit from the final data
    delete assetData.quantity;
    delete assetData.unit;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSave(assetData);
    setSaving(false);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const incrementQuantity = () => {
    setFormData(prev => ({
      ...prev,
      quantity: prev.quantity + 1
    }));
  };

  const decrementQuantity = () => {
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity - 1)
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Light blurred background - you can see dashboard behind */}
{/* Full-screen blurred background (covers bottom line issue) */}
{/* Full-screen blurred background - fixed bottom line issue */}
<div
  className={`fixed inset-0 -bottom-5 z-40 transition-opacity duration-300 ${
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
  style={{
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  }}
  onClick={onClose}
/>


      
      {/* Centered Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
<div 
  className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scroll-smooth transform transition-all duration-300 border border-gray-200 ${
    isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
  }`}
  onClick={(e) => e.stopPropagation()}
>


          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Select Asset Type</option>
                    {assetTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Medical Vehicle">Medical Vehicle</option>
                    <option value="Emergency Vehicle">Emergency Vehicle</option>
                    <option value="Power Equipment">Power Equipment</option>
                    <option value="Watercraft">Watercraft</option>
                    <option value="Communication">Communication</option>
                    <option value="Water Equipment">Water Equipment</option>
                    <option value="All-Terrain Vehicle">All-Terrain Vehicle</option>
                    <option value="Medical Facility">Medical Facility</option>
                    <option value="Medical Equipment">Medical Equipment</option>
                    <option value="Medical Supplies">Medical Supplies</option>
                  </select>
                </div>

                {/* Quantity & Unit - Dynamic Section */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity / Quantity *
                  </label>
                  <div className="flex gap-2">
                    {/* Quantity Input with Controls */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                      <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={decrementQuantity}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                          disabled={formData.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                          className="flex-1 px-3 py-2 text-center border-0 focus:ring-0 text-sm w-16"
                          min="1"
                          required
                        />
                        <button
                          type="button"
                          onClick={incrementQuantity}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Unit Dropdown */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Unit</label>
                      <select
                        value={formData.unit}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                        required
                        disabled={!formData.type}
                      >
                        <option value="">
                          {formData.type ? 'Select Unit' : 'Select Type First'}
                        </option>
                        {formData.type && unitOptions[formData.type]?.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  {formData.quantity && formData.unit && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        Capacity: <strong>{formData.quantity} {formData.unit}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Standby">Standby</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Select Location</option>
                    <option value="Central Hospital">Central Hospital</option>
                    <option value="North Station">North Station</option>
                    <option value="Maintenance Depot">Maintenance Depot</option>
                    <option value="Coastal Base">Coastal Base</option>
                    <option value="HQ Operations">HQ Operations</option>
                    <option value="Storage Warehouse">Storage Warehouse</option>
                    <option value="East Wing">East Wing</option>
                    <option value="West Wing">West Wing</option>
                    <option value="Field Unit">Field Unit</option>
                  </select>
                </div>

                {/* Personnel */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Personnel *
                  </label>
                  <input
                    type="text"
                    value={formData.personnel}
                    onChange={(e) => handleChange('personnel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    placeholder="e.g., Dr. Sarah Chen"
                    required
                  />
                </div>

                {/* Last Maintenance Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Maintenance Date
                  </label>
                  <input
                    type="date"
                    value={formData.lastMaintenance}
                    onChange={(e) => handleChange('lastMaintenance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Next Maintenance Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Maintenance Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextMaintenance}
                    onChange={(e) => handleChange('nextMaintenance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg hover:bg-yellow-600 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingAsset ? 'Update' : 'Create'} Asset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAssetDrawer;
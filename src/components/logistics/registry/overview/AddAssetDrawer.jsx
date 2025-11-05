// src/components/logistics/registry/AddAssetDrawer.jsx
import { useState, useEffect } from "react";
import { X, Save, Plus, Minus, FileText, Zap } from "lucide-react";
import { mockAssetTemplates } from "../../../../services/mockAssetService";

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
    nextMaintenance: "",
    customFields: {}
  });
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateFields, setTemplateFields] = useState([]);

  // Asset type options (fallback)
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

  // Load templates when drawer opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

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
        nextMaintenance: editingAsset.nextMaintenance || "",
        customFields: editingAsset.customFields || {}
      });
      
      // Reset template mode for editing
      setUseTemplate(false);
      setSelectedTemplate(null);
      setTemplateFields([]);
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
        nextMaintenance: "",
        customFields: {}
      });
      setUseTemplate(false);
      setSelectedTemplate(null);
      setTemplateFields([]);
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

  // Load templates from service
  const loadTemplates = async () => {
    try {
      const templatesData = await mockAssetTemplates.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setUseTemplate(true);
    
    // Pre-fill form with template data
    setFormData(prev => ({
      ...prev,
      type: template.name,
      category: template.category,
      // Set other fields based on template defaults
    }));

    // Set template-specific fields
    setTemplateFields(template.fields || []);
    
    // Initialize custom fields with default values
    const initialCustomFields = {};
    template.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialCustomFields[field.id] = field.defaultValue;
      }
    });
    
    setFormData(prev => ({
      ...prev,
      customFields: initialCustomFields
    }));

    // Track template usage
    mockAssetTemplates.incrementUsage(template.id);
  };

  // Handle custom field changes
  const handleCustomFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldId]: value
      }
    }));
  };

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
      capacity: `${formData.quantity} ${formData.unit}`,
      templateId: selectedTemplate?.id || null,
      templateName: selectedTemplate?.name || null
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

  // Render field based on type
  const renderCustomField = (field) => {
    const value = formData.customFields[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm pr-8"
              required={field.required}
              min={field.validation?.min}
              max={field.validation?.max}
            />
            {field.suffix && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {field.suffix}
              </span>
            )}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            required={field.required}
          />
        );
      
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'checklist':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleCustomFieldChange(field.id, newValues);
                  }}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Light blurred background*/}
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

            {/* Template Selection Section */}
            {!editingAsset && !useTemplate && (
              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Quick Start with Templates</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {templates.slice(0, 4).map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all text-left"
                    >
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">{template.name}</div>
                        <div className="text-xs text-blue-600">{template.fieldCount} fields</div>
                      </div>
                      <Zap className="h-4 w-4 text-yellow-500" />
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    Or continue with manual entry below
                  </span>
                  <button
                    onClick={() => setUseTemplate(false)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Skip Templates
                  </button>
                </div>
              </div>
            )}

            {/* Selected Template Info */}
            {useTemplate && selectedTemplate && (
              <div className="p-4 border-b border-gray-200 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    <div>
                      <div className="font-semibold text-green-900">
                        Using: {selectedTemplate.name}
                      </div>
                      <div className="text-sm text-green-700">
                        {selectedTemplate.description}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUseTemplate(false);
                      setSelectedTemplate(null);
                      setTemplateFields([]);
                    }}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    Change Template
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">
                    Basic Information
                  </h3>
                  
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
                        disabled={useTemplate}
                      >
                        <option value="">Select Asset Type</option>
                        {assetTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {useTemplate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Type pre-filled from template
                        </p>
                      )}
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
                        disabled={useTemplate}
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
                </div>

                {/* Template-Specific Fields */}
                {useTemplate && templateFields.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">
                      Template Specific Fields
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templateFields.map(field => (
                        <div key={field.id} className={field.type === 'checklist' ? 'md:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderCustomField(field)}
                          {field.description && (
                            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
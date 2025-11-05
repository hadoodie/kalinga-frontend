// src/components/logistics/registry/TemplateBuilder.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Eye, 
  Plus, 
  GripVertical, 
  Trash2,
  Settings,
  Type,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Paperclip
} from 'lucide-react';

const TemplateBuilder = ({ 
  template = null, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    icon: '📋',
    fields: []
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [errors, setErrors] = useState({});

  // Initialize form when template is provided (edit mode)
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        category: template.category,
        description: template.description,
        icon: template.icon,
        fields: template.fields || []
      });
    } else {
      // New template
      setFormData({
        name: '',
        category: '',
        description: '',
        icon: '📋',
        fields: []
      });
    }
    setPreviewMode(false);
    setActiveField(null);
    setErrors({});
  }, [template, isOpen]);

  // Field type options
  const fieldTypes = [
    { id: 'text', label: 'Text', icon: <Type size={16} />, description: 'Single line text input' },
    { id: 'number', label: 'Number', icon: <Hash size={16} />, description: 'Numeric input with validation' },
    { id: 'date', label: 'Date', icon: <Calendar size={16} />, description: 'Date picker with range options' },
    { id: 'dropdown', label: 'Dropdown', icon: <List size={16} />, description: 'Select from predefined options' },
    { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={16} />, description: 'Multiple selection checklist' },
    { id: 'file', label: 'File', icon: <Paperclip size={16} />, description: 'File upload with type restrictions' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addField = (fieldType) => {
    const newField = {
      id: `field_${Date.now()}`,
      label: `New ${fieldType.label}`,
      type: fieldType.id,
      required: false,
      placeholder: '',
      options: fieldType.id === 'dropdown' || fieldType.id === 'checklist' ? ['Option 1'] : [],
      validation: {}
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setActiveField(newField.id);
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    if (activeField === fieldId) {
      setActiveField(null);
    }
  };

  const moveField = (fromIndex, toIndex) => {
    const newFields = [...formData.fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    setFormData(prev => ({ ...prev, fields: newFields }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (formData.fields.length === 0) {
      newErrors.fields = 'At least one field is required';
    }

    // Validate individual fields
    formData.fields.forEach((field, index) => {
      if (!field.label.trim()) {
        newErrors[`field_${index}`] = 'Field label is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const templateData = {
      ...formData,
      id: template?.id || `template-${Date.now()}`,
      fieldCount: formData.fields.length,
      usageCount: template?.usageCount || 0,
      lastUsed: template?.lastUsed || null
    };

    onSave?.(templateData);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-green-900">
              {template ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-gray-600 text-sm">
              {template ? 'Modify your asset template' : 'Design a new asset template with custom fields'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Preview Toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                previewMode 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye size={16} />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Field Types */}
          {!previewMode && (
            <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-green-900 mb-4">Field Types</h3>
              <div className="space-y-2">
                {fieldTypes.map(fieldType => (
                  <button
                    key={fieldType.id}
                    onClick={() => addField(fieldType)}
                    className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-green-600">
                        {fieldType.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {fieldType.label}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {fieldType.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Template Configuration */}
            <div className={`flex-1 p-6 overflow-y-auto ${previewMode ? 'w-full' : 'border-r border-gray-200'}`}>
              {previewMode ? (
                // Preview Mode
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="text-center mb-6">
                      <div className="text-4xl mb-2">{formData.icon}</div>
                      <h3 className="text-xl font-bold text-green-900">{formData.name || 'Template Preview'}</h3>
                      <p className="text-gray-600">{formData.description || 'Template description'}</p>
                    </div>

                    <div className="space-y-4">
                      {formData.fields.map(field => (
                        <div key={field.id} className="space-y-2">
                          <label className="block text-sm font-medium text-green-900">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          {field.type === 'text' && (
                            <input
                              type="text"
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                              disabled
                            />
                          )}
                          
                          {field.type === 'number' && (
                            <input
                              type="number"
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                              disabled
                            />
                          )}
                          
                          {field.type === 'date' && (
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                              disabled
                            />
                          )}
                          
                          {field.type === 'dropdown' && (
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                              disabled
                            >
                              <option value="">Select an option</option>
                              {field.options?.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                          
                          {field.type === 'checklist' && (
                            <div className="space-y-2">
                              {field.options?.map((option, index) => (
                                <label key={index} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    disabled
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          
                          {field.type === 'file' && (
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                              <Paperclip size={24} className="text-gray-400 mx-auto mb-2" />
                              <div className="text-sm text-gray-500">File upload area</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="max-w-2xl">
                  {/* Basic Info */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-green-900 mb-4">Template Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">
                          Template Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                            errors.name ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="e.g., Ambulance, Defibrillator"
                        />
                        {errors.name && (
                          <div className="text-red-500 text-xs mt-1">{errors.name}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">
                          Category *
                        </label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                            errors.category ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="e.g., Medical Vehicles"
                        />
                        {errors.category && (
                          <div className="text-red-500 text-xs mt-1">{errors.category}</div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-green-900 mb-1">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          placeholder="Describe what this template is for..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">
                          Icon
                        </label>
                        <input
                          type="text"
                          value={formData.icon}
                          onChange={(e) => handleInputChange('icon', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., 🚑, 💓"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fields Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-green-900">Template Fields</h3>
                      <div className="text-sm text-gray-500">
                        {formData.fields.length} field{formData.fields.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {errors.fields && (
                      <div className="text-red-500 text-sm mb-4">{errors.fields}</div>
                    )}

                    <div className="space-y-4">
                      {formData.fields.map((field, index) => (
                        <FieldConfigurator
                          key={field.id}
                          field={field}
                          index={index}
                          isActive={activeField === field.id}
                          onActivate={() => setActiveField(field.id)}
                          onUpdate={(updates) => updateField(field.id, updates)}
                          onRemove={() => removeField(field.id)}
                          onMoveUp={index > 0 ? () => moveField(index, index - 1) : null}
                          onMoveDown={index < formData.fields.length - 1 ? () => moveField(index, index + 1) : null}
                        />
                      ))}
                    </div>

                    {formData.fields.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Settings size={32} className="text-gray-300 mx-auto mb-2" />
                        <div className="text-gray-500">No fields added yet</div>
                        <div className="text-sm text-gray-400 mt-1">
                          Add fields from the left sidebar to get started
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Field Configuration Sidebar */}
            {!previewMode && activeField && (
              <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
                <FieldSettings
                  field={formData.fields.find(f => f.id === activeField)}
                  onUpdate={(updates) => updateField(activeField, updates)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {formData.fields.length} fields configured
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Field Configurator Component for individual fields
const FieldConfigurator = ({ 
  field, 
  index, 
  isActive, 
  onActivate, 
  onUpdate, 
  onRemove, 
  onMoveUp, 
  onMoveDown 
}) => {
  const fieldIcons = {
    text: <Type size={16} />,
    number: <Hash size={16} />,
    date: <Calendar size={16} />,
    dropdown: <List size={16} />,
    checklist: <CheckSquare size={16} />,
    file: <Paperclip size={16} />
  };

  return (
    <div
      className={`
        border rounded-lg p-4 transition-all cursor-pointer
        ${isActive 
          ? 'border-green-500 bg-green-50 shadow-sm' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
      onClick={onActivate}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div className="text-gray-400 hover:text-gray-600 cursor-grab">
          <GripVertical size={16} />
        </div>

        {/* Field Icon */}
        <div className="text-green-600">
          {fieldIcons[field.type]}
        </div>

        {/* Field Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-green-900">
              {field.label || 'Unnamed Field'}
            </div>
            {field.required && (
              <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                Required
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 capitalize">
            {field.type} • {field.placeholder ? `"${field.placeholder}"` : 'No placeholder'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
            >
              ↓
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-200"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Field Settings Component for detailed configuration
const FieldSettings = ({ field, onUpdate }) => {
  const updateFieldSetting = (key, value) => {
    onUpdate({ [key]: value });
  };

  const updateOption = (index, value) => {
    const newOptions = [...field.options];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
    onUpdate({ options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = field.options.filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-green-900">Field Settings</h3>

      {/* Basic Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-green-900 mb-1">
            Field Label *
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateFieldSetting('label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., Serial Number, Capacity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-900 mb-1">
            Placeholder Text
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => updateFieldSetting('placeholder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., Enter serial number..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            checked={field.required || false}
            onChange={(e) => updateFieldSetting('required', e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="required" className="text-sm text-green-900">
            Required field
          </label>
        </div>
      </div>

      {/* Type-specific Settings */}
      {(field.type === 'dropdown' || field.type === 'checklist') && (
        <div>
          <label className="block text-sm font-medium text-green-900 mb-2">
            Options
          </label>
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                />
                <button
                  onClick={() => removeOption(index)}
                  className="p-1 text-red-400 hover:text-red-600 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addOption}
              className="w-full text-center py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors text-sm"
            >
              <Plus size={14} className="inline mr-1" />
              Add Option
            </button>
          </div>
        </div>
      )}

      {/* Validation Settings */}
      {field.type === 'number' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-green-900">Validation</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Value</label>
              <input
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => updateFieldSetting('validation', {
                  ...field.validation,
                  min: e.target.value ? Number(e.target.value) : undefined
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max Value</label>
              <input
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => updateFieldSetting('validation', {
                  ...field.validation,
                  max: e.target.value ? Number(e.target.value) : undefined
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {field.type === 'text' && (
        <div>
          <label className="block text-sm font-medium text-green-900 mb-1">
            Maximum Length
          </label>
          <input
            type="number"
            value={field.validation?.maxLength || ''}
            onChange={(e) => updateFieldSetting('validation', {
              ...field.validation,
              maxLength: e.target.value ? Number(e.target.value) : undefined
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            placeholder="No limit"
          />
        </div>
      )}
    </div>
  );
};

export default TemplateBuilder;
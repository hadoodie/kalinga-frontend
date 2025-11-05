// Updated src/components/logistics/registry/AssetTemplates.jsx

import React, { useState, useEffect } from 'react';
import { Search, Grid, List, Plus, Filter, Download, Upload } from 'lucide-react';
import TemplateCard from './TemplateCard';
import CategorySidebar from './CategorySidebar';
import TemplateBuilder from './TemplateBuilder';

const AssetTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Template Builder State
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Load templates and categories
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const templatesData = await getTemplates();
        const categoriesData = await getCategories();
        setTemplates(templatesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'fields':
          return b.fields.length - a.fields.length;
        case 'usage':
          return b.usageCount - a.usageCount;
        default:
          return 0;
      }
    });

  // Template Actions
  const handleUseTemplate = (template) => {
    console.log('Using template:', template);
    // This will integrate with AddAssetDrawer later
    alert(`Template "${template.name}" selected! This will integrate with asset creation.`);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateBuilderOpen(true);
  };

  const handleDuplicateTemplate = (template) => {
    const duplicatedTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      lastUsed: null
    };
    setTemplates(prev => [...prev, duplicatedTemplate]);
  };

  const handleDeleteTemplate = (template) => {
    if (confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      setTemplates(prev => prev.filter(t => t.id !== template.id));
    }
  };

  const handleSaveTemplate = (templateData) => {
    if (editingTemplate) {
      // Update existing template
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id ? templateData : t
      ));
    } else {
      // Add new template
      setTemplates(prev => [...prev, templateData]);
    }
    setTemplateBuilderOpen(false);
    setEditingTemplate(null);
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateBuilderOpen(true);
  };

  const handleExportTemplates = () => {
    console.log('Exporting templates...');
    // This would generate a JSON file of templates
    alert('Template export functionality will be implemented');
  };

  const handleImportTemplates = () => {
    console.log('Importing templates...');
    // This would handle file upload and template import
    alert('Template import functionality will be implemented');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-green-800">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-900">Asset Templates</h1>
            <p className="text-gray-600 mt-1">Pre-configured asset types for quick deployment</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Import/Export Actions */}
            <div className="relative">
              <button
                onClick={() => setActionMenuOpen(actionMenuOpen === 'actions' ? null : 'actions')}
                className="bg-gray-100 hover:bg-gray-200 text-green-900 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Download size={16} />
                Actions
              </button>

              {actionMenuOpen === 'actions' && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                  <button
                    onClick={handleExportTemplates}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download size={14} />
                    Export Templates
                  </button>
                  <button
                    onClick={handleImportTemplates}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Upload size={14} />
                    Import Templates
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleCreateNewTemplate}
              className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Create New Template
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mt-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-800' : 'text-gray-500'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-green-800' : 'text-gray-500'}`}
            >
              <List size={16} />
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
            <option value="fields">Sort by Field Count</option>
            <option value="usage">Sort by Usage</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Category Sidebar */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onAddCategory={() => console.log('Add category clicked')}
          onEditCategory={(category) => console.log('Edit category:', category)}
          onDeleteCategory={(category) => console.log('Delete category:', category)}
        />

        {/* Templates Grid/List */}
        <div className="flex-1 p-6">
          {/* Summary Stats */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
            <span>{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found</span>
            {selectedCategory !== 'all' && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                {selectedCategory}
              </span>
            )}
            {searchQuery && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                Search: "{searchQuery}"
              </span>
            )}
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">No templates found</div>
              <div className="text-gray-600 mb-4">Try adjusting your search or create a new template</div>
              <button
                onClick={handleCreateNewTemplate}
                className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Your First Template
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
            }>
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  viewMode={viewMode}
                  onUseTemplate={handleUseTemplate}
                  onEditTemplate={handleEditTemplate}
                  onDuplicateTemplate={handleDuplicateTemplate}
                  onDeleteTemplate={handleDeleteTemplate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Builder Modal */}
      <TemplateBuilder
        template={editingTemplate}
        isOpen={templateBuilderOpen}
        onClose={() => {
          setTemplateBuilderOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

// Mock data and functions - will move to mockAssetService.js
const getTemplates = async () => [
  {
    id: 'template-ambulance',
    name: 'Ambulance',
    category: 'Medical Vehicles',
    description: 'Emergency medical transport vehicle with patient care equipment',
    icon: '🚑',
    fieldCount: 8,
    usageCount: 24,
    lastUsed: '2024-01-15',
    fields: [
      { 
        id: 'vin', 
        label: 'VIN Number', 
        type: 'text', 
        required: true,
        placeholder: 'Enter 17-character VIN',
        validation: { maxLength: 17 }
      },
      { 
        id: 'capacity', 
        label: 'Patient Capacity', 
        type: 'number', 
        required: true,
        validation: { min: 1, max: 20 }
      },
      { 
        id: 'equipment', 
        label: 'Medical Equipment', 
        type: 'checklist',
        options: ['Defibrillator', 'Oxygen Tank', 'Stretcher', 'First Aid Kit', 'Monitor']
      }
    ]
  },
  {
    id: 'template-defibrillator',
    name: 'Defibrillator',
    category: 'Medical Equipment',
    description: 'Portable AED device for emergency cardiac care',
    icon: '💓',
    fieldCount: 6,
    usageCount: 42,
    lastUsed: '2024-01-18',
    fields: [
      { 
        id: 'model', 
        label: 'Model Number', 
        type: 'text', 
        required: true 
      },
      { 
        id: 'battery', 
        label: 'Battery Type', 
        type: 'dropdown', 
        required: true,
        options: ['Lithium', 'NiMH', 'Lead-Acid']
      }
    ]
  },
  {
    id: 'template-stretcher',
    name: 'Medical Stretcher',
    category: 'Medical Equipment',
    description: 'Patient transport stretcher with adjustable height',
    icon: '🛏️',
    fieldCount: 5,
    usageCount: 18,
    lastUsed: '2024-01-10',
    fields: [
      { 
        id: 'weight', 
        label: 'Max Weight Capacity', 
        type: 'number', 
        required: true,
        validation: { min: 50, max: 500 }
      }
    ]
  },
  {
    id: 'template-mobile-clinic',
    name: 'Mobile Clinic',
    category: 'Medical Vehicles',
    description: 'Self-contained medical facility on wheels',
    icon: '🏥',
    fieldCount: 12,
    usageCount: 8,
    lastUsed: '2024-01-20',
    fields: [
      { 
        id: 'facilities', 
        label: 'Medical Facilities', 
        type: 'checklist', 
        required: true,
        options: ['Consultation Room', 'Procedure Room', 'Pharmacy', 'Lab']
      }
    ]
  }
];

const getCategories = async () => [
  { id: 'all', name: 'All Templates', count: 4 },
  { id: 'Medical Vehicles', name: 'Medical Vehicles', count: 2 },
  { id: 'Medical Equipment', name: 'Medical Equipment', count: 2 },
  { id: 'Communication', name: 'Communication', count: 0 },
  { id: 'Safety Equipment', name: 'Safety Equipment', count: 0 }
];

export default AssetTemplates;
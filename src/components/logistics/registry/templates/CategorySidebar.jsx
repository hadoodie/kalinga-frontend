// src/components/logistics/registry/templates/CategorySidebar.jsx

import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const CategorySidebar = ({ 
  categories = [], 
  selectedCategory, 
  onCategorySelect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory 
}) => {
  const [expandedCategories, setExpandedCategories] = useState(['Medical Vehicles', 'Medical Equipment']);
  const [editingCategory, setEditingCategory] = useState(null);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryClick = (categoryId) => {
    onCategorySelect(categoryId);
  };

  const isCategoryExpanded = (categoryId) => {
    return expandedCategories.includes(categoryId);
  };

  const getCategoryIcon = (category, isExpanded) => {
    if (category.id === 'all') {
      return '📁';
    }
    return isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
  };

  // Sample hierarchical categories - in real app this would come from API
  const hierarchicalCategories = [
    {
      id: 'all',
      name: 'All Templates',
      count: 4,
      parentId: null,
      children: []
    },
    {
      id: 'medical-vehicles',
      name: 'Medical Vehicles',
      count: 2,
      parentId: null,
      children: [
        { id: 'ambulances', name: 'Ambulances', count: 1, parentId: 'medical-vehicles' },
        { id: 'mobile-clinics', name: 'Mobile Clinics', count: 1, parentId: 'medical-vehicles' }
      ]
    },
    {
      id: 'medical-equipment',
      name: 'Medical Equipment',
      count: 2,
      parentId: null,
      children: [
        { id: 'life-support', name: 'Life Support', count: 1, parentId: 'medical-equipment' },
        { id: 'patient-transport', name: 'Patient Transport', count: 1, parentId: 'medical-equipment' }
      ]
    },
    {
      id: 'communication',
      name: 'Communication',
      count: 0,
      parentId: null,
      children: [
        { id: 'radios', name: 'Radios', count: 0, parentId: 'communication' },
        { id: 'satellite', name: 'Satellite Phones', count: 0, parentId: 'communication' }
      ]
    },
    {
      id: 'safety-equipment',
      name: 'Safety Equipment',
      count: 0,
      parentId: null,
      children: [
        { id: 'ppe', name: 'PPE', count: 0, parentId: 'safety-equipment' },
        { id: 'rescue', name: 'Rescue Gear', count: 0, parentId: 'safety-equipment' }
      ]
    }
  ];

  const renderCategoryItem = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = isCategoryExpanded(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id}>
        {/* Main Category Item */}
        <div
          className={`
            flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors group
            ${isSelected 
              ? 'bg-green-100 text-green-900 border-r-2 border-green-600' 
              : 'text-gray-700 hover:bg-gray-50'
            }
          `}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <div 
            className="flex items-center gap-2 flex-1"
            onClick={() => handleCategoryClick(category.id)}
          >
            {/* Expand/Collapse Button */}
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? 
                  <ChevronDown size={14} className="text-gray-500" /> : 
                  <ChevronRight size={14} className="text-gray-500" />
                }
              </button>
            )}
            
            {/* Spacer for items without children */}
            {!hasChildren && <div className="w-6" />}

            {/* Category Icon */}
            <span className="text-gray-500">
              {getCategoryIcon(category, isExpanded)}
            </span>

            {/* Category Name */}
            <span className="font-medium text-sm flex-1">{category.name}</span>
          </div>

          {/* Count and Actions */}
          <div className="flex items-center gap-1">
            {/* Template Count */}
            <span className={`
              text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center
              ${isSelected 
                ? 'bg-green-200 text-green-800' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {category.count}
            </span>

            {/* Actions Menu */}
            {category.id !== 'all' && (
              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(editingCategory === category.id ? null : category.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
                >
                  <MoreVertical size={14} />
                </button>

                {editingCategory === category.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategory?.(category);
                        setEditingCategory(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCategory?.(category);
                        setEditingCategory(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Child Categories */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children.map(childCategory => 
              renderCategoryItem(childCategory, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-gray-50/50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-green-900 text-sm uppercase tracking-wide">
            Categories
          </h3>
          <button
            onClick={onAddCategory}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title="Add New Category"
          >
            <Plus size={14} />
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="text-xs text-gray-500">
          {categories.reduce((total, cat) => total + cat.count, 0)} templates across {categories.length} categories
        </div>
      </div>

      {/* Categories List */}
      <div className="p-2">
        {hierarchicalCategories.map(category => 
          renderCategoryItem(category)
        )}
      </div>

      {/* Empty State */}
      {hierarchicalCategories.length === 1 && ( // Only "All Templates" exists
        <div className="p-4 text-center">
          <FolderOpen size={32} className="text-gray-300 mx-auto mb-2" />
          <div className="text-sm text-gray-500 mb-3">No categories yet</div>
          <button
            onClick={onAddCategory}
            className="text-green-800 hover:text-green-700 text-sm font-medium flex items-center gap-1 justify-center"
          >
            <Plus size={14} />
            Create First Category
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySidebar;
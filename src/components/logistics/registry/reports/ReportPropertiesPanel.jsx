// src/components/logistics/registry/ReportProperties.jsx
import React from 'react';
import { Settings, BarChart3, PieChart, Table } from 'lucide-react';

const ReportPropertiesPanel = ({ component, onUpdateConfig }) => {
  if (!component) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Properties
          </h3>
          <p className="text-gray-500 text-sm">
            Select a component to configure its properties
          </p>
        </div>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'bar-chart': return <BarChart3 className="w-5 h-5" />;
      case 'pie-chart': return <PieChart className="w-5 h-5" />;
      case 'data-table': return <Table className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        {getIcon(component.type)}
        <div>
          <h3 className="font-semibold text-gray-800">Properties</h3>
          <p className="text-sm text-gray-500 capitalize">
            {component.type.replace('-', ' ')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Title Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={component.config.title || ''}
            onChange={(e) => onUpdateConfig({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>

        {/* Metric Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Metric
          </label>
          <select
            value={component.config.metric || ''}
            onChange={(e) => onUpdateConfig({ metric: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="statusDistribution">Status Distribution</option>
            <option value="utilization">Utilization Rate</option>
            <option value="maintenanceTrends">Maintenance Trends</option>
            <option value="costAnalysis">Cost Analysis</option>
            <option value="totalAssets">Total Assets</option>
            <option value="activeAssets">Active Assets</option>
          </select>
        </div>

        {/* Height Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height (px)
          </label>
          <input
            type="number"
            value={component.config.height || 300}
            onChange={(e) => onUpdateConfig({ height: parseInt(e.target.value) })}
            min="200"
            max="800"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>

        {/* Color Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Scheme
          </label>
          <select
            value={component.config.colorScheme || 'default'}
            onChange={(e) => onUpdateConfig({ colorScheme: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="default">Default</option>
            <option value="pastel">Pastel</option>
            <option value="vibrant">Vibrant</option>
            <option value="monochrome">Monochrome</option>
          </select>
        </div>

        {/* Advanced Options */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced</h4>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={component.config.showLegend !== false}
                onChange={(e) => onUpdateConfig({ showLegend: e.target.checked })}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Legend</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={component.config.showGrid !== false}
                onChange={(e) => onUpdateConfig({ showGrid: e.target.checked })}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Grid</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={component.config.animate !== false}
                onChange={(e) => onUpdateConfig({ animate: e.target.checked })}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">Animations</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPropertiesPanel;
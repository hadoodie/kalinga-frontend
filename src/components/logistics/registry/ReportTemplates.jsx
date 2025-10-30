// src/components/logistics/registry/ReportTemplates.jsx - NEW COMPONENT
import { useState } from "react";
import { 
  FileText, 
  TrendingUp, 
  Wrench, 
  DollarSign, 
  Star, 
  Download,
  Eye
} from "lucide-react";

const ReportTemplates = ({ onTemplateSelect, onPreview }) => {
  const [favorites, setFavorites] = useState(['asset-summary', 'maintenance-overview']);
  const [activeCategory, setActiveCategory] = useState('all');

  const reportTemplates = [
    {
      id: 'asset-summary',
      name: 'Asset Summary Report',
      description: 'Comprehensive overview of all assets, status, and key metrics',
      category: 'summary',
      icon: FileText,
      popularity: 95,
      estimatedTime: '2 min',
      fields: ['asset_list', 'status_distribution', 'key_metrics']
    },
    {
      id: 'maintenance-overview',
      name: 'Maintenance Overview',
      description: 'Current maintenance status, schedules, and backlog',
      category: 'maintenance',
      icon: Wrench,
      popularity: 88,
      estimatedTime: '3 min',
      fields: ['upcoming_maintenance', 'overdue_tasks', 'maintenance_costs']
    },
    {
      id: 'utilization-analysis',
      name: 'Utilization Analysis',
      description: 'Asset usage patterns and performance metrics',
      category: 'performance',
      icon: TrendingUp,
      popularity: 76,
      estimatedTime: '4 min',
      fields: ['utilization_rates', 'performance_trends', 'efficiency_metrics']
    },
    {
      id: 'cost-breakdown',
      name: 'Cost Breakdown',
      description: 'Detailed analysis of maintenance and operational costs',
      category: 'financial',
      icon: DollarSign,
      popularity: 82,
      estimatedTime: '5 min',
      fields: ['maintenance_costs', 'operational_costs', 'cost_savings']
    },
    {
      id: 'asset-health',
      name: 'Asset Health Scorecard',
      description: 'Condition assessment and maintenance readiness',
      category: 'performance',
      popularity: 71,
      estimatedTime: '3 min',
      fields: ['condition_scores', 'maintenance_readiness', 'replacement_metrics']
    },
    {
      id: 'compliance-report',
      name: 'Compliance Report',
      description: 'Regulatory compliance and audit readiness',
      category: 'summary',
      popularity: 63,
      estimatedTime: '4 min',
      fields: ['compliance_status', 'audit_trail', 'certification_dates']
    }
  ];

  const categories = [
    { id: 'all', label: 'All Reports', count: reportTemplates.length },
    { id: 'summary', label: 'Summary', count: reportTemplates.filter(t => t.category === 'summary').length },
    { id: 'maintenance', label: 'Maintenance', count: reportTemplates.filter(t => t.category === 'maintenance').length },
    { id: 'performance', label: 'Performance', count: reportTemplates.filter(t => t.category === 'performance').length },
    { id: 'financial', label: 'Financial', count: reportTemplates.filter(t => t.category === 'financial').length }
  ];

  const filteredTemplates = activeCategory === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(template => template.category === activeCategory);

  const toggleFavorite = (templateId, e) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'summary': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'financial': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'summary': return FileText;
      case 'maintenance': return Wrench;
      case 'performance': return TrendingUp;
      case 'financial': return DollarSign;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Report Templates</h3>
          <p className="text-gray-600 text-sm mt-1">
            Pre-built reports for quick insights • {reportTemplates.length} templates available
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>{favorites.length} favorites</span>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeCategory === category.id
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {category.label}
            <span className="ml-1 text-xs opacity-75">({category.count})</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => {
          const IconComponent = template.icon || getCategoryIcon(template.category);
          const isFavorite = favorites.includes(template.id);
          
          return (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group"
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                      {template.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        {template.popularity}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.estimatedTime}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => toggleFavorite(template.id, e)}
                  className="p-1 hover:bg-gray-100 rounded transition opacity-0 group-hover:opacity-100"
                >
                  <Star 
                    className={`h-4 w-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} 
                  />
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Fields */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-700 mb-2">Includes:</div>
                <div className="flex flex-wrap gap-1">
                  {template.fields.slice(0, 3).map((field, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {field.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {template.fields.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{template.fields.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onPreview(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button
                  onClick={() => onTemplateSelect(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-800 bg-yellow-500 rounded-lg hover:bg-yellow-600 transition font-medium"
                >
                  <Download className="h-4 w-4" />
                  Generate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No templates found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default ReportTemplates;
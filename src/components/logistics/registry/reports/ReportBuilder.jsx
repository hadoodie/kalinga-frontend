// src/components/logistics/registry/ReportBuilder.jsx
import React, { useState, useCallback, useRef } from 'react';
import { 
  Save, 
  Download, 
  Layout, 
  Sliders, 
  Eye,
  Plus,
  Trash2,
  Copy
} from 'lucide-react';
import ReportCanvas from './ReportCanvas';
import ComponentPalette from './ComponentPalette';
import ReportPropertiesPanel from './ReportPropertiesPanel';
import SavedReportsManager from './SavedReportsManager';
import { mockAssetService } from '../../../../services/mockAssetService';

const ReportBuilder = () => {
  const [reportComponents, setReportComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [reportTitle, setReportTitle] = useState('Custom Report');
  const [reportDescription, setReportDescription] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showSavedReports, setShowSavedReports] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const nextId = useRef(1);

  // Available chart types
  const chartTypes = [
    {
      id: 'bar-chart',
      name: 'Bar Chart',
      icon: '📊',
      defaultConfig: {
        title: 'Asset Status Distribution',
        metric: 'statusDistribution',
        height: 300
      }
    },
    {
      id: 'line-chart',
      name: 'Line Chart',
      icon: '📈',
      defaultConfig: {
        title: 'Maintenance Trends',
        metric: 'maintenanceTrends',
        height: 300
      }
    },
    {
      id: 'pie-chart',
      name: 'Pie Chart',
      icon: '🥧',
      defaultConfig: {
        title: 'Utilization Rate',
        metric: 'utilization',
        height: 250
      }
    },
    {
      id: 'metric-card',
      name: 'Metric Card',
      icon: '🔢',
      defaultConfig: {
        title: 'Key Metric',
        metric: 'totalAssets',
        size: 'medium'
      }
    },
    {
      id: 'data-table',
      name: 'Data Table',
      icon: '📋',
      defaultConfig: {
        title: 'Asset Data',
        columns: ['name', 'status', 'location'],
        pageSize: 5
      }
    }
  ];

  // Add component to canvas
  const addComponent = useCallback((chartType) => {
    const newComponent = {
      id: `comp-${nextId.current++}`,
      type: chartType.id,
      config: {
        ...chartType.defaultConfig,
        title: `${chartType.name} ${nextId.current}`
      },
      position: { x: 0, y: reportComponents.length * 350 },
      size: { width: 400, height: chartType.defaultConfig.height || 300 }
    };
    
    setReportComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent.id);
  }, [reportComponents.length]);

  // Update component configuration
  const updateComponentConfig = useCallback((componentId, newConfig) => {
    setReportComponents(prev => 
      prev.map(comp => 
        comp.id === componentId 
          ? { ...comp, config: { ...comp.config, ...newConfig } }
          : comp
      )
    );
  }, []);

  // Remove component
  const removeComponent = useCallback((componentId) => {
    setReportComponents(prev => prev.filter(comp => comp.id !== componentId));
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  // Duplicate component
  const duplicateComponent = useCallback((componentId) => {
    const original = reportComponents.find(comp => comp.id === componentId);
    if (original) {
      const duplicated = {
        ...original,
        id: `comp-${nextId.current++}`,
        position: {
          ...original.position,
          y: original.position.y + 50
        }
      };
      setReportComponents(prev => [...prev, duplicated]);
      setSelectedComponent(duplicated.id);
    }
  }, [reportComponents]);

  // Save report
  const saveReport = useCallback(async () => {
    const reportData = {
      id: `report-${Date.now()}`,
      title: reportTitle,
      description: reportDescription,
      components: reportComponents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Save to mock service (replace with actual API call)
      await mockAssetService.saveReport(reportData);
      setSavedReports(prev => [...prev, reportData]);
      
      // Show success message (you can replace with toast notification)
      alert('Report saved successfully!');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    }
  }, [reportTitle, reportDescription, reportComponents]);

  // Load report
  const loadReport = useCallback((report) => {
    setReportTitle(report.title);
    setReportDescription(report.description);
    setReportComponents(report.components);
    setSelectedComponent(null);
    setShowSavedReports(false);
  }, []);

  // Export report
  const exportReport = useCallback(async () => {
    const reportData = {
      title: reportTitle,
      components: reportComponents,
      exportedAt: new Date().toISOString()
    };

    try {
      await mockAssetService.exportReport(reportData);
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report. Please try again.');
    }
  }, [reportTitle, reportComponents]);

  const selectedComponentData = reportComponents.find(comp => comp.id === selectedComponent);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-green-800 mb-2">Report Builder</h1>
            <p className="text-gray-600">Create custom reports with drag-and-drop components</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                isPreviewMode 
                  ? 'bg-yellow-500 text-white border-yellow-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
            
            <button
              onClick={() => setShowSavedReports(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Layout className="w-4 h-4" />
              Saved Reports
            </button>
            
            <button
              onClick={saveReport}
              disabled={reportComponents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Report
            </button>
            
            <button
              onClick={exportReport}
              disabled={reportComponents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Report Metadata */}
        {!isPreviewMode && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter report title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter report description..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Builder Interface */}
      {!isPreviewMode ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Component Palette */}
          <div className="xl:col-span-2">
            <ComponentPalette 
              chartTypes={chartTypes}
              onAddComponent={addComponent}
            />
          </div>

          {/* Report Canvas */}
          <div className="xl:col-span-7">
            <ReportCanvas
              components={reportComponents}
              selectedComponent={selectedComponent}
              onSelectComponent={setSelectedComponent}
              onUpdateComponent={updateComponentConfig}
              onRemoveComponent={removeComponent}
              onDuplicateComponent={duplicateComponent}
              isPreviewMode={isPreviewMode}
            />
          </div>

          {/* Properties Panel */}
          <div className="xl:col-span-3">
            <ReportPropertiesPanel
              component={selectedComponentData}
              onUpdateConfig={(newConfig) => updateComponentConfig(selectedComponent, newConfig)}
            />
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{reportTitle}</h2>
            {reportDescription && (
              <p className="text-gray-600 text-lg">{reportDescription}</p>
            )}
            <div className="w-32 h-1 bg-yellow-500 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <ReportCanvas
            components={reportComponents}
            selectedComponent={null}
            onSelectComponent={() => {}}
            onUpdateComponent={() => {}}
            onRemoveComponent={() => {}}
            onDuplicateComponent={() => {}}
            isPreviewMode={true}
          />
        </div>
      )}

      {/* Saved Reports Modal */}
      {showSavedReports && (
        <SavedReportsManager
          savedReports={savedReports}
          onLoadReport={loadReport}
          onClose={() => setShowSavedReports(false)}
        />
      )}
    </div>
  );
};

export default ReportBuilder;
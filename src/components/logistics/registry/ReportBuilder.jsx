// src/components/logistics/registry/ReportBuilder.jsx - FULLY FIXED INPUT + CLICK-OUTSIDE
import { useState, useRef, useEffect } from "react";
import { 
  Plus, Trash2, Layout, BarChart3, LineChart, PieChart, 
  Save, Eye, GripVertical, X, Download, ChevronLeft
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const ReportBuilder = ({ onSave, onClose, onExport }) => {
  const [reportConfig, setReportConfig] = useState({
    name: "",
    description: "",
    layout: "single", // "single" or "dashboard"
    charts: []
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [mobileView, setMobileView] = useState("config"); // "config" | "metrics" | "preview"
  const dragItem = useRef();
  const dragOverItem = useRef();
  const modalRef = useRef();

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Close when clicking outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Available metrics for selection
  const availableMetrics = [
    { id: "asset-status", name: "Asset Status", type: "pie", category: "summary" },
    { id: "utilization-rates", name: "Utilization Rates", type: "bar", category: "performance" },
    { id: "maintenance-costs", name: "Maintenance Costs", type: "bar", category: "financial" },
    { id: "asset-types", name: "Asset Types", type: "bar", category: "summary" },
    { id: "maintenance-backlog", name: "Maintenance Backlog", type: "line", category: "maintenance" },
    { id: "uptime-trends", name: "Uptime Trends", type: "line", category: "performance" },
    { id: "cost-breakdown", name: "Cost Breakdown", type: "pie", category: "financial" },
    { id: "location-distribution", name: "Location Distribution", type: "pie", category: "summary" }
  ];

  // Mock data for preview
  const mockChartData = {
    "asset-status": [
      { name: "Active", value: 45, color: "#10B981" },
      { name: "Under Repair", value: 8, color: "#EF4444" },
      { name: "Standby", value: 7, color: "#F59E0B" }
    ],
    "utilization-rates": [
      { name: "Ambulances", value: 85 },
      { name: "Fire Trucks", value: 92 },
      { name: "Generators", value: 45 },
      { name: "Rescue Boats", value: 60 }
    ],
    "maintenance-costs": [
      { name: "Medical Vehicles", value: 12500 },
      { name: "Emergency Vehicles", value: 18700 },
      { name: "Power Equipment", value: 8300 },
      { name: "Watercraft", value: 11200 }
    ],
    "asset-types": [
      { name: "Medical Vehicles", value: 12 },
      { name: "Emergency Vehicles", value: 8 },
      { name: "Power Equipment", value: 15 },
      { name: "Watercraft", value: 5 }
    ],
    "maintenance-backlog": [
      { name: "Jan", value: 5 },
      { name: "Feb", value: 8 },
      { name: "Mar", value: 3 },
      { name: "Apr", value: 6 }
    ],
    "uptime-trends": [
      { name: "Jan", value: 92 },
      { name: "Feb", value: 88 },
      { name: "Mar", value: 95 },
      { name: "Apr", value: 91 }
    ],
    "cost-breakdown": [
      { name: "Preventive", value: 12500, color: "#10B981" },
      { name: "Corrective", value: 8300, color: "#F59E0B" },
      { name: "Emergency", value: 4500, color: "#EF4444" }
    ],
    "location-distribution": [
      { name: "Central Hospital", value: 25, color: "#3B82F6" },
      { name: "North Station", value: 18, color: "#10B981" },
      { name: "Coastal Base", value: 12, color: "#F59E0B" },
      { name: "HQ Operations", value: 8, color: "#8B5CF6" }
    ]
  };

  const chartTypes = [
    { id: "bar", name: "Bar Chart", icon: BarChart3, description: "Compare values across categories" },
    { id: "line", name: "Line Chart", icon: LineChart, description: "Show trends over time" },
    { id: "pie", name: "Pie Chart", icon: PieChart, description: "Show parts of a whole" }
  ];

  const layoutOptions = [
    { id: "single", name: "Single Chart", description: "One large chart focus" },
    { id: "dashboard", name: "Dashboard", description: "Multiple charts grid" }
  ];

  const handleInputChange = (field, value) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addChart = (metricId) => {
    const metric = availableMetrics.find(m => m.id === metricId);
    if (!metric) return;

    const newChart = {
      id: `chart-${Date.now()}`,
      metricId: metric.id,
      name: metric.name,
      type: metric.type,
      position: reportConfig.charts.length,
      size: reportConfig.layout === "single" ? "large" : "medium"
    };

    setReportConfig(prev => ({
      ...prev,
      charts: [...prev.charts, newChart]
    }));
    
    if (window.innerWidth < 768) {
      setMobileView("config");
    }
  };

  const removeChart = (chartId) => {
    setReportConfig(prev => ({
      ...prev,
      charts: prev.charts.filter(chart => chart.id !== chartId)
    }));
  };

  const updateChartType = (chartId, newType) => {
    setReportConfig(prev => ({
      ...prev,
      charts: prev.charts.map(chart => 
        chart.id === chartId ? { ...chart, type: newType } : chart
      )
    }));
  };

  const updateChartSize = (chartId, newSize) => {
    setReportConfig(prev => ({
      ...prev,
      charts: prev.charts.map(chart => 
        chart.id === chartId ? { ...chart, size: newSize } : chart
      )
    }));
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== dragOverItem.current) {
      const charts = [...reportConfig.charts];
      const draggedItem = charts[dragItem.current];
      charts.splice(dragItem.current, 1);
      charts.splice(dragOverItem.current, 0, draggedItem);
      
      setReportConfig(prev => ({
        ...prev,
        charts: charts.map((chart, index) => ({ ...chart, position: index }))
      }));
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSave = async () => {
    if (!reportConfig.name.trim()) {
      alert("Please enter a report name");
      return;
    }

    if (reportConfig.charts.length === 0) {
      alert("Please add at least one chart to your report");
      return;
    }

    setSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const savedReport = {
        ...reportConfig,
        id: `custom-${Date.now()}`,
        name: reportConfig.name || "Custom Report",
        description: reportConfig.description || "Custom built report",
        isCustom: true,
        createdAt: new Date().toISOString(),
        category: "custom",
        icon: BarChart3,
        popularity: 0,
        estimatedTime: '2 min',
        fields: reportConfig.charts.map(chart => chart.metricId)
      };
      
      onSave(savedReport);
      onExport(savedReport);
      
    } catch (error) {
      console.error('Error saving report:', error);
      alert("Error saving report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderChartPreview = (chart) => {
    const data = mockChartData[chart.metricId] || mockChartData["asset-status"];
    
    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10B981" />
            </ReLineChart>
          </ResponsiveContainer>
        );
      
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "#3B82F6"} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div className="text-gray-500 text-sm">Select a chart type</div>;
    }
  };

  const getGridClass = () => {
    if (reportConfig.layout === "single") {
      return "grid-cols-1";
    }
    
    const chartCount = reportConfig.charts.length;
    if (chartCount <= 2) return "grid-cols-1 md:grid-cols-2";
    if (chartCount <= 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  };

  const MobileNav = () => (
    <div className="md:hidden flex items-center gap-4 p-4 border-b border-gray-200 bg-white">
      {mobileView !== "config" && (
        <button
          onClick={() => setMobileView("config")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 text-center font-medium text-gray-900">
        {mobileView === "config" && "Build Report"}
        {mobileView === "metrics" && "Add Charts"}
        {mobileView === "preview" && "Preview"}
      </div>
    </div>
  );

  const MetricsSidebar = () => (
    <div className={`${mobileView === "metrics" ? 'block' : 'hidden'} md:block w-full md:w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto`}>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Add Charts</h3>
        <div className="space-y-2">
          {availableMetrics.map(metric => (
            <button
              key={metric.id}
              onClick={() => addChart(metric.id)}
              disabled={reportConfig.charts.some(chart => chart.metricId === metric.id)}
              className="w-full text-left p-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              <div className="font-medium text-gray-900">{metric.name}</div>
              <div className="text-gray-500 text-xs mt-1">{metric.category}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const ConfigurationPanel = () => (
    <div className={`${mobileView === "config" ? 'block' : 'hidden'} md:block w-full md:w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto`}>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Report Configuration</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Name *
            </label>
            <input
              type="text"
              value={reportConfig.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter report name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={reportConfig.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe this report"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              {layoutOptions.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => handleInputChange('layout', layout.id)}
                  className={`p-3 border rounded-lg text-left transition ${
                    reportConfig.layout === layout.id
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Layout className="h-5 w-5 mb-1 text-gray-600" />
                  <div className="font-medium text-sm">{layout.name}</div>
                  <div className="text-xs text-gray-500">{layout.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setMobileView("metrics")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Charts
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Blurred background */}
      <div
        className="fixed inset-0 -bottom-5 z-40 transition-opacity duration-300 opacity-100 pointer-events-none"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      />

      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
        <div 
          ref={modalRef}
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl mt-10 mb-10 border border-gray-200 transform transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Build Custom Report</h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 hidden sm:block">
                  Create your own report with custom charts and layout
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">{previewMode ? "Edit" : "Preview"}</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <MobileNav />

            <div className="flex-1 flex overflow-hidden">
              {!previewMode && (
                <>
                  <ConfigurationPanel />
                  <MetricsSidebar />
                </>
              )}

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 sm:p-6">
                    {previewMode ? (
                      <div className={`grid ${getGridClass()} gap-4 sm:gap-6 pb-4`}>
                        {reportConfig.charts.map(chart => (
                          <div 
                            key={chart.id}
                            className={`bg-white border border-gray-200 rounded-lg p-3 sm:p-4 ${
                              chart.size === 'large' ? 'md:col-span-2' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{chart.name}</h4>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                {chart.type} chart
                              </div>
                            </div>
                            <div className="h-48 sm:h-64">
                              {renderChartPreview(chart)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Report Charts ({reportConfig.charts.length})
                          </h3>
                          {reportConfig.charts.length > 0 && (
                            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                              Drag to reorder • Click to configure
                            </div>
                          )}
                        </div>

                        {reportConfig.charts.length === 0 ? (
                          <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-lg">
                            <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-500 text-sm sm:text-base mb-3 sm:mb-4">No charts added yet</p>
                            <button
                              onClick={() => setMobileView("metrics")}
                              className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                            >
                              <Plus className="h-4 w-4" />
                              Add Your First Chart
                            </button>
                            <p className="text-gray-400 text-xs sm:text-sm hidden md:block">
                              Select metrics from the sidebar to start building your report
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 sm:space-y-4">
                            {reportConfig.charts.map((chart, index) => (
                              <div
                                key={chart.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all group"
                              >
                                <div className="flex items-start gap-3 sm:gap-4">
                                  <div className="pt-1 cursor-move opacity-0 group-hover:opacity-100 transition">
                                    <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{chart.name}</h4>
                                      <button
                                        onClick={() => removeChart(chart.id)}
                                        className="p-1 hover:bg-red-100 rounded transition text-red-600 flex-shrink-0 ml-2"
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                                      <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                          Chart Type
                                        </label>
                                        <div className="flex flex-wrap gap-1 sm:gap-2">
                                          {chartTypes.map(type => (
                                            <button
                                              key={type.id}
                                              onClick={() => updateChartType(chart.id, type.id)}
                                              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border text-xs sm:text-sm transition ${
                                                chart.type === type.id
                                                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                              }`}
                                            >
                                              <type.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                                              <span className="hidden xs:inline">{type.name}</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {reportConfig.layout === "dashboard" && (
                                        <div>
                                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                            Chart Size
                                          </label>
                                          <select
                                            value={chart.size}
                                            onChange={(e) => updateChartSize(chart.id, e.target.value)}
                                            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-xs sm:text-sm"
                                          >
                                            <option value="medium">Medium</option>
                                            <option value="large">Large</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-3 sm:mt-4 border border-gray-200 rounded-lg p-2 sm:p-3">
                                      <div className="h-24 sm:h-32">
                                        {renderChartPreview(chart)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
                <div className="text-xs sm:text-sm text-gray-600">
                  {reportConfig.charts.length} charts • {reportConfig.layout} layout
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !reportConfig.name.trim() || reportConfig.charts.length === 0}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-xs sm:text-sm"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-gray-800"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Save Template</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportBuilder;
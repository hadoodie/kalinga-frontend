// src/components/logistics/registry/ReportsTab.jsx
import { useState, useEffect } from "react";
import { 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Layout, 
  Clock 
} from "lucide-react";
import UtilizationCharts from "../analytics/UtilizationCharts";
import AnalyticsDashboard from "../analytics/AnalyticsDashboard";
import ExportReportsDrawer from "./ExportReportsDrawer";
import DateRangePicker from "../maintenance/DateRangePicker";
import ReportTemplates from "./ReportTemplates";
import ReportBuilder from "./ReportBuilder";
import ScheduledReports from "./ScheduledReports";
import { mockAssetService } from "../../../../services/mockAssetService";

export default function ReportsTab({ loading }) {
  const [dateRange, setDateRange] = useState("month");
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeView, setActiveView] = useState("analytics"); // 'analytics' | 'templates' | 'builder' | 'scheduled'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [schedulePrefill, setSchedulePrefill] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    statusDistribution: [],
    utilizationRates: [],
    maintenanceCosts: [],
    assetMetrics: {}
  });
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, customRange]);

  const fetchAnalyticsData = async () => {
    try {
      const data = await mockAssetService.getAnalyticsData(dateRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setIsExportDrawerOpen(true);
  };

  const handleTemplatePreview = (template) => {
    console.log("Preview template:", template);
  };

  const handleScheduleTemplate = (template) => {
    setSchedulePrefill(template);
    setActiveView("scheduled");
  };

  const handleRangeSelect = (range) => {
    setCustomRange(range);
    setDateRange("custom");
  };

  const getDisplayRange = () => {
    if (dateRange === "custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
      const end = new Date(customRange.end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      return `${start} - ${end}`;
    }
    return dateRanges.find((r) => r.value === dateRange)?.label || "Select range";
  };

  const dateRanges = [
    { value: "week", label: "Last 7 days" },
    { value: "month", label: "Last 30 days" },
    { value: "quarter", label: "Last 90 days" },
    { value: "year", label: "Last 12 months" },
    { value: "custom", label: "Custom range" }
  ];

  const handleExport = async (exportConfig) => {
    try {
      const exportData = selectedTemplate
        ? { ...exportConfig, template: selectedTemplate }
        : exportConfig;

      await mockAssetService.generateReport(exportData);
      console.log("Export completed:", exportData);
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // View configuration for consistent styling
  const viewConfig = {
    analytics: {
      label: "Analytics Dashboard",
      description: "Asset performance and utilization insights",
      showDatePicker: true,
      showExport: true
    },
    templates: {
      label: "Report Templates", 
      description: "Pre-built report templates",
      showDatePicker: false,
      showExport: true
    },
    builder: {
      label: "Report Builder",
      description: "Create custom reports with drag-and-drop components",
      showDatePicker: false,
      showExport: false
    },
    scheduled: {
      label: "Scheduled Reports",
      description: "Automated report delivery via email",
      showDatePicker: false,
      showExport: false
    }
  };

  const currentView = viewConfig[activeView];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 bg-white p-3 sm:p-4 ">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-green-900">{currentView.label}</h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            {currentView.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* View Toggle Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveView("analytics")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition text-sm w-full sm:w-auto ${
                activeView === "analytics"
                  ? "bg-yellow-500 text-gray-800 hover:bg-yellow-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveView("templates")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition text-sm w-full sm:w-auto ${
                activeView === "templates"
                  ? "bg-yellow-500 text-gray-800 hover:bg-yellow-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => setActiveView("builder")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition text-sm w-full sm:w-auto ${
                activeView === "builder"
                  ? "bg-yellow-500 text-gray-800 hover:bg-yellow-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Layout className="h-4 w-4" />
              <span>Builder</span>
            </button>

            <button
              onClick={() => {
                setActiveView("scheduled");
                setSchedulePrefill(null);
              }}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition text-sm w-full sm:w-auto ${
                activeView === "scheduled"
                  ? "bg-yellow-500 text-gray-800 hover:bg-yellow-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Scheduled</span>
            </button>
          </div>

          {/* Date Range Picker - Only show for analytics view */}
          {currentView.showDatePicker && (
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center gap-2 w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm text-gray-700"
              >
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="flex-1 text-left">{getDisplayRange()}</span>
              </button>

              {showDatePicker && (
                <DateRangePicker
                  selectedRange={customRange}
                  onRangeSelect={handleRangeSelect}
                  onClose={() => setShowDatePicker(false)}
                  position="right"
                />
              )}
            </div>
          )}

          {/* Export Button - Hide for builder and scheduled views */}
          {currentView.showExport && (
            <button
              onClick={() => setIsExportDrawerOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-gray-800 rounded-lg font-semibold hover:bg-yellow-600 transition text-sm w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Conditional Views */}
      {activeView === "templates" ? (
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <ReportTemplates
            onTemplateSelect={handleTemplateSelect}
            onPreview={handleTemplatePreview}
            onSchedule={handleScheduleTemplate}
          />
        </div>
      ) : activeView === "builder" ? (
        <ReportBuilder />
      ) : activeView === "scheduled" ? (
        <ScheduledReports prefillTemplate={schedulePrefill} />
      ) : (
        <>
          {/* Analytics Dashboard View */}
            <AnalyticsDashboard metrics={analyticsData.assetMetrics} loading={loading} />

            <UtilizationCharts
              statusDistribution={analyticsData.statusDistribution}
              utilizationRates={analyticsData.utilizationRates}
              maintenanceCosts={analyticsData.maintenanceCosts}
              loading={loading}
            />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="font-semibold text-blue-900 text-sm">Data Coverage</div>
              <div className="text-blue-700 text-sm">100% of assets included</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="font-semibold text-green-900 text-sm">Last Updated</div>
              <div className="text-green-700 text-sm">Just now</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
              <div className="font-semibold text-purple-900 text-sm">Report Period</div>
              <div className="text-purple-700 text-sm">{getDisplayRange()}</div>
            </div>
          </div>

          {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="text-center p-3 border border-gray-200 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900 text-sm">Asset Types</div>
                <div className="text-lg font-bold text-gray-700">12</div>
              </div>
              <div className="text-center p-3 border border-gray-200 rounded-lg">
                <PieChart className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900 text-sm">Active Assets</div>
                <div className="text-lg font-bold text-gray-700">85%</div>
              </div>
              <div className="text-center p-3 border border-gray-200 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900 text-sm">Utilization</div>
                <div className="text-lg font-bold text-gray-700">78%</div>
              </div>
              <div className="text-center p-3 border border-gray-200 rounded-lg">
                <Download className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="font-semibold text-gray-900 text-sm">Reports</div>
                <div className="text-lg font-bold text-gray-700">24</div>
              </div>
            </div>
        </>
      )}

      {/* Export Drawer */}
      <ExportReportsDrawer
        isOpen={isExportDrawerOpen}
        onClose={() => {
          setIsExportDrawerOpen(false);
          setSelectedTemplate(null);
        }}
        onExport={handleExport}
        selectedTemplate={selectedTemplate}
      />
    </div>
  );
}
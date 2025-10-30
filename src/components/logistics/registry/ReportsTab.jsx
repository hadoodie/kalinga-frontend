// src/components/logistics/registry/ReportsTab.jsx
import { useState, useEffect } from "react";
import { Download, BarChart3, PieChart, TrendingUp, Calendar, FileText, Plus } from "lucide-react";
import UtilizationCharts from "./UtilizationCharts";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ExportReportsDrawer from "./ExportReportsDrawer";
import DateRangePicker from "./DateRangePicker";
import ReportTemplates from "./ReportTemplates";
import ReportBuilder from "./ReportBuilder";
import { mockAssetService } from "../../../services/mockAssetService";

export default function ReportsTab({ loading }) {
  const [dateRange, setDateRange] = useState("month");
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    statusDistribution: [],
    utilizationRates: [],
    maintenanceCosts: [],
    assetMetrics: {}
  });
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState(false);

  // 👇 Added custom report builder states here
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [customReports, setCustomReports] = useState([]);

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

  const handleSaveCustomReport = (reportConfig) => {
    setCustomReports((prev) => [...prev, reportConfig]);
    console.log("Saved custom report:", reportConfig);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setIsExportDrawerOpen(true);
  };

  const handleTemplatePreview = (template) => {
    console.log("Preview template:", template);
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            {showTemplates
              ? "Pre-built report templates"
              : "Asset performance and utilization insights"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Build Report Button */}
          <button
            onClick={() => setShowReportBuilder(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition text-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Build Report</span>
          </button>

          {/* Templates Button */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition text-sm w-full sm:w-auto ${
              showTemplates
                ? "bg-gray-500 text-white hover:bg-gray-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{showTemplates ? "Back to Analytics" : "Templates"}</span>
          </button>

          {/* Date Range Picker */}
          {!showTemplates && (
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

          {/* Export Button */}
          <button
            onClick={() => setIsExportDrawerOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-gray-800 rounded-lg font-semibold hover:bg-yellow-600 transition text-sm w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Conditional Views */}
      {showTemplates ? (
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <ReportTemplates
            onTemplateSelect={handleTemplateSelect}
            onPreview={handleTemplatePreview}
          />
        </div>
      ) : (
        <>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <AnalyticsDashboard metrics={analyticsData.assetMetrics} loading={loading} />
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            <UtilizationCharts
              statusDistribution={analyticsData.statusDistribution}
              utilizationRates={analyticsData.utilizationRates}
              maintenanceCosts={analyticsData.maintenanceCosts}
              loading={loading}
            />
          </div>

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
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
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
          </div>
        </>
      )}

      {/* Report Builder Modal */}
      {showReportBuilder && (
        <ReportBuilder
          onSave={handleSaveCustomReport}
          onClose={() => setShowReportBuilder(false)}
          onExport={(report) => {
            setShowReportBuilder(false);
            setIsExportDrawerOpen(true);
            setSelectedTemplate(report);
          }}
        />
      )}

      {/* Export Drawer */}
      <ExportReportsDrawer
        isOpen={isExportDrawerOpen}
        onClose={() => setIsExportDrawerOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}

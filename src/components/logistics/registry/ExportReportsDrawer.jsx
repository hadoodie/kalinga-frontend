// src/components/logistics/registry/ExportReportsDrawer.jsx - CRITICAL
import { useState } from "react";
import { X, Download, FileText, Table, Mail, Calendar } from "lucide-react";

export default function ExportReportsDrawer({ isOpen, onClose, onExport }) {
  const [exportConfig, setExportConfig] = useState({
    format: "pdf",
    reportType: "asset-summary",
    dateRange: "month",
    includeCharts: true,
    emailDelivery: false,
    emailAddress: ""
  });
  const [exporting, setExporting] = useState(false);

  const reportTypes = [
    { id: "asset-summary", name: "Asset Summary", description: "Overview of all assets and status" },
    { id: "maintenance-report", name: "Maintenance Report", description: "Maintenance history and schedules" },
    { id: "utilization-report", name: "Utilization Report", description: "Asset usage and performance metrics" },
    { id: "cost-analysis", name: "Cost Analysis", description: "Maintenance and operational costs" }
  ];

  const dateRanges = [
    { value: "week", label: "Last 7 days" },
    { value: "month", label: "Last 30 days" },
    { value: "quarter", label: "Last 90 days" },
    { value: "year", label: "Last 12 months" },
    { value: "custom", label: "Custom range" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call export handler
      onExport(exportConfig);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleChange = (field, value) => {
    setExportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Full-screen blurred background */}
      <div
        className="fixed inset-0 -bottom-10 z-40 transition-opacity duration-300 opacity-100"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        onClick={onClose}
      />
      
      {/* Centered Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 opacity-100">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scroll-smooth transform transition-all duration-300 border border-gray-200 scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <Download className="h-6 w-6 text-yellow-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">
                  Export Reports
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Report Type *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {reportTypes.map((report) => (
                      <label key={report.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="reportType"
                          value={report.id}
                          checked={exportConfig.reportType === report.id}
                          onChange={(e) => handleChange('reportType', e.target.value)}
                          className="mt-1 text-yellow-500 focus:ring-yellow-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {report.name}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {report.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Export Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Export Format *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={exportConfig.format === "pdf"}
                        onChange={(e) => handleChange('format', e.target.value)}
                        className="text-yellow-500 focus:ring-yellow-500"
                      />
                      <FileText className="h-6 w-6 text-red-500 mt-2" />
                      <span className="text-sm font-medium text-gray-900 mt-2">PDF</span>
                      <span className="text-xs text-gray-500">Best for printing</span>
                    </label>
                    
                    <label className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={exportConfig.format === "csv"}
                        onChange={(e) => handleChange('format', e.target.value)}
                        className="text-yellow-500 focus:ring-yellow-500"
                      />
                      <Table className="h-6 w-6 text-green-500 mt-2" />
                      <span className="text-sm font-medium text-gray-900 mt-2">CSV</span>
                      <span className="text-xs text-gray-500">Data analysis</span>
                    </label>
                    
                    <label className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="excel"
                        checked={exportConfig.format === "excel"}
                        onChange={(e) => handleChange('format', e.target.value)}
                        className="text-yellow-500 focus:ring-yellow-500"
                      />
                      <Table className="h-6 w-6 text-green-600 mt-2" />
                      <span className="text-sm font-medium text-gray-900 mt-2">Excel</span>
                      <span className="text-xs text-gray-500">Advanced analysis</span>
                    </label>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range *
                  </label>
                  <select
                    value={exportConfig.dateRange}
                    onChange={(e) => handleChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  >
                    {dateRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeCharts}
                      onChange={(e) => handleChange('includeCharts', e.target.checked)}
                      className="rounded text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-sm text-gray-700">Include charts and visualizations</span>
                  </label>

                  <div className="border-t pt-4">
                    <label className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        checked={exportConfig.emailDelivery}
                        onChange={(e) => handleChange('emailDelivery', e.target.checked)}
                        className="rounded text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="text-sm text-gray-700">Email report when ready</span>
                    </label>
                    
                    {exportConfig.emailDelivery && (
                      <div className="ml-7">
                        <input
                          type="email"
                          value={exportConfig.emailAddress}
                          onChange={(e) => handleChange('emailAddress', e.target.value)}
                          placeholder="Enter email address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                  disabled={exporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg hover:bg-yellow-600 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export Report
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
}
// src/components/logistics/registry/ChartModal.jsx - ENHANCED FOR RECHARTS
import { X, Download, Maximize2, Image, Code } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Recharts color scheme matching your design
const COLORS = {
  active: '#10B981',
  underRepair: '#EF4444', 
  standby: '#F59E0B',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  purple: '#8B5CF6'
};

export default function ChartModal({ 
  isOpen, 
  onClose, 
  chartData, 
  chartType, 
  title 
}) {
  if (!isOpen) return null;

  const renderFullScreenChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Maximize2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p>No chart data available</p>
        </div>
      );
    }

    switch (chartType) {
      case "status-distribution":
        const pieData = chartData.map(item => ({
          name: item.status,
          value: item.count,
          percentage: item.percentage,
          color: item.status === 'Active' ? COLORS.active : 
                 item.status === 'Under Repair' ? COLORS.underRepair : COLORS.standby
        }));

        return (
          <div className="space-y-8">
            <div className="h-96 lg:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={150}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} assets`, 
                      `${props.payload.name} (${props.payload.percentage}%)`
                    ]}
                  />
                  <Legend 
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: '20px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg">{item.value}</div>
                    <div className="text-gray-600 text-sm">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "utilization":
      case "costs":
        const isCost = chartType === "costs";
        const barData = chartData.map(item => ({
          name: item.label,
          value: item.value,
          fill: isCost ? COLORS.purple : COLORS.blue
        }));

        const maxValue = Math.max(...barData.map(item => item.value));
        const totalValue = barData.reduce((sum, item) => sum + item.value, 0);
        const averageValue = totalValue / barData.length;

        return (
          <div className="space-y-8">
            <div className="h-96 lg:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis 
                    fontSize={12}
                    tickFormatter={value => isCost ? `$${value.toLocaleString()}` : `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [
                      isCost ? `$${value.toLocaleString()}` : `${value}%`,
                      isCost ? 'Cost' : 'Utilization'
                    ]}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name={isCost ? 'Maintenance Cost' : 'Utilization Rate'}
                    fill={isCost ? COLORS.purple : COLORS.blue}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-900 text-xl">{barData.length}</div>
                <div className="text-blue-700 text-sm">Categories</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-bold text-green-900 text-xl">
                  {isCost ? `$${maxValue.toLocaleString()}` : `${maxValue}%`}
                </div>
                <div className="text-green-700 text-sm">Highest Value</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="font-bold text-yellow-900 text-xl">
                  {isCost ? `$${Math.min(...barData.map(d => d.value)).toLocaleString()}` : `${Math.min(...barData.map(d => d.value))}%`}
                </div>
                <div className="text-yellow-700 text-sm">Lowest Value</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="font-bold text-purple-900 text-xl">
                  {isCost ? `$${Math.round(averageValue).toLocaleString()}` : `${Math.round(averageValue)}%`}
                </div>
                <div className="text-purple-700 text-sm">Average</div>
              </div>
            </div>

            {/* Data Table */}
            <div className="max-w-4xl mx-auto">
              <h4 className="font-semibold text-gray-900 mb-4">Detailed Data</h4>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">
                        {isCost ? 'Cost' : 'Utilization'}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {barData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {isCost ? `$${item.value.toLocaleString()}` : `${item.value}%`}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {((item.value / totalValue) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-gray-500">
            <Maximize2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>Chart type not supported in full-screen view</p>
          </div>
        );
    }
  };

  const handleExportChart = (format) => {
    // Simulate chart export
    console.log(`Exporting ${title} as ${format}`);
    
    switch (format) {
      case 'png':
        alert(`Exporting ${title} as PNG image`);
        break;
      case 'svg':
        alert(`Exporting ${title} as SVG vector`);
        break;
      case 'csv':
        alert(`Exporting ${title} data as CSV`);
        break;
      default:
        alert(`Exporting ${title}`);
    }
  };

  return (
    <>
      {/* Full-screen blurred background */}
      <div
        className="fixed inset-0 -bottom-5 z-50 transition-opacity duration-300 opacity-100"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        onClick={onClose}
      />
      
      {/* Centered Modal - Larger for charts */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 opacity-100">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto scroll-smooth transform transition-all duration-300 border border-gray-200 scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Maximize2 className="h-6 w-6 text-yellow-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {title}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Full-screen view • {chartData?.length || 0} data points • {chartType}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Export Options */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleExportChart('png')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-md transition"
                    title="Export as PNG"
                  >
                    <Image className="h-4 w-4" />
                    <span className="hidden sm:inline">PNG</span>
                  </button>
                  
                  <button
                    onClick={() => handleExportChart('svg')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-md transition"
                    title="Export as SVG"
                  >
                    <Code className="h-4 w-4" />
                    <span className="hidden sm:inline">SVG</span>
                  </button>
                  
                  <button
                    onClick={() => handleExportChart('csv')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-md transition"
                    title="Export Data as CSV"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition ml-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chart Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {renderFullScreenChart()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>Chart Type: <strong>{chartType}</strong></span>
                  <span>Data Points: <strong>{chartData?.length || 0}</strong></span>
                  <span>Last Updated: <strong>{new Date().toLocaleDateString()}</strong></span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleExportChart('csv')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Download Raw Data
                  </button>
                  <button 
                    onClick={onClose}
                    className="text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
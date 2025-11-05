// src/components/logistics/registry/UtilizationCharts.jsx - WITH RECHARTS
import { useState } from "react";
import { PieChart, BarChart3, TrendingUp, Maximize2 } from "lucide-react";
import ChartModal from "../reports/ChartModal";
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

// Enhanced Pie Chart with Recharts
const PieChartComponent = ({ data, loading, onExpand }) => {
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-64 sm:h-80 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading chart...</div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.status,
    value: item.count,
    percentage: item.percentage,
    color: item.status === 'Active' ? COLORS.active : 
           item.status === 'Under Repair' ? COLORS.underRepair : COLORS.standby
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Asset Status Distribution</h4>
        </div>
        <button
          onClick={onExpand}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-1 text-xs text-gray-600"
        >
          <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Expand</span>
        </button>
      </div>
      
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                `${value} assets`, 
                `${props.payload.name} (${props.payload.percentage}%)`
              ]}
            />
          </RePieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700 flex-1">{item.name}</span>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Bar Chart with Recharts
const BarChartComponent = ({ data, title, loading, onExpand, isCost = false }) => {
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-64 sm:h-80 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading chart...</div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    fill: isCost ? COLORS.purple : COLORS.blue
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{title}</h4>
        </div>
        <button
          onClick={onExpand}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-1 text-xs text-gray-600"
        >
          <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Expand</span>
        </button>
      </div>

      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              fontSize={12}
            />
            <YAxis fontSize={12} />
            <Tooltip 
              formatter={(value) => [
                isCost ? `$${value.toLocaleString()}` : `${value}%`,
                isCost ? 'Cost' : 'Utilization'
              ]}
              labelFormatter={(label) => `Category: ${label}`}
            />
            <Bar 
              dataKey="value" 
              fill={isCost ? COLORS.purple : COLORS.blue}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="font-bold text-blue-900 text-lg">
            {chartData.length}
          </div>
          <div className="text-blue-700 text-xs">Categories</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="font-bold text-green-900 text-lg">
            {isCost ? `$${Math.max(...data.map(d => d.value)).toLocaleString()}` : `${Math.max(...data.map(d => d.value))}%`}
          </div>
          <div className="text-green-700 text-xs">Highest</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="font-bold text-yellow-900 text-lg">
            {isCost ? `$${Math.min(...data.map(d => d.value)).toLocaleString()}` : `${Math.min(...data.map(d => d.value))}%`}
          </div>
          <div className="text-yellow-700 text-xs">Lowest</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="font-bold text-purple-900 text-lg">
            {isCost ? `$${Math.round(data.reduce((a, b) => a + b.value, 0) / data.length).toLocaleString()}` : `${Math.round(data.reduce((a, b) => a + b.value, 0) / data.length)}%`}
          </div>
          <div className="text-purple-700 text-xs">Average</div>
        </div>
      </div>
    </div>
  );
};

const UtilizationCharts = ({ statusDistribution, utilizationRates, maintenanceCosts, loading }) => {
  const [activeChart, setActiveChart] = useState("status");
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    chartType: null, 
    chartData: null, 
    title: "" 
  });

  const chartViews = [
    { id: "status", label: "Status", icon: PieChart },
    { id: "utilization", label: "Utilization", icon: TrendingUp },
    { id: "costs", label: "Costs", icon: BarChart3 }
  ];

  const openChartModal = (chartType, chartData, title) => {
    setModalConfig({
      isOpen: true,
      chartType,
      chartData,
      title
    });
  };

  const closeChartModal = () => {
    setModalConfig({ isOpen: false, chartType: null, chartData: null, title: "" });
  };

  const renderChartContent = () => {
    switch (activeChart) {
      case "status":
        return (
          <PieChartComponent 
            data={statusDistribution} 
            loading={loading}
            onExpand={() => openChartModal("status-distribution", statusDistribution, "Asset Status Distribution")}
          />
        );
      case "utilization":
        return (
          <BarChartComponent 
            data={utilizationRates} 
            title="Asset Utilization Rates" 
            loading={loading}
            onExpand={() => openChartModal("utilization", utilizationRates, "Asset Utilization Rates")}
            isCost={false}
          />
        );
      case "costs":
        return (
          <BarChartComponent 
            data={maintenanceCosts} 
            title="Maintenance Costs by Category" 
            loading={loading}
            onExpand={() => openChartModal("costs", maintenanceCosts, "Maintenance Costs by Category")}
            isCost={true}
          />
        );
      default:
        return (
          <PieChartComponent 
            data={statusDistribution} 
            loading={loading}
            onExpand={() => openChartModal("status-distribution", statusDistribution, "Asset Status Distribution")}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Chart Header with Tabs - Responsive */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto -mb-px">
          {chartViews.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveChart(view.id)}
              className={`
                flex items-center gap-1 sm:gap-2 whitespace-nowrap py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 flex-1 sm:flex-initial justify-center
                ${
                  activeChart === view.id
                    ? "border-yellow-500 text-yellow-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <view.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{view.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Chart Content - Responsive */}
      <div className="p-3 sm:p-4 lg:p-6">
        {renderChartContent()}
      </div>

      {/* Chart Modal */}
      <ChartModal
        isOpen={modalConfig.isOpen}
        onClose={closeChartModal}
        chartData={modalConfig.chartData}
        chartType={modalConfig.chartType}
        title={modalConfig.title}
      />
    </div>
  );
};

export default UtilizationCharts;
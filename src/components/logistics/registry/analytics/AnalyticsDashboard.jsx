// src/components/logistics/registry/AnalyticsDashboard.jsx
import { TrendingUp, TrendingDown, Package, DollarSign, Clock, CheckCircle } from "lucide-react";

const MetricCard = ({ title, value, change, icon: Icon, trend, loading }) => (
  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
        <p className={`text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 ${loading ? 'animate-pulse bg-gray-200 text-transparent rounded' : ''}`}>
          {loading ? '...' : value}
        </p>
        {change && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 ml-2">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
      </div>
    </div>
  </div>
);

export default function AnalyticsDashboard({ metrics, loading }) {
  const metricConfig = [
    {
      title: "Total Assets",
      value: metrics.totalAssets || "0",
      icon: Package,
      trend: "up",
      change: "+5%"
    },
    {
      title: "Utilization Rate",
      value: metrics.utilizationRate || "0%",
      icon: TrendingUp,
      trend: "up", 
      change: "+2%"
    },
    {
      title: "Avg Maintenance Cost",
      value: metrics.avgMaintenanceCost || "$0",
      icon: DollarSign,
      trend: "down",
      change: "-8%"
    },
    {
      title: "Uptime",
      value: metrics.uptime || "0%",
      icon: CheckCircle,
      trend: "up",
      change: "+3%"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metricConfig.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          trend={metric.trend}
          loading={loading}
        />
      ))}
    </div>
  );
}
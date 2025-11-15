// src/components/logistics/registry/AnalyticsDashboard.jsx
import { TrendingUp, TrendingDown, Package, DollarSign, Clock, CheckCircle } from "lucide-react";

const MetricCard = ({ title, value, change, icon: Icon, trend, loading }) => (
  <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3 ml-2 ">
      <div className="p-3 bg-green-50 rounded-lg flex-shrink-0">
        <Icon className="h-7 w-7 text-green-800" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <p className={`text-3xl sm:text-4xl font-bold text-green-800 ${loading ? 'animate-pulse bg-gray-200 text-transparent rounded' : ''}`}>
            {loading ? '...' : value}
          </p>
          {change && (
            <span className={`text-sm font-semibold ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </span>
          )}
        </div>
        <p className="text-sm text-left font-mediummt-1">{title}</p>
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
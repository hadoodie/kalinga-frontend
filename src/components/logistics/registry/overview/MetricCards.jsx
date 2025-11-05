// src/components/logistics/registry/MetricCards.jsx
import { Package, CheckCircle, AlertTriangle, Users } from "lucide-react";

const MetricCard = ({ title, value, icon: Icon, color, loading }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-green-700 mb-1">{title}</p>
        <p className={`text-2xl font-bold ${loading ? 'animate-pulse bg-gray-200 text-transparent rounded' : 'text-gray-900'}`}>
          {loading ? '...' : value}
        </p>
      </div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`h-5 w-5 ${color.replace('text-', 'text-')}`} />
      </div>
    </div>
  </div>
);

export default function MetricCards({ metrics, loading }) {
  const metricConfig = [
    {
      title: "Total Assets",
      value: metrics.total_assets,
      icon: Package,
      color: "text-gray-600"
    },
    {
      title: "Active / Deployed",
      value: metrics.active_assets,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Under Repair",
      value: metrics.vehicles_under_repair,
      icon: AlertTriangle,
      color: "text-red-600"
    },
    {
      title: "Unassigned",
      value: metrics.assets_unassigned,
      icon: Users,
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricConfig.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          color={metric.color}
          loading={loading}
        />
      ))}
    </div>
  );
}
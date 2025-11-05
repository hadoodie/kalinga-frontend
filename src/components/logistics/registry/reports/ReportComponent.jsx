// src/components/logistics/registry/ReportComponent.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ReportComponent = ({ component, isPreviewMode, onUpdateConfig }) => {
  // Mock data for different metrics
  const getChartData = (metric) => {
    switch (metric) {
      case 'statusDistribution':
        return [
          { name: 'Active', value: 45, color: '#10B981' },
          { name: 'Standby', value: 25, color: '#F59E0B' },
          { name: 'Under Repair', value: 15, color: '#EF4444' },
          { name: 'Retired', value: 10, color: '#6B7280' }
        ];
      case 'utilization':
        return [
          { month: 'Jan', utilization: 65 },
          { month: 'Feb', utilization: 72 },
          { month: 'Mar', utilization: 68 },
          { month: 'Apr', utilization: 80 },
          { month: 'May', utilization: 75 },
          { month: 'Jun', utilization: 82 }
        ];
      case 'maintenanceTrends':
        return [
          { month: 'Jan', scheduled: 12, emergency: 3, cost: 4500 },
          { month: 'Feb', scheduled: 8, emergency: 5, cost: 6200 },
          { month: 'Mar', scheduled: 15, emergency: 2, cost: 3800 },
          { month: 'Apr', scheduled: 10, emergency: 4, cost: 5100 },
          { month: 'May', scheduled: 14, emergency: 1, cost: 4200 },
          { month: 'Jun', scheduled: 9, emergency: 6, cost: 5800 }
        ];
      default:
        return [];
    }
  };

  const renderChart = () => {
    const data = getChartData(component.config.metric);
    
    switch (component.type) {
      case 'bar-chart':
        return (
          <ResponsiveContainer width="100%" height={component.config.height || 300}>
            <BarChart data={data}>
              {component.config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {component.config.showLegend && <Legend />}
              <Bar dataKey="value" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line-chart':
        return (
          <ResponsiveContainer width="100%" height={component.config.height || 300}>
            <LineChart data={data}>
              {component.config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              {component.config.showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey="scheduled" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
              <Line 
                type="monotone" 
                dataKey="emergency" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie-chart':
        return (
          <ResponsiveContainer width="100%" height={component.config.height || 250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              {component.config.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'metric-card':
        return (
          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {data.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {component.config.title}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Total assets tracked
            </div>
          </div>
        );
      
      case 'data-table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">
                    Asset
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-700 border">
                      Asset {index + 1}
                    </td>
                    <td className="px-4 py-2 text-sm border">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        index % 3 === 0 ? 'bg-green-100 text-green-800' :
                        index % 3 === 1 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Standby' : 'Repair'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 border">
                      Location {index + 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Unknown component type: {component.type}
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {component.config.title}
        </h3>
      </div>
      {renderChart()}
    </div>
  );
};

export default ReportComponent;
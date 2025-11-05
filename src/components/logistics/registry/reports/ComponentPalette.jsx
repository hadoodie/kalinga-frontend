import React from 'react';
import { Plus } from 'lucide-react';

const ComponentPalette = ({ chartTypes, onAddComponent }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Components</h3>
      <p className="text-sm text-gray-600 mb-4">
        Drag components to the canvas
      </p>
      
      <div className="space-y-3">
        {chartTypes.map((chartType) => (
          <div
            key={chartType.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(chartType));
            }}
            onClick={() => onAddComponent(chartType)}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition-all group"
          >
            <div className="text-2xl">{chartType.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-gray-800 group-hover:text-yellow-700">
                {chartType.name}
              </div>
            </div>
            <Plus className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
          </div>
        ))}
      </div>

      {/* Usage Tips */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Tips</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click or drag to add components</li>
          <li>• Configure in properties panel</li>
          <li>• Drag to rearrange on canvas</li>
        </ul>
      </div>
    </div>
  );
};

export default ComponentPalette;
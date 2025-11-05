// src/components/logistics/registry/ReportCanvas.jsx
import React from 'react';
import { 
  Trash2, 
  Copy, 
  Settings,
  Move
} from 'lucide-react';
import ReportComponent from './ReportComponent';

const ReportCanvas = ({
  components,
  selectedComponent,
  onSelectComponent,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  isPreviewMode
}) => {
  if (components.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Components Added
          </h3>
          <p className="text-gray-500 mb-4">
            {isPreviewMode 
              ? 'Add components in edit mode to see your report preview'
              : 'Drag components from the palette to start building your report'
            }
          </p>
          {!isPreviewMode && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Move className="w-4 h-4" />
              <span>Drag and drop to arrange components</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Canvas Header */}
      {!isPreviewMode && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Report Canvas</h3>
          <div className="text-sm text-gray-500">
            {components.length} component{components.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Components Grid */}
      <div className="space-y-6">
        {components.map((component) => (
          <div
            key={component.id}
            className={`relative rounded-lg border-2 transition-all ${
              selectedComponent === component.id
                ? 'border-yellow-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            } ${
              isPreviewMode ? 'border-transparent' : ''
            }`}
          >
            {/* Component Actions */}
            {!isPreviewMode && (
              <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onDuplicateComponent(component.id)}
                  className="p-1 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemoveComponent(component.id)}
                  className="p-1 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Component Content */}
            <div
              onClick={() => !isPreviewMode && onSelectComponent(component.id)}
              className={`cursor-${isPreviewMode ? 'default' : 'pointer'} p-4`}
            >
              <ReportComponent
                component={component}
                isPreviewMode={isPreviewMode}
                onUpdateConfig={(newConfig) => onUpdateComponent(component.id, newConfig)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Canvas Footer */}
      {!isPreviewMode && components.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Move className="w-4 h-4" />
            <span>Click and drag to rearrange components</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCanvas;
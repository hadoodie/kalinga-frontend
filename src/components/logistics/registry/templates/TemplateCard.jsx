// src/components/logistics/registryTemplateCard.jsx
import React from 'react';
import { 
  MoreVertical, 
  Copy, 
  Edit, 
  Trash2, 
  Star, 
  Calendar,
  FileText 
} from 'lucide-react';

const TemplateCard = ({ 
  template, 
  viewMode = 'grid',
  onUseTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleUseTemplate = () => {
    onUseTemplate?.(template);
  };

  const handleEdit = () => {
    onEditTemplate?.(template);
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    onDuplicateTemplate?.(template);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onDeleteTemplate?.(template);
    setShowMenu(false);
  };

  const toggleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Field type icons mapping
  const getFieldTypeIcon = (type) => {
    const icons = {
      text: 'T',
      number: '#',
      date: '📅',
      dropdown: '▼',
      checklist: '☑️',
      file: '📎'
    };
    return icons[type] || '?';
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Icon */}
            <div className="text-2xl">{template.icon}</div>
            
            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-green-900">{template.name}</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {template.category}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-1">{template.description}</p>
              
              {/* Field Summary */}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {template.fieldCount} fields
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Used {template.usageCount} times
                </span>
                <span>Last used: {template.lastUsed}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full hover:bg-gray-100 ${
                isFavorite ? 'text-yellow-500' : 'text-gray-400'
              }`}
            >
              <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            
            <button
              onClick={handleUseTemplate}
              className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Use Template
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Copy size={14} />
                    Duplicate
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (default)
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{template.icon}</div>
          <div>
            <h3 className="font-semibold text-green-900 text-lg">{template.name}</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {template.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleFavorite}
            className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              isFavorite ? 'text-yellow-500 opacity-100' : 'text-gray-400'
            }`}
          >
            <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy size={14} />
                  Duplicate
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>

      {/* Field Types Preview */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 font-medium mb-2">FIELD TYPES</div>
        <div className="flex flex-wrap gap-1">
          {template.fields.slice(0, 5).map((field, index) => (
            <span
              key={field.id}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1"
            >
              <span className="text-[10px]">{getFieldTypeIcon(field.type)}</span>
              {field.label}
            </span>
          ))}
          {template.fields.length > 5 && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              +{template.fields.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FileText size={12} />
            {template.fieldCount} fields
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {template.usageCount} uses
          </span>
        </div>

        <button
          onClick={handleUseTemplate}
          className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          Use Template
        </button>
      </div>
    </div>
  );
};

// Add this CSS for line clamping
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export default TemplateCard;
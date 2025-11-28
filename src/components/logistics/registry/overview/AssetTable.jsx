// src/components/logistics/registry/overview/AssetTable.jsx
import { useState, useEffect } from "react";
import { 
  Truck, Plus, Home, Car, Bus, Zap, Shield, 
  Ship, Radio, Package, Users, MapPin,
  Edit, Trash2, Download, Archive, Send, MoreVertical,
  Tablet, LayoutGrid, ChevronLeft, ChevronRight, Eye, X
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useNavigate } from "react-router-dom";

// Responsive CSS
const assetTableStyles = `
.asset-table-row {
  transition: all 0.3s ease;
}

.asset-table-row:hover {
  background: #f0fdf4;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.asset-card {
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.asset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #10b981;
}

.asset-btn {
  transition: all 0.2s ease;
}

.asset-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .desktop-table {
    display: none;
  }
  
  .mobile-cards {
    display: block;
  }
}

@media (min-width: 769px) {
  .desktop-table {
    display: block;
  }
  
  .mobile-cards {
    display: none;
  }
}
`;

if (!document.querySelector('#asset-table-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'asset-table-styles';
  styleElement.textContent = assetTableStyles;
  document.head.appendChild(styleElement);
}

export default function AssetTable({ assets, loading, onRefresh, filters = {} }) {
  const navigate = useNavigate(); // ← ADD THIS
  const [viewMode, setViewMode] = useState("table");
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerPage = 12;

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply filters if provided
  const filteredAssets = filters.status && filters.status !== "All Status" 
    ? assets.filter(asset => asset.status === filters.status)
    : assets;

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  // Working Icon Mapping
  const getAssetIcon = (category) => {
    const iconClass = "h-4 w-4";
    
    const iconMap = {
      'ambulance': <div className={`${iconClass} text-red-600`} />,
      'medical vehicle': <div className={`${iconClass} text-red-600`} />,
      'medical equipment': <div className={`${iconClass} text-green-600`} />,
      'medical facility': <div className={`${iconClass} text-pink-600`} />,
      'fire truck': <div className={`${iconClass} text-red-500`} />,
      'emergency vehicle': <div className={`${iconClass} text-red-500`} />,
      'support vehicle': <div className={`${iconClass} text-gray-600`} />,
      'all-terrain vehicle': <div className={`${iconClass} text-orange-600`} />,
      'generator': <div className={`${iconClass} text-yellow-600`} />,
      'power equipment': <div className={`${iconClass} text-yellow-600`} />,
      'safety equipment': <div className={`${iconClass} text-amber-600`} />,
      'rescue boat': <div className={`${iconClass} text-blue-600`} />,
      'watercraft': <div className={`${iconClass} text-blue-600`} />,
      'command unit': <div className={`${iconClass} text-purple-600`} />,
      'communication': <div className={`${iconClass} text-teal-600`} />
    };

    return iconMap[category?.toLowerCase()] || <div className={`${iconClass} text-gray-600`} />;
  };

  // Core Functions
const handleViewDetails = (asset) => {
  navigate(`/logistics/assets/${asset.id}`);
};



  // Bulk Operations
  const toggleSelectAsset = (assetId) => {
    const newSelected = new Set(selectedAssets);
    newSelected.has(assetId) ? newSelected.delete(assetId) : newSelected.add(assetId);
    setSelectedAssets(newSelected);
  };

  const toggleCheckboxes = () => {
    setShowCheckboxes(!showCheckboxes);
    if (!showCheckboxes) setSelectedAssets(new Set());
    setShowBulkOptions(false);
  };

  // Pagination
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Button Component
  const ActionButton = ({ children, onClick, variant = "primary", icon: Icon, className = "" }) => {
    const variants = {
      primary: "bg-green-800 hover:bg-green-700 text-white",
      secondary: "bg-gray-100 hover:bg-gray-200 text-green-900",
      accent: "bg-yellow-500 hover:bg-yellow-600 text-gray-800",
      danger: "bg-red-600 hover:bg-red-700 text-white"
    };

    return (
      <button
        onClick={onClick}
        className={`asset-btn px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${variants[variant]} ${className}`}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </button>
    );
  };

  // Mobile Card Component
  const MobileAssetCard = ({ asset }) => (
    <div 
      className="asset-card bg-white rounded-lg p-4 mb-3 cursor-pointer"
      onClick={() => !showCheckboxes && handleViewDetails(asset)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {getAssetIcon(asset.category)}
          <div>
            <h3 className="font-bold text-green-900 text-sm">{asset.id}</h3>
            <p className="text-gray-600 text-xs">{asset.type}</p>
          </div>
        </div>
        {showCheckboxes && (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            checked={selectedAssets.has(asset.id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelectAsset(asset.id);
            }}
          />
        )}
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Category:</span>
          <span className="font-medium text-green-900">{asset.category}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Status:</span>
          <StatusBadge status={asset.status} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Location:</span>
          <span className="font-medium text-green-900 text-right">{asset.location}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Personnel:</span>
          <span className="font-medium text-green-900 text-right">{asset.personnel}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 ">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          {asset.location}
        </div>
        {!showCheckboxes && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(asset);
            }}
            className="text-green-700 hover:text-green-900 text-xs font-medium asset-btn px-3 py-1 rounded-md"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="text-green-900 font-medium">Loading assets...</span>
        </div>
      </div>
    );
  }

  if (filteredAssets.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-900 mb-2">No assets found</h3>
        <p className="text-gray-600 mb-6">
          {filters.status ? `No ${filters.status.toLowerCase()} assets` : 'Get started by adding your first asset'}
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="bg-white p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-green-900 mb-1">
              {filteredAssets.length} assets found
              {selectedAssets.size > 0 && ` • ${selectedAssets.size} selected`}
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Bulk Actions */}
            {!isMobile && (
              <div className="relative">
                <ActionButton
                  onClick={toggleCheckboxes}
                  variant={showCheckboxes ? "accent" : "secondary"}
                  icon={Users}
                >
                  {showCheckboxes ? "Cancel Selection" : "Select Assets"}
                </ActionButton>
              </div>
            )}

            {/* View Toggle - Hidden on mobile since it's always cards */}
            {!isMobile && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`asset-btn flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    viewMode === "table" ? "bg-green-800 text-white" : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`asset-btn flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    viewMode === "card" ? "bg-green-800 text-white" : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            )}

            <ActionButton 
              onClick={() => navigate('/logistics/assets/add')} 
              variant="primary" 
              icon={Plus}
            >
              Add Asset
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="desktop-table">
        {viewMode === "table" && (
          <div className="bg-white overflow-hidden px-4 mx-3 sm:mx-5 lg:mx-2">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 text-center"> 
                <thead className="bg-transparent text-green-800">
                  <tr>
                    {showCheckboxes && (
                      <th className="w-12 px-4 py-4 align-middle text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          checked={selectedAssets.size === currentAssets.length && currentAssets.length > 0}
                          onChange={() =>
                            selectedAssets.size === currentAssets.length
                              ? setSelectedAssets(new Set())
                              : setSelectedAssets(new Set(currentAssets.map(asset => asset.id)))
                          }
                        />
                      </th>
                    )}
                    <th className="px-4 py-4 text-sm font-semibold uppercase text-center">Asset Details</th>
                    <th className="px-4 py-4 text-sm font-semibold uppercase text-center">Category</th>
                    <th className="px-4 py-4 text-sm font-semibold uppercase text-center">Capacity</th>
                    <th className="px-4 py-4 text-sm font-semibold uppercase text-center">Status</th>
                    <th className="px-4 py-4 text-sm font-semibold uppercase text-center">Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="asset-table-row cursor-pointer"
                      onClick={() => !showCheckboxes && handleViewDetails(asset)}
                    >
                      {showCheckboxes && (
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            checked={selectedAssets.has(asset.id)}
                            onChange={() => toggleSelectAsset(asset.id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-3"> {/* justify-center added */}
                          {getAssetIcon(asset.category)}
                          <div>
                            <div className="font-semibold text-green-900 text-sm">{asset.id}</div>
                            <div className="text-gray-600 text-sm">{asset.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">{asset.category}</td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">{asset.capacity}</td>
                      <td className="px-4 py-4 text-center"><StatusBadge status={asset.status} /></td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        <div className="flex items-center justify-center gap-1"> {/* justify-center added */}
                          <MapPin className="h-3 w-3 text-gray-400" /> {asset.location}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Desktop Card View */}
        {viewMode === "card" && (
          <div className="bg-white rounded-b-lg border-b border-gray-200 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentAssets.map((asset) => (
              <div 
                key={asset.id} 
                className="asset-card bg-white rounded-lg p-4 cursor-pointer"
                onClick={() => !showCheckboxes && handleViewDetails(asset)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getAssetIcon(asset.category)}
                    <div>
                      <h3 className="font-bold text-green-900 text-sm">{asset.id}</h3>
                      <p className="text-gray-600 text-xs">{asset.type}</p>
                    </div>
                  </div>
                  <StatusBadge status={asset.status} />
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-green-900">{asset.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium text-green-900">{asset.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Personnel:</span>
                    <span className="font-medium text-green-900">{asset.personnel}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {asset.location}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(asset);
                    }}
                    className="text-green-700 hover:text-green-900 text-xs font-medium asset-btn px-3 py-1 rounded-md"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* Mobile Card View - Always shows cards on mobile */}
      <div className="mobile-cards">
        <div className="space-y-3">
          {currentAssets.map((asset) => (
            <MobileAssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {filteredAssets.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border-b-lg border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
          </div>
          
          <div className="flex items-center gap-2">
            <ActionButton onClick={prevPage} disabled={currentPage === 1} variant="secondary" icon={ChevronLeft} className="p-2" />
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                
                if (showPage) {
                  return (
                    <ActionButton
                      key={page}
                      onClick={() => goToPage(page)}
                      variant={currentPage === page ? "primary" : "secondary"}
                      className="px-3 py-1"
                    >
                      {page}
                    </ActionButton>
                  );
                } else if (page === 2 || page === totalPages - 1) {
                  return <span key={page} className="px-1 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            
            <ActionButton onClick={nextPage} disabled={currentPage === totalPages} variant="secondary" icon={ChevronRight} className="p-2" />
          </div>
        </div>
      )}
    </div>
  );
}
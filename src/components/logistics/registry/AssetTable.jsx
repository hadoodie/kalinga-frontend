// src/components/logistics/registry/AssetTable.jsx - FIXED ALIGNMENT
import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Tablet, LayoutGrid, Package, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import AddAssetDrawer from "./AddAssetDrawer";
import BulkActionsPanel from "./BulkActionsPanel";

export default function AssetTable({ assets, loading, onRefresh }) {
  const [viewMode, setViewMode] = useState("table");
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Pagination
  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAssets = assets.slice(startIndex, startIndex + itemsPerPage);

  // Mock functions
  const handleSaveAsset = (assetData) => {
    console.log("Saving asset:", assetData);
    setIsDrawerOpen(false);
    setEditingAsset(null);
    onRefresh();
  };

  const handleEdit = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    setEditingAsset(asset);
    setIsDrawerOpen(true);
  };

  const handleView = (assetId) => {
    console.log("Viewing asset:", assetId);
  };

  const handleDelete = (assetId) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      console.log("Deleting asset:", assetId);
      onRefresh();
    }
  };

  const handleBulkStatusUpdate = (status) => {
    console.log("Updating status for", selectedAssets.size, "assets to:", status);
    setSelectedAssets(new Set());
    setShowBulkActions(false);
  };

  const handleBulkExport = () => {
    console.log("Exporting", selectedAssets.size, "assets");
  };

  const handleBulkAssign = () => {
    console.log("Assigning", selectedAssets.size, "assets");
  };

  const toggleSelectAsset = (assetId) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === currentAssets.length) {
      setSelectedAssets(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedAssets(new Set(currentAssets.map(asset => asset.id)));
      setShowBulkActions(true);
    }
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mr-3"></div>
          Loading assets...
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
        <p className="text-gray-500 mb-4">Try adjusting your filters or add a new asset.</p>
        <button 
          onClick={() => {
            setEditingAsset(null);
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-800 rounded-lg font-semibold hover:bg-yellow-600 transition mx-auto"
        >
          <Plus className="h-4 w-4" />
          Add Your First Asset
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Bulk Actions Panel */}
      {showBulkActions && selectedAssets.size > 0 && (
        <BulkActionsPanel
          selectedCount={selectedAssets.size}
          onStatusUpdate={handleBulkStatusUpdate}
          onExport={handleBulkExport}
          onAssign={handleBulkAssign}
          onClearSelection={() => {
            setSelectedAssets(new Set());
            setShowBulkActions(false);
          }}
        />
      )}

      {/* Table Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex gap-1 flex-1 sm:flex-initial">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition flex-1 justify-center ${
                viewMode === "table" 
                  ? "bg-yellow-500 text-gray-800" 
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              <Tablet className="h-4 w-4" />
              <span className="hidden xs:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition flex-1 justify-center ${
                viewMode === "card" 
                  ? "bg-yellow-500 text-gray-800" 
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden xs:inline">Cards</span>
            </button>
          </div>

          {selectedAssets.size > 0 && (
            <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-lg whitespace-nowrap">
              {selectedAssets.size} selected
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={() => {
              setEditingAsset(null);
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-gray-800 rounded-lg font-semibold hover:bg-yellow-600 transition text-sm whitespace-nowrap flex-1 sm:flex-initial justify-center"
          >
            <Plus className="h-4 w-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Table View - FIXED ALIGNMENT */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {/* Desktop Table - Hidden on mobile */}
            <table className="min-w-full divide-y divide-gray-200 hidden md:table">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 px-2 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 mx-auto"
                      checked={selectedAssets.size === currentAssets.length && currentAssets.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-24">
  ID
</th>
<th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-32">
  Type
</th>
<th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-40">
  Category
</th>
<th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-28">
  Capacity
</th>
<th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-28">
  Status
</th>
<th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-40">
  Location
</th>
<th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-40">
  Personnel
</th>
<th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-32">
  Actions
</th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentAssets.map((asset) => (
                  <tr 
                    key={asset.id} 
                    className={`hover:bg-gray-50 transition ${
                      selectedAssets.has(asset.id) ? 'bg-blue-50' : ''
                    } ${asset.status === "Under Repair" ? "bg-red-50" : ""}`}
                  >
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 mx-auto"
                        checked={selectedAssets.has(asset.id)}
                        onChange={() => toggleSelectAsset(asset.id)}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {asset.id}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {asset.type}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {asset.category}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {asset.capacity}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {asset.location}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {asset.personnel}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleView(asset.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(asset.id)}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Table - Visible only on mobile */}
            <div className="md:hidden">
              {currentAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  className={`border-b border-gray-200 p-4 ${
                    selectedAssets.has(asset.id) ? 'bg-blue-50' : ''
                  } ${asset.status === "Under Repair" ? "bg-red-50" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                        checked={selectedAssets.has(asset.id)}
                        onChange={() => toggleSelectAsset(asset.id)}
                      />
                      <div>
                        <h3 className="font-bold text-gray-900">{asset.id}</h3>
                        <p className="text-sm text-gray-600">{asset.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusBadge status={asset.status} />
                      <button
                        onClick={() => setMobileMenuOpen(mobileMenuOpen === asset.id ? null : asset.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium ml-1">{asset.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Capacity:</span>
                      <span className="font-medium ml-1">{asset.capacity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium ml-1 truncate">{asset.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Personnel:</span>
                      <span className="font-medium ml-1 truncate">{asset.personnel}</span>
                    </div>
                  </div>

                  {/* Mobile Action Menu */}
                  {mobileMenuOpen === asset.id && (
                    <div className="flex gap-2 border-t border-gray-200 pt-3">
                      <button
                        onClick={() => handleView(asset.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs font-semibold"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(asset.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 text-white rounded text-xs font-semibold"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 text-white rounded text-xs font-semibold"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentAssets.map((asset) => (
            <div 
              key={asset.id} 
              className={`bg-white rounded-lg border border-gray-200 p-20 hover:shadow-md transition ${
                asset.status === "Under Repair" ? "border-l-4 border-l-red-500" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    checked={selectedAssets.has(asset.id)}
                    onChange={() => toggleSelectAsset(asset.id)}
                  />
                  <h3 className="font-bold text-gray-900 text-sm">{asset.id}</h3>
                </div>
                <StatusBadge status={asset.status} />
              </div>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium text-right">{asset.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium text-right">{asset.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacity:</span>
                  <span className="font-medium text-right">{asset.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-medium text-right break-words">{asset.location}</span>
                </div>
              </div>

              <div className="flex gap-1 mt-3 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleView(asset.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-1 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition"
                >
                  <Eye className="h-3 w-3" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(asset.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-1 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-1 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {assets.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600 bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-xs sm:text-sm">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, assets.length)} of {assets.length} assets
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs hidden sm:inline">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <button 
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              
              {/* Page numbers - show limited on mobile */}
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                const showOnMobile = 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1;
                
                if (showOnMobile) {
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded text-xs ${
                        currentPage === page
                          ? "bg-yellow-500 text-gray-800 font-medium"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === 2 || page === totalPages - 1) {
                  return <span key={page} className="px-1 text-gray-400">...</span>;
                }
                return null;
              })}
              
              <button 
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Asset Drawer */}
      <AddAssetDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingAsset(null);
        }}
        onSave={handleSaveAsset}
        editingAsset={editingAsset}
      />
    </div>
  );
}
// src/components/logistics/ResourceMngmt/AssetRegistryHospital.jsx
import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Eye,
  Wrench,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  AlertTriangle
} from 'lucide-react';

const AssetRegistryHospital = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, statusFilter]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/hospital/assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    setFilteredAssets(filtered);
  };

  const handleAddAsset = async (assetData) => {
    try {
      const response = await fetch('/api/hospital/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData)
      });
      const newAsset = await response.json();
      setAssets(prev => [newAsset, ...prev]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };

  const handleUpdateAsset = async (id, updates) => {
    try {
      const response = await fetch(`/api/hospital/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedAsset = await response.json();
      setAssets(prev => prev.map(asset => 
        asset.id === id ? updatedAsset : asset
      ));
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      await fetch(`/api/hospital/assets/${id}`, {
        method: 'DELETE'
      });
      setAssets(prev => prev.filter(asset => asset.id !== id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const handleMarkMaintenance = async (id) => {
    await handleUpdateAsset(id, { status: 'maintenance' });
  };

  const getStatusConfig = (status) => {
    const configs = {
      available: {
        badge: <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">Available</span>,
        icon: <CheckCircle className="w-4 h-4" />
      },
      assigned: {
        badge: <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Assigned</span>,
        icon: <Truck className="w-4 h-4" />
      },
      maintenance: {
        badge: <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Maintenance</span>,
        icon: <Wrench className="w-4 h-4" />
      },
      inactive: {
        badge: <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 border border-gray-300">Inactive</span>,
        icon: <XCircle className="w-4 h-4" />
      }
    };
    return configs[status] || configs.inactive;
  };

  const getVehicleIcon = (type) => {
    const icons = {
      refrigerated: '❄️',
      ambulance: '🚑',
      van: '🚐',
      truck: '🚚',
      motorcycle: '🏍️'
    };
    return icons[type] || '🚗';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-green-800">My Assets Registry</h2>
            <p className="text-green-700">Manage your hospital's vehicles and equipment</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by plate, type, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <Truck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Assets Found</h3>
          <p className="text-gray-500">No assets match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const statusConfig = getStatusConfig(asset.status);
            
            return (
              <div key={asset.id} className="bg-white border border-gray-300 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Vehicle Header */}
                <div className={`p-4 ${
                  asset.status === 'available' ? 'bg-green-50' :
                  asset.status === 'assigned' ? 'bg-blue-50' :
                  asset.status === 'maintenance' ? 'bg-amber-50' : 'bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getVehicleIcon(asset.vehicle_type)}</span>
                        <h3 className="text-lg font-bold text-gray-800">{asset.model}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-white rounded-full border border-gray-300">
                          <span className="font-mono font-bold text-gray-800">{asset.plate_number}</span>
                        </div>
                        {statusConfig.badge}
                      </div>
                    </div>
                    {asset.status === 'assigned' && (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                        On Duty
                      </span>
                    )}
                  </div>
                </div>

                {/* Asset Details */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                      <p className="font-semibold text-gray-800 capitalize">{asset.vehicle_type}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Capacity</label>
                      <p className="font-semibold text-gray-800">{asset.capacity} units</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Last Maintenance</label>
                      <p className="font-semibold text-gray-800">
                        {new Date(asset.last_maintenance).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Next Due</label>
                      <p className={`font-semibold ${
                        new Date(asset.next_maintenance) < new Date() 
                          ? 'text-red-600' 
                          : 'text-gray-800'
                      }`}>
                        {new Date(asset.next_maintenance).toLocaleDateString()}
                        {new Date(asset.next_maintenance) < new Date() && (
                          <AlertTriangle className="inline w-4 h-4 ml-2" />
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Special Features */}
                  {asset.features && asset.features.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                      <div className="flex flex-wrap gap-2">
                        {asset.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="p-2 text-gray-600 hover:text-gray-800"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleUpdateAsset(asset.id, {})}
                        className="p-2 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {asset.status !== 'maintenance' && (
                        <button
                          onClick={() => handleMarkMaintenance(asset.id)}
                          className="p-2 text-amber-600 hover:text-amber-800"
                        >
                          <Wrench className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <AddAssetModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddAsset}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAsset && (
        <DeleteConfirmModal
          asset={selectedAsset}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedAsset(null);
          }}
          onConfirm={() => handleDeleteAsset(selectedAsset.id)}
        />
      )}
    </div>
  );
};

// Add Asset Modal Component
const AddAssetModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    plate_number: '',
    vehicle_type: 'van',
    model: '',
    capacity: '',
    features: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-300">
          <h3 className="text-xl font-bold text-gray-800">Add New Asset</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Form fields */}
          <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-lg font-bold">
            Add Asset
          </button>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ asset, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-red-300 bg-red-50">
          <h3 className="text-xl font-bold text-red-800">Delete Asset</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <span className="font-bold">{asset.plate_number}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
            >
              Delete Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetRegistryHospital;
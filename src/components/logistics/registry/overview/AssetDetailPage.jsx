// src/components/logistics/registry/overview/AssetDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  X,
  Edit,
  Trash2,
  MapPin,
  Users,
  Calendar,
  Settings,
  Building,
  Truck,
  Stethoscope,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  Wrench,
  Download,
  ArrowLeft
} from "lucide-react";
import { mockAssetService } from "../../../../services/mockAssetService";

const AssetDetailPage = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        const assetData = await mockAssetService.getAsset(assetId);
        setAsset(assetData);
      } catch (error) {
        console.error('Error fetching asset:', error);
        navigate('/logistics/asset-registry'); // Redirect if asset not found
      } finally {
        setLoading(false);
      }
    };

    if (assetId) {
      fetchAsset();
    }
  }, [assetId, navigate]);

  const handleClose = () => {
    navigate('/logistics/asset-registry');
  };

  const handleEdit = () => {
    // Navigate to edit page or open edit modal
    console.log("Edit asset:", asset.id);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${asset.id}?`)) {
      try {
        await mockAssetService.deleteAsset(asset.id);
        navigate('/logistics/asset-registry');
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  // Asset type icon
  const getAssetIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "ambulance":
      case "vehicle":
        return <Truck className="h-7 w-7 text-green-600" />;
      case "medical":
      case "equipment":
        return <Stethoscope className="h-7 w-7 text-blue-600" />;
      case "facility":
      case "building":
        return <Building className="h-7 w-7 text-orange-600" />;
      default:
        return <Package className="h-7 w-7 text-gray-600" />;
    }
  };

  // Status config
  const getStatusConfig = (status) => {
    switch (status) {
      case "Operational":
        return { color: "green", icon: CheckCircle };
      case "Under Repair":
      case "Under Maintenance":
        return { color: "yellow", icon: Wrench };
      case "Out of Service":
        return { color: "red", icon: AlertCircle };
      default:
        return { color: "gray", icon: Clock };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-900 font-medium">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Asset Not Found</h2>
          <p className="text-gray-600 mb-6">The asset you're looking for doesn't exist.</p>
          <button
            onClick={handleClose}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Asset Registry
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(asset.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to Asset Registry</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-md border border-green-200">
                {getAssetIcon(asset.type)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-green-900">Asset Details</h1>
                <p className="text-green-700 text-lg">ID: {asset.id} • {asset.type}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-2 bg-white rounded-full border-2 border-green-300 shadow-sm">
              <StatusIcon className={`h-5 w-5 text-${statusConfig.color}-600`} />
              <span className={`text-base font-semibold text-${statusConfig.color}-700`}>
                {asset.status}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Asset Overview */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm">
            <h3 className="text-xl font-bold text-green-900 mb-4">Asset Overview</h3>
            <div className="grid grid-cols-1 md:grid-3 gap-6 text-base">
              <div>
                <span className="font-semibold text-green-800">Category:</span>
                <p className="text-green-900 mt-1 font-medium">{asset.category}</p>
              </div>
              <div>
                <span className="font-semibold text-green-800">Capacity:</span>
                <p className="text-green-900 mt-1 font-medium">{asset.capacity}</p>
              </div>
              <div>
                <span className="font-semibold text-green-800">Last Updated:</span>
                <p className="text-green-900 mt-1 font-medium">
                  {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-3">
              <MapPin className="h-6 w-6 text-green-700" />
              Location & Deployment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <span className="font-medium text-blue-800">Current Location:</span>
                <p className="text-blue-900 text-lg font-bold mt-1">{asset.location}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <span className="font-medium text-purple-800">Facility Zone:</span>
                <p className="text-purple-900 text-lg font-bold mt-1">Zone A - Emergency Wing</p>
              </div>
            </div>
          </div>

          {/* Personnel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-green-700" />
              Personnel Assignment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                <span className="font-medium text-teal-800">Assigned To:</span>
                <p className="text-teal-900 text-lg font-bold mt-1">{asset.personnel || "Unassigned"}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <span className="font-medium text-orange-800">Team:</span>
                <p className="text-orange-900 text-lg font-bold mt-1">Emergency Response Unit</p>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-3">
              <Settings className="h-6 w-6 text-green-700" />
              Maintenance & Service History
            </h4>
            <div className="space-y-4">
              {[
                { label: "Last Service", value: asset.lastMaintenance || "Oct 28, 2025", color: "green" },
                { label: "Next Due", value: asset.nextMaintenance || "Nov 25, 2025", color: "yellow" },
                { label: "Total Services", value: "18", color: "blue" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-700 font-medium">{item.label}:</span>
                  <span className={`text-lg font-bold text-${item.color}-700`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="text-xl font-bold text-green-900 mb-4">Procurement & Warranty</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
              <div className="p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">Purchase Date:</span>
                <p className="text-green-900 font-bold mt-1">{asset.purchaseDate || "January 15, 2024"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">Warranty Until:</span>
                <p className="text-green-900 font-bold mt-1">January 15, 2026</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">Supplier:</span>
                <p className="text-green-900 font-bold mt-1">{asset.manufacturer || "MedEquip Corporation"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-700 font-medium">Asset Value:</span>
                <p className="text-green-900 font-bold mt-1">{asset.value || "₱2,450,000"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={() => {
                console.log("Exporting:", asset.id);
                alert("Asset data exported!");
              }}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold text-base shadow-sm"
            >
              <Download className="h-5 w-5" />
              Export Full Report
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold text-base shadow-md"
            >
              <Trash2 className="h-5 w-5" />
              Delete Asset
            </button>
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-all font-semibold text-base shadow-md"
            >
              <Edit className="h-5 w-5" />
              Edit Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
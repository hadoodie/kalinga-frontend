import { useState } from "react";
import { RefreshCw } from "lucide-react";

const ASSET_DATA = [
  { id: "V-101", type: "SUV", category: "Vehicle", capacity: "6 Pax", status: "Active", location: "Sector 3 Base", personnel: "Jane Doe (Driver)" },
  { id: "V-102", type: "Truck", category: "Vehicle", capacity: "5 Tons", status: "Under Repair", location: "HQ Depot", personnel: "N/A" },
  { id: "V-103", type: "Ambulance", category: "Vehicle", capacity: "4 Pax", status: "Active", location: "Sector 5", personnel: "Mike Ross (Medic)" },
  { id: "V-104", type: "Drone", category: "Vehicle", capacity: "Surveillance", status: "Standby", location: "HQ Hangar", personnel: "Sarah Lee (Pilot)" },
  { id: "V-105", type: "Bus", category: "Vehicle", capacity: "30 Pax", status: "Active", location: "Sector 1 Base", personnel: "Alex Chen (Driver)" },
  { id: "E-205", type: "Medical Kit", category: "Equipment", capacity: "50 Kits", status: "Active", location: "V-101 (SUV)", personnel: "John Smith" },
  { id: "E-301", type: "Food Rations", category: "Equipment", capacity: "200 Meals", status: "Active", location: "Sector 5 Base", personnel: "Sam Wilson" },
  { id: "E-302", type: "Blankets", category: "Equipment", capacity: "100 Units", status: "Standby", location: "HQ Depot", personnel: "Warehouse Team" },
  { id: "E-410", type: "Water Purifier", category: "Equipment", capacity: "Portable", status: "Active", location: "Sector 3 Base", personnel: "Field Tech" },
  { id: "E-500", type: "Generator", category: "Equipment", capacity: "10kW", status: "Under Repair", location: "Maintenance Bay", personnel: "N/A" },
];

const getStatusBadge = (status) => {
  let colorClass, icon;
  switch (status) {
    case "Active":
      colorClass = "bg-green-100 text-green-800";
      icon = "🟢";
      break;
    case "Under Repair":
      colorClass = "bg-red-100 text-red-800 animate-pulse";
      icon = "🔴";
      break;
    case "Standby":
      colorClass = "bg-yellow-100 text-yellow-800";
      icon = "🟡";
      break;
    default:
      colorClass = "bg-gray-100 text-gray-800";
      icon = "⚫";
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
      {icon} {status}
    </span>
  );
};

export default function Registry() {
  const [assets, setAssets] = useState(ASSET_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Metrics
  const totalAssets = ASSET_DATA.length;
  const activeAssets = ASSET_DATA.filter((a) => a.status === "Active").length;
  const repairVehicles = ASSET_DATA.filter((a) => a.category === "Vehicle" && a.status === "Under Repair").length;
  const unassignedAssets = ASSET_DATA.filter((a) => a.personnel === "N/A" || a.status === "Standby").length;

  // Filtered data
  const filteredAssets = assets.filter((asset) => {
    const statusMatch = !statusFilter || asset.status === statusFilter;
    const searchMatch =
      !search ||
      asset.id.toLowerCase().includes(search.toLowerCase()) ||
      asset.location.toLowerCase().includes(search.toLowerCase()) ||
      asset.personnel.toLowerCase().includes(search.toLowerCase()) ||
      asset.type.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const refreshData = () => {
    console.log("Refreshing asset data...");
    setAssets([...ASSET_DATA]);
  };

  return (
    <div className="text-primary min-h-screen p-4 md:p-8 bg-background font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-wrap justify-between items-center gap-3 p-4 bg-white rounded-xl shadow-lg">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary">Asset Registry</h1>
          <button
          onClick={() => console.log("Refreshing Data...")} // Placeholder for refresh action
          className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-semibold rounded-lg shadow-md transition duration-200"
        >
          <RefreshCw className="h-4 w-4 mr-2"/>
          Refresh Data
        </button>
        </header>

        {/* Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-lg border-t-4 border-gray-400">
            <p className="text-sm font-semibold text-gray-600 uppercase">Total Assets</p>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">{totalAssets}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-lg border-t-4 border-green-500">
            <p className="text-sm font-semibold text-gray-600 uppercase">Active / Deployed</p>
            <p className="text-3xl md:text-4xl font-bold text-green-600 mt-1">{activeAssets}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-lg border-t-4 border-red-500">
            <p className="text-sm font-semibold text-gray-600 uppercase">Vehicles Under Repair</p>
            <p className="text-3xl md:text-4xl font-bold text-red-600 mt-1">{repairVehicles}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-lg border-t-4 border-yellow-500">
            <p className="text-sm font-semibold text-gray-600 uppercase">Assets Unassigned</p>
            <p className="text-3xl md:text-4xl font-bold text-yellow-600 mt-1">{unassignedAssets}</p>
          </div>
        </section>

        {/* Table */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-primary mb-4 border-b border-gray-200 pb-3">Asset Deployment Status</h2>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Location, or Personnel..."
              className="w-full md:w-2/3 p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-sky-500 focus:border-sky-500 transition shadow-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-sky-500 focus:border-sky-500 transition appearance-none cursor-pointer shadow-sm"
            >
              <option value="">Filter by Status (All)</option>
              <option value="Active">🟢 Active</option>
              <option value="Under Repair">🔴 Under Repair</option>
              <option value="Standby">🟡 Standby</option>
            </select>
          </div>

          {/* Table (desktop) */}
          <div className="hidden md:block overflow-x-auto max-h-[60vh] border border-gray-200 rounded-lg">
            {filteredAssets.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr className="text-center">
                    <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase">ID</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase">Type</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase">Category</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase">Capacity / Qty</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase">Location</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase">Personnel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white text-gray-800">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className={`hover:bg-gray-50 transition ${asset.status === "Under Repair" ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-highlight">{asset.id}</td>
                      <td className="px-4 py-3">{asset.type}</td>
                      <td className="px-4 py-3">{asset.category}</td>
                      <td className="px-4 py-3">{asset.capacity}</td>
                      <td className="px-4 py-3">{getStatusBadge(asset.status)}</td>
                      <td className="px-4 py-3 font-semibold">{asset.location}</td>
                      <td className="px-4 py-3">{asset.personnel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center p-6 text-gray-500">No assets match the current filter.</div>
            )}
          </div>

          {/* Card view (mobile) */}
          <div className="md:hidden space-y-4">
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => (
                <div key={asset.id} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-highlight">{asset.id}</h3>
                    {getStatusBadge(asset.status)}
                  </div>
                  <p className="text-left text-sm text-gray-600"><span className="font-semibold">Type:</span> {asset.type}</p>
                  <p className="text-left text-sm text-gray-600"><span className="font-semibold">Category:</span> {asset.category}</p>
                  <p className="text-left text-sm text-gray-600"><span className="font-semibold">Capacity:</span> {asset.capacity}</p>
                  <p className="text-left text-sm text-gray-600"><span className="font-semibold">Location:</span> {asset.location}</p>
                  <p className="text-left text-sm text-gray-600"><span className="font-semibold">Personnel:</span> {asset.personnel}</p>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-gray-500">No assets match the current filter.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

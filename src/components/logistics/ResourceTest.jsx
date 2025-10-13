// src/components/logistics/ResourceTest.jsx
import { useEffect, useState } from "react";
import resourceService from "../../services/resourceService";
import hospitalService from "../../services/hospitalService";

export default function ResourceTest() {
  const [resources, setResources] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch resources and hospitals
        const [resourcesData, hospitalsData] = await Promise.all([
          resourceService.getAll(),
          hospitalService.getAll(),
        ]);

        setResources(resourcesData.data || resourcesData);
        setHospitals(hospitalsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 rounded-lg">
        <h2 className="text-red-600 font-bold text-xl mb-2">Error</h2>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Backend Connection Test</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold">
            ✓ Successfully connected to Laravel backend!
          </p>
        </div>
      </div>

      {/* Hospitals Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Hospitals ({hospitals.length})
        </h2>
        <div className="grid gap-4">
          {hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <h3 className="font-bold text-lg">{hospital.name}</h3>
              <p className="text-gray-600">{hospital.address}</p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-gray-500">
                  📞 {hospital.contact_number}
                </span>
                <span className="text-gray-500">📧 {hospital.email}</span>
                <span className="text-gray-500">
                  🏥 Capacity: {hospital.capacity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Resources ({resources.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Min Stock
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {resource.name}
                    {resource.is_critical && (
                      <span className="ml-2 text-red-500 font-bold">
                        ⚠️ CRITICAL
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">
                    {resource.category}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {resource.quantity} {resource.unit}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {resource.minimum_stock} {resource.unit}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        resource.status === "High"
                          ? "bg-green-100 text-green-800"
                          : resource.status === "Low"
                          ? "bg-yellow-100 text-yellow-800"
                          : resource.status === "Critical"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {resource.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {resource.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold">Total Resources</h3>
          <p className="text-3xl font-bold text-blue-600">{resources.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-semibold">High Stock</h3>
          <p className="text-3xl font-bold text-green-600">
            {resources.filter((r) => r.status === "High").length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Low Stock</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {resources.filter((r) => r.status === "Low").length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Critical/Out</h3>
          <p className="text-3xl font-bold text-red-600">
            {
              resources.filter(
                (r) => r.status === "Critical" || r.status === "Out of Stock"
              ).length
            }
          </p>
        </div>
      </div>
    </div>
  );
}

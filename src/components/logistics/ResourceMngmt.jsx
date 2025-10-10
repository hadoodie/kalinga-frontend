import { useState } from "react";
import { 
  ArchiveRestore, 
  Package, 
  Truck, 
  CircleAlert, 
  ChevronDown, 
  RefreshCw 
} from "lucide-react";

// --- Configuration & Helpers ---

// Map user's colors to clear Tailwind utilities for consistency
const COLORS = {
  primary: "text-gray-800", // Dark text
  highlight: "text-yellow-500", // Accent color
  darkBg: "bg-green-800", // Header background
  darkText: "text-white", // Text on dark background
};

// Helper to get status badge colors
const getStatusClasses = (status) => {
  switch (status) {
    case "Critical":
      return "bg-red-100 text-red-600 border-red-300";
    case "High":
      return "bg-amber-100 text-amber-600 border-amber-300";
    case "Moderate":
    default:
      return "bg-green-100 text-green-600 border-green-300";
  }
};

// --- MOCK DATA ---

// Combine 'All', categories, AND 'Critical Only' into one filter array for better UX
const evacCategories = ["All", "Food & Water", "Hygiene", "Critical Only"];
const medicalCategories = ["All", "Medicine", "First Aid Kit", "Critical Only"];

const inventoryData = [
  { resource: "Rice", category: "Food & Water", received: 50, unit: "kg", distributed: 20, remaining: 30, status: "Critical", facility: "Evacuation Center" },
  { resource: "Canned Goods", category: "Food & Water", received: 100, unit: "cans", distributed: 10, remaining: 90, status: "High", facility: "Evacuation Center" },
  { resource: "Soap", category: "Hygiene", received: 150, unit: "boxes", distributed: 75, remaining: 75, status: "Moderate", facility: "Evacuation Center" },
  { resource: "Bottled Water", category: "Food & Water", received: 500, unit: "bottles", distributed: 200, remaining: 300, status: "High", facility: "Evacuation Center" },
  { resource: "Shampoo", category: "Hygiene", received: 100, unit: "sachets", distributed: 50, remaining: 50, status: "Moderate", facility: "Evacuation Center" },
  { resource: "Conditioner", category: "Hygiene", received: 100, unit: "sachets", distributed: 50, remaining: 50, status: "Moderate", facility: "Evacuation Center" },
  { resource: "Toothpaste", category: "Hygiene", received: 100, unit: "sachets", distributed: 60, remaining: 40, status: "Moderate", facility: "Evacuation Center" },
  { resource: "Toothbrush", category: "Hygiene", received: 300, unit: "packs", distributed: 60, remaining: 240, status: "High", facility: "Evacuation Center" },
  { resource: "Tylenol", category: "Medicine", received: 100, unit: "bottles", distributed: 90, remaining: 10, status: "Critical", facility: "Medical Facility" },
  { resource: "Ibuprofen", category: "Medicine", received: 50, unit: "bottles", distributed: 40, remaining: 10, status: "Critical", facility: "Medical Facility" },
  { resource: "Tempra", category: "Medicine", received: 150, unit: "bottles", distributed: 100, remaining: 50, status: "Moderate", facility: "Medical Facility" },
  { resource: "Bioflu", category: "Medicine", received: 100, unit: "bottles", distributed: 95, remaining: 5, status: "Critical", facility: "Medical Facility" },
  { resource: "Neozep", category: "Medicine", received: 100, unit: "bottles", distributed: 100, remaining: 0, status: "Critical", facility: "Medical Facility" },
  { resource: "Antibiotic", category: "Medicine", received: 100, unit: "bottles", distributed: 40, remaining: 60, status: "Moderate", facility: "Medical Facility" },
  { resource: "Tweezers", category: "First Aid Kit", received: 20, unit: "pieces", distributed: 0, remaining: 20, status: "High", facility: "Medical Facility" },
  { resource: "Triangular Bandage", category: "First Aid Kit", received: 20, unit: "pieces", distributed: 0, remaining: 20, status: "High", facility: "Medical Facility" },
  { resource: "Adhesive Bandage", category: "First Aid Kit", received: 20, unit: "pieces", distributed: 10, remaining: 10, status: "Moderate", facility: "Medical Facility" },
  { resource: "Roller Bandage", category: "First Aid Kit", received: 20, unit: "pieces", distributed: 0, remaining: 20, status: "High", facility: "Medical Facility" },
  { resource: "Betadine", category: "First Aid Kit", received: 50, unit: "bottles", distributed: 50, remaining: 0, status: "Critical", facility: "Medical Facility" },
  { resource: "Band Aid", category: "First Aid Kit", received: 100, unit: "packs", distributed: 65, remaining: 45, status: "Moderate", facility: "Medical Facility" },
];

// --- Sub-Components ---

const StatCard = ({ title, value, icon: Icon, colorClass, bgColor }) => (
  <div className="bg-white rounded-xl flex flex-col items-center justify-center p-4 shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 min-h-[140px] md:min-h-0">
    <div className="flex items-center gap-3">
      <Icon size={40} className={`h-10 w-10 ${colorClass}`} />
      <div className="flex flex-col items-center">
        <div className={`text-4xl font-extrabold ${COLORS.primary}`}>{value}</div>
        <div className={`text-sm text-center ${COLORS.primary} mt-1 font-medium`}>{title}</div>
      </div>
    </div>
  </div>
);


// --- Main Component ---

export default function ResourceMngmt() {
  const [filter, setFilter] = useState("All");
  const [seeAll, setSeeAll] = useState(false);
  const [facility, setFacility] = useState("Evacuation Center");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const categories = facility === "Evacuation Center" ? evacCategories : medicalCategories;

  // --- Filtering Logic ---
  const filteredInventory = inventoryData.filter(item => {
    const facilityMatch = item.facility === facility;

    if (filter === "All") {
      return facilityMatch;
    }

    if (filter === "Critical Only") {
      return facilityMatch && item.status === "Critical";
    }

    // Category filter
    return facilityMatch && item.category === filter;
  });

  // --- Summary Calculations ---
  const criticalCount = filteredInventory.filter(item => item.status === "Critical").length;
  const totalRemaining = filteredInventory.reduce((sum, i) => sum + i.remaining, 0);
  const totalReceived = filteredInventory.reduce((sum, i) => sum + i.received, 0);
  const totalDistributed = filteredInventory.reduce((sum, i) => sum + i.distributed, 0);

  return (
    <div className="flex flex-col min-h-screen gap-6 p-4 md:p-8 bg-background">

      {/* Header and Title */}
      <header className="flex flex-wrap justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">Resource Management</h1>
        <button
          onClick={() => console.log("Refreshing Data...")} // Placeholder for refresh action
          className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-semibold rounded-lg shadow-md transition duration-200"
        >
          <RefreshCw className="h-4 w-4 mr-2"/>
          Refresh Data
        </button>
      </header>

      {/* Overview/Metrics Section */}
      <div className={`transition-all duration-500 ${!seeAll ? "block" : "hidden md:block"}`}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Overview Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Remaining Items"
            value={totalRemaining}
            icon={Package}
            colorClass={COLORS.highlight}
          />
          <StatCard
            title="Distributed Items"
            value={totalDistributed}
            icon={Truck}
            colorClass={COLORS.highlight}
          />
          <StatCard
            title="Received Items"
            value={totalReceived}
            icon={ArchiveRestore}
            colorClass={COLORS.highlight}
          />
          <StatCard
            title="Critical Items"
            value={criticalCount}
            icon={CircleAlert}
            colorClass="text-red-500"
          />
        </div>
      </div>

      {/* Inventory List Section */}
      <div className={`bg-white rounded-xl shadow-xl border border-gray-100 p-4 sm:p-6 flex flex-col flex-1`}>
        {/* Controls: Category Filter, Facility Dropdown, See All Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((btn) => (
              <button
                key={btn}
                onClick={() => setFilter(btn)}
                className={`relative pb-2 font-semibold whitespace-nowrap text-sm md:text-base transition duration-150
                  ${filter === btn ? COLORS.highlight : "text-gray-500 hover:text-gray-800"}`}
              >
                {btn}
                {filter === btn ? (
                  <span className="absolute left-0 bottom-0 w-full h-[3px] bg-yellow-500 rounded-full"></span>
                ) : null}
              </button>
            ))}
          </div>
          
          {/* Actions: Facility and See All */}
          <div className="flex items-center gap-4">
            {/* Facility Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-medium bg-white hover:bg-gray-50 transition shadow-sm"
              >
                {facility}
                <ChevronDown size={20} className={`${dropdownOpen ? 'rotate-180' : 'rotate-0'} transition-transform duration-200 h-5 w-5`} />
              </button>

              {dropdownOpen && (
                <ul
                  className="absolute right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 w-48 overflow-hidden"
                  onBlur={() => setDropdownOpen(false)}
                  tabIndex={0}
                >
                  {["Evacuation Center", "Medical Facility"].map(option => (
                    <li
                      key={option}
                      onClick={() => {
                        setFacility(option);
                        setFilter("All"); // Reset filter on facility change
                        setDropdownOpen(false);
                      }}
                      className={`px-4 py-2 hover:bg-green-100 cursor-pointer text-gray-700 font-medium ${facility === option ? 'bg-green-50' : ''}`}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* See All Toggle Button */}
            <button
              onClick={() => setSeeAll(!seeAll)}
              className="px-4 py-1.5 rounded-lg bg-yellow-500 text-gray-800 font-semibold shadow-md hover:bg-yellow-600 transition text-sm"
            >
              {seeAll ? "Hide Overview" : "Show All"}
            </button>
          </div>
        </div>

        {/* Inventory Table (Desktop View) */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className=" bg-primary text-white rounded-t-xl sticky top-0">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider rounded-tl-xl" style={{ width: '20%' }}>Resource</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ width: '15%' }}>Category</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ width: '10%' }}>Received</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ width: '10%' }}>Distributed</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ width: '15%' }}>Remaining</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider rounded-tr-xl" style={{ width: '15%' }}>Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredInventory.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.resource}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-green-700">{item.received}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-red-700">{item.distributed}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-extrabold text-gray-800">{item.remaining} <span className="text-xs font-normal text-gray-500">({item.unit})</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusClasses(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Footer with Totals */}
            <tfoot>
              <tr className="bg-primary text-white">
                <td className="px-4 py-3 font-bold text-base text-left rounded-bl-xl">TOTALS</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 font-bold text-center">{totalReceived}</td>
                <td className="px-4 py-3 font-bold text-center">{totalDistributed}</td>
                <td className="px-4 py-3 font-bold text-center">{totalRemaining}</td>
                <td className="px-4 py-3 rounded-br-xl"></td>
              </tr>
            </tfoot>
          </table>
          
          {/* No results */}
          {filteredInventory.length === 0 && (
            <p className="text-center text-gray-500 p-8">No inventory items found matching the current filter and facility.</p>
          )}
        </div>

        {/* Inventory Cards (Mobile View) */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredInventory.map((item, index) => (
            <div
              key={`mobile-${index}`}
              className="flex flex-col gap-2 p-4 border border-gray-200 rounded-xl bg-gray-50 shadow-sm hover:bg-white transition"
            >
              <div className="flex justify-between items-start border-b pb-2">
                <div className="text-lg font-extrabold text-gray-800">{item.resource}</div>
                <div className={`py-1 px-3 text-xs font-bold rounded-full border ${getStatusClasses(item.status)}`}>
                  {item.status}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                <span className="font-medium text-gray-500">Category:</span> <span>{item.category}</span>
                <span className="font-medium text-gray-500">Received:</span> <span className="font-medium text-green-700">{item.received}</span>
                <span className="font-medium text-gray-500">Distributed:</span> <span className="font-medium text-red-700">{item.distributed}</span>
                <span className="font-medium text-gray-500">Remaining:</span> <span className="font-bold text-gray-800">{item.remaining} {item.unit}</span>
              </div>
            </div>
          ))}
          
          {/* Mobile Totals Card */}
          {filteredInventory.length > 0 && (
            <div className="flex flex-col gap-2 font-bold text-white bg-green-800 p-4 text-sm rounded-xl mt-3 shadow-lg">
              <div className="text-lg mb-1 border-b border-green-600 pb-2">TOTAL INVENTORY SUMMARY</div>
              <div className="flex justify-between"><span>Total Received:</span> <span>{totalReceived}</span></div>
              <div className="flex justify-between"><span>Total Distributed:</span> <span>{totalDistributed}</span></div>
              <div className="flex justify-between mt-1 pt-1 border-t border-green-600"><span>Total Remaining:</span> <span className="text-yellow-400">{totalRemaining}</span></div>
            </div>
          )}

          {/* No results (Mobile) */}
          {filteredInventory.length === 0 && (
            <p className="text-center text-gray-500 p-8">No inventory items found matching the current filter and facility.</p>
          )}
        </div>
      </div>
    </div>
  );
}

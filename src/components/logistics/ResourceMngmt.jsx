import { useState, useEffect, useMemo } from "react";
import {
  ArchiveRestore,
  Package,
  Truck,
  CircleAlert,
  ChevronDown,
  RefreshCw,
  Calendar,
  List,
} from "lucide-react";
import resourceService from "../../services/resourceService";
import hospitalService from "../../services/hospitalService";
import CalendarView from "./ResourceMngmt/CalendarView";

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
    case "Out of Stock":
      return "bg-red-100 text-red-600 border-red-300";
  }
};

// --- Sub-Components ---

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl flex flex-col items-center justify-center p-4 shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 min-h-[140px] md:min-h-0">
    <div className="flex items-center gap-3">
      <Icon size={40} className={`h-10 w-10 ${colorClass}`} />
      <div className="flex flex-col items-center">
        <div className={`text-4xl font-extrabold ${COLORS.primary}`}>
          {value}
        </div>
        <div
          className={`text-sm text-center ${COLORS.primary} mt-1 font-medium`}
        >
          {title}
        </div>
      </div>
    </div>
  </div>
);

// --- Main Component ---

export default function ResourceMngmt() {
  // MOVE facilityCategories INSIDE the component
  const DEFAULT_CATEGORIES = ["All", "Medicine", "First Aid Kit", "Critical Only"];

  const [categoriesByFacility, setCategoriesByFacility] = useState({
    "Central General Hospital": ["All", "Medicine", "First Aid Kit", "Critical Only"],
    "Emergency Field Hospital": ["All", "Medicine", "First Aid Kit", "Critical Only"],
    "St. Luke's Medical Center": ["All", "Medicine", "First Aid Kit", "Specialized Items", "Critical Only"],
  });

  const [filter, setFilter] = useState("All");
  const [seeAll, setSeeAll] = useState(false);
  const [facility, setFacility] = useState("");
  const [categories, setCategories] = useState(["All", "Critical Only"]); // Default categories
  const [facilities, setFacilities] = useState([]); // Dynamic facilities from hospitals
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editResource, setEditResource] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockResource, setStockResource] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    name: "",
    category: "",
    unit: "",
    quantity: "",
    location: "",
  });
  const [adding, setAdding] = useState(false);
  
  // NEW: Calendar tab state
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'calendar'

  const getCategoriesForFacility = (facilityName) => {
    return categoriesByFacility[facilityName] || DEFAULT_CATEGORIES;
  };

  // Fetch hospitals on component mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalsData = await hospitalService.getAll();
        const facilitiesData = hospitalsData.map(hospital => ({
          id: hospital.id,
          name: hospital.name,
          value: hospital.name,
          location: hospital.location,
          capacity: hospital.capacity,
        }));

        setFacilities(facilitiesData);
        
        const newCategoriesMap = { ...categoriesByFacility };
        facilitiesData.forEach(f => {
          if (!newCategoriesMap[f.name]) {
            newCategoriesMap[f.name] = DEFAULT_CATEGORIES;
          }
        });
        setCategoriesByFacility(newCategoriesMap);

        if (facilitiesData.length > 0) {
          const firstHospital = facilitiesData[0].name;
          setFacility(firstHospital);
          
          const firstCategories = categoriesByFacility[firstHospital] || DEFAULT_CATEGORIES;
          setCategories(firstCategories);
          setNewResource(prev => ({ ...prev, location: firstHospital }));
        }
      } catch (err) {
        console.error("Error fetching hospitals:", err);
        setError("Failed to load hospitals. Please try again.");
      }
    };

    fetchHospitals();
  }, []);

  // Fetch resources from backend
  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { location: facility };

      console.log("Fetching resources with params:", params); // DEBUG

      const data = await resourceService.getAll(params);

      console.log("Fetched resources:", data); // DEBUG

      // Map backend data to the frontend's format
      const mappedData = data.map((item) => ({
        resource: item.name,
        category: item.category,
        received: parseFloat(item.received || 0),
        unit: item.unit,
        distributed: parseFloat(item.distributed || 0),
        remaining: parseFloat(item.quantity || 0),
        status: item.status,
        facility: item.location,
        id: item.id,
      }));

      console.log("Mapped inventory data:", mappedData); // DEBUG

      setInventory(mappedData);

      const cats = Array.from(
        new Set(
          mappedData
            .map(i => i.category)
            .filter(Boolean)
        )
      );
      const ordered = [
        "All",
        ...cats.filter(c => c !== "All" && c !== "Critical Only"),
        "Critical Only",
      ];
      setCategoriesByFacility(prev => ({ ...prev, [facility]: ordered }));
      setCategories(ordered);

    } catch (err) {
        console.error("Error fetching resources:", err);
        setError("Failed to load resources. Please try again.");
    } finally {
        setLoading(false);
    }
  };

    // Fetch resources on component mount and when filters change
    useEffect(() => {
      if (facility) {
        fetchResources();
      }
    }, [facility]); // fetch once per facility; category is filtered client-side

    const filteredInventory = useMemo(() => {
      let list = inventory;
      if (filter === "Critical Only") {
        list = list.filter(i => i.status === "Critical");
      } else if (filter !== "All") {
        list = list.filter(i => i.category === filter);
      }
      return list;
    }, [inventory, filter]);


    const criticalCount = filteredInventory.filter(
      (item) => item.status === "Critical"
    ).length;
    const totalRemaining = filteredInventory.reduce(
      (sum, i) => sum + i.remaining,
      0
    );
    const totalReceived = filteredInventory.reduce(
      (sum, i) => sum + i.received,
      0
    );
    const totalDistributed = filteredInventory.reduce(
      (sum, i) => sum + i.distributed,
      0
    );

  // Handle Add Resource form submit
  const handleAddResource = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await resourceService.create({
        ...newResource,
        location: newResource.location || facility, 
        quantity: newResource.quantity === "" ? 0 : Number(newResource.quantity),
      });

      // If user typed a new category, add it for that facility
      const loc = newResource.location || facility;
      const cat = (newResource.category || "").trim();
      if (cat && cat !== "All" && cat !== "Critical Only") {
        setCategoriesByFacility(prev => {
          const current = prev[loc] || DEFAULT_CATEGORIES;
          if (current.includes(cat)) return prev;

          // Insert before "Critical Only"
          const withoutCritical = current.filter(c => c !== "Critical Only");
          const updated = [...withoutCritical, cat, "Critical Only"];
          const next = { ...prev, [loc]: updated };
          // Also update visible categories if we're on the same facility
          if (loc === facility) setCategories(updated);
          return next;
        });
      }

      setShowAddModal(false);
      setNewResource({
        name: "",
        category: "",
        unit: "",        
        quantity: "",
        location: facility,
      });
      fetchResources(); // Refresh list
    } catch (err) {
      console.error("Failed to add resource:", err);
      alert("Failed to add resource.");
    } finally {
      setAdding(false);
    }
  };

  // Add Stock to each Resource
  const handleAddStock = (item) => {
    setStockResource(item);
    setShowStockModal(true);
    setStockAdjustment('');
  };

  const handleStockAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setAdjusting(true);
    
    const adjustmentValue = Number(stockAdjustment);
    if (adjustmentValue <= 0) {
      alert("Please enter a valid quantity greater than 0.");
      setAdjusting(false);
      return;
    }

    try {
      console.log("Sending stock adjustment:", {
        id: stockResource.id,
        quantity: adjustmentValue,
        type: "add",
        currentQuantity: stockResource.remaining
      });

      await resourceService.adjustStock(stockResource.id, {
        quantity: adjustmentValue,
        type: "add",
        reason: "Manual stock addition",
      });
            
      setShowStockModal(false);
      setStockResource(null);
      setStockAdjustment('');
      fetchResources(); 
        
    } catch (err) {
      console.error("Stock adjustment failed:", err);
      console.error("Error details:", err.response?.data);
      alert("Failed to add stock.");
    } finally {
      setAdjusting(false);
    }
  };

  const handleEditResource = (item) => {
    setEditResource(item);
    setShowEditModal(true);
  };

  const handleUpdateResource = async (e) => {
    e.preventDefault();
    setEditing(true);
    try {
      await resourceService.update(editResource.id, {
        name: editResource.resource,
        category: editResource.category,
        unit: editResource.unit,
        quantity: Number(editResource.remaining),
        location: editResource.facility,
      });

      // Also ensure edited category is added to that facility
      const loc = editResource.facility;
      const cat = (editResource.category || "").trim();
      if (cat && cat !== "All" && cat !== "Critical Only") {
        setCategoriesByFacility(prev => {
          const current = prev[loc] || DEFAULT_CATEGORIES;
          if (current.includes(cat)) return prev;

          const withoutCritical = current.filter(c => c !== "Critical Only");
          const updated = [...withoutCritical, cat, "Critical Only"];
          const next = { ...prev, [loc]: updated };
          if (loc === facility) setCategories(updated);
          return next;
        });
      }

      setShowEditModal(false);
      setEditResource(null);
      fetchResources();
    } catch (err) {
      console.error("Failed to update resource:", err);
      alert("Failed to update resource.");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await resourceService.delete(id);
        fetchResources(); // Refresh list
      } catch (err) {
        console.error("Failed to delete resource:", err);
        alert("Failed to delete resource.");
      }
    }
  };

  // Function to handle facility change and reset filter
  const handleFacilityChange = (newFacility) => {
    setFacility(newFacility);
    setFilter("All"); // Reset filter on facility change
    setCategories(getCategoriesForFacility(newFacility)); 
    setDropdownOpen(false);
  };

  // NEW: Handle calendar event click
  const handleCalendarEventClick = (event) => {
    console.log('Calendar event clicked:', event);
    // You can implement detailed event modal here if needed
  };

  return (
    <div className="flex flex-col min-h-screen gap-6 p-4 md:p-8 bg-background">
      {/* Header and Title */}
      <header className="flex flex-wrap justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
          Resource Management
        </h1>
        <button
          onClick={fetchResources}
          className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-semibold rounded-lg shadow-md transition duration-200"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading resources...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <CircleAlert className="text-red-500 mr-3" size={24} />
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={fetchResources}
                className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content (Show only when not loading and no error) */}
      {!loading && !error && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-white rounded-lg p-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-yellow-500 text-yellow-600 bg-yellow-50 rounded'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
              Inventory Management
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'calendar'
                  ? 'border-yellow-500 text-yellow-600 bg-yellow-50 rounded'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="h-4 w-4" />
              History Calendar
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'inventory' ? (
            <>
              {/* Overview/Metrics Section */}
              <div
                className={`transition-all duration-500 ${
                  seeAll ? "hidden" : "block"
                }`}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Overview
                </h2>
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
              <div
                className={`bg-white rounded-xl shadow-xl border border-gray-100 p-4 sm:p-6 flex flex-col`}
              >
                {/* Controls: Category Filter, Facility Dropdown, See All Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {categories.map((btn) => (
                      <button
                        key={btn}
                        onClick={() => setFilter(btn)}
                        className={`relative pb-2 font-semibold whitespace-nowrap text-sm md:text-base transition duration-150
                          ${
                            filter === btn
                              ? COLORS.highlight
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                      >
                        {btn}
                        {filter === btn ? (
                          <span className="absolute left-0 bottom-0 w-full h-[3px] bg-yellow-500 rounded-full"></span>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  {/* Actions: Facility, Add Resources, and See All */}
                  <div className="flex items-center gap-4">
                    {/* Facility Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center justify-center gap-1 text-gray-700 px-2 py-1 rounded-lg bg-white hover:bg-gray-50 transition shadow-sm"
                      >
                        {facility}
                        <ChevronDown
                          size={20}
                          className={`${
                            dropdownOpen ? "rotate-180" : "rotate-0"
                          } transition-transform duration-200 h-5 w-5`}
                        />
                      </button>

                      {dropdownOpen && (
                        <ul
                          className="absolute right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 w-48 overflow-hidden max-h-60 overflow-y-auto"
                          onBlur={() => setDropdownOpen(false)}
                          tabIndex={0}
                        >
                          {facilities.map((option) => (
                            <li
                              key={option.id}
                              onClick={() => handleFacilityChange(option.name)}
                              className={`px-4 py-2 hover:bg-green-100 cursor-pointer text-gray-700 font-medium ${
                                facility === option.name ? "bg-green-50" : ""
                              }`}
                            >
                              {option.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Add Resource Button */}
                    <button
                      className="px-2 py-1.5 rounded-lg text-gray-800 font-semibold shadow-md hover:bg-yellow-600 transition text-sm"
                      onClick={() => setShowAddModal(true)} 
                    >
                      + Add Resource
                    </button>

                    {/* See All Toggle Button */}
                    <button
                      onClick={() => setSeeAll(!seeAll)}
                      className="px-2 py-1 rounded-lg bg-yellow-500 text-gray-800 font-semibold shadow-md hover:bg-yellow-600 transition text-sm"
                    >
                      {seeAll ? "Hide Overview" : "Show All"}
                    </button>
                  </div>
                </div>

                {/* Inventory Table (Desktop View) */}
                <div className="hidden md:block overflow-x-auto flex-1">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-primary text-white rounded-t-xl sticky top-0">
                      <tr>
                        <th
                          className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider rounded-tl-xl"
                          style={{ width: "20%" }}
                        >
                          Resource
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider"
                          style={{ width: "15%" }}
                        >
                          Category
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider"
                          style={{ width: "10%" }}
                        >
                          Received
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider"
                          style={{ width: "10%" }}
                        >
                          Distributed
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider"
                          style={{ width: "15%" }}
                        >
                          Quantity
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider"
                          style={{ width: "15%" }}
                        >
                          Status
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider rounded-tr-xl"
                          style={{ width: "15%" }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredInventory.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition duration-150"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.resource}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-green-700">
                            {item.received}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-red-700">
                            {item.distributed}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-extrabold text-gray-800">
                            {item.remaining}{" "}
                            <span className="text-xs font-normal text-gray-500">
                              ({item.unit})
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusClasses(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
                            <div className="inline-flex gap-2">
                              <button
                                className="px-3 py-1 rounded-lg text-gray-800 font-semibold hover:bg-gray-200 text-xs"
                                onClick={() => handleAddStock(item)}
                                title="Add Stock"
                                type="button"
                              >
                                Add
                              </button>
                              <button
                                className="px-3 py-1 rounded-lg text-gray-800 font-semibold  hover:bg-gray-200 text-xs font-semibold"
                                onClick={() => handleEditResource(item)}
                                title="Edit"
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="px-3 py-1 rounded-lg text-gray-800 font-semibold  hover:bg-red-600 text-xs font-semibold"
                                onClick={() => handleDeleteResource(item.id)}
                                title="Delete"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Table Footer with Totals */}
                    <tfoot>
                      <tr className="bg-primary text-white">
                        <td className="px-4 py-3 font-bold text-base text-left rounded-bl-xl">
                          TOTALS
                        </td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 font-bold text-center">
                          {totalReceived}
                        </td>
                        <td className="px-4 py-3 font-bold text-center">
                          {totalDistributed}
                        </td>
                        <td className="px-4 py-3 font-bold text-center">
                          {totalRemaining}
                        </td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 rounded-br-xl"></td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* No results */}
                  {filteredInventory.length === 0 && (
                    <p className="text-center text-gray-500 p-8">
                      No inventory items found matching the current filter and
                      facility.
                    </p>
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
                        <div className="text-lg font-extrabold text-gray-800">
                          {item.resource}
                        </div>
                        <div
                          className={`py-1 px-3 text-xs font-bold rounded-full border ${getStatusClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                        <span className="font-medium text-gray-500">Category:</span>{" "}
                        <span>{item.category}</span>
                        <span className="font-medium text-gray-500">Received:</span>{" "}
                        <span className="font-medium text-green-700">
                          {item.received}
                        </span>
                        <span className="font-medium text-gray-500">
                          Distributed:
                        </span>{" "}
                        <span className="font-medium text-red-700">
                          {item.distributed}
                        </span>
                        <span className="font-medium text-gray-500">
                          Quantity:
                        </span>{" "}
                        <span className="font-bold text-gray-800">
                          {item.remaining} {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Mobile Totals Card */}
                  {filteredInventory.length > 0 && (
                    <div className="flex flex-col gap-2 font-bold text-white bg-green-800 p-4 text-sm rounded-xl mt-3 shadow-lg">
                      <div className="text-lg mb-1 border-b border-green-600 pb-2">
                        TOTAL INVENTORY SUMMARY
                      </div>
                      <div className="flex justify-between">
                        <span>Total Received:</span> <span>{totalReceived}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Distributed:</span>{" "}
                        <span>{totalDistributed}</span>
                      </div>
                      <div className="flex justify-between mt-1 pt-1 border-t border-green-600">
                        <span>Total Quantity:</span>{" "}
                        <span className="text-yellow-400">
                          {totalRemaining}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* No results (Mobile) */}
                  {filteredInventory.length === 0 && (
                    <p className="text-center text-gray-500 p-8">
                      No inventory items found matching the current filter and
                      facility.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Calendar View
            <CalendarView 
              facility={facility}
              onEventClick={handleCalendarEventClick}
            />
          )}

          {/* Modals (Keep these outside the tab content so they work in both tabs) */}
          {showAddModal && (
            <div className="fixed inset-0 bg-none bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
              <form
                onSubmit={handleAddResource}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4"
              >
                <h2 className="text-xl font-bold mb-2">Add Resource</h2>
                {/* Facility Select */}                
                <select
                  className="border rounded-lg px-3 py-2"
                  value={newResource.location}
                  onChange={e => setNewResource({ ...newResource, location: e.target.value })}
                  required
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.name}>
                      {fac.name}
                    </option>
                  ))}
                </select>                     
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Resource Name"
                  value={newResource.name}
                  onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                  required
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Category"
                  value={newResource.category}
                  onChange={e => setNewResource({ ...newResource, category: e.target.value })}
                  required
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Unit (e.g. pcs, box)"
                  value={newResource.unit}
                  onChange={e => setNewResource({ ...newResource, unit: e.target.value })}
                  required
                  />                     
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Quantity"
                  type="number"
                  value={newResource.quantity}
                  onChange={e => setNewResource({ ...newResource, quantity: e.target.value })}
                  required
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-gray-300 rounded"
                    onClick={() => setShowAddModal(false)}
                    disabled={adding}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-yellow-500 rounded"
                    disabled={adding}
                  >
                    {adding ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showStockModal && stockResource && (
            <div className="fixed inset-0 bg-none bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
              <form
                onSubmit={handleStockAdjustmentSubmit}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4"
              >
                <h2 className="text-xl font-bold mb-2">Add Stock to {stockResource.resource}</h2>
                
                <p className="text-sm text-gray-600">Current Quantity: <span className="font-bold text-green-700">{stockResource.remaining} {stockResource.unit}</span></p>

                <input
                  className="border rounded px-3 py-2"
                  placeholder="Quantity to Add"
                  type="number"
                  min="1"
                  value={stockAdjustment}
                  onChange={e => setStockAdjustment(e.target.value)}
                  required
                  disabled={adjusting}
                />

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-2 py-1.5 bg-gray-300 rounded"
                    onClick={() => setShowStockModal(false)}
                    disabled={adjusting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={adjusting}
                  >
                    {adjusting ? "Adding..." : "Confirm Add"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showEditModal && editResource && (
            <div className="fixed inset-0 bg-none bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
              <form
                onSubmit={handleUpdateResource}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4"
              >
                <h2 className="text-xl font-bold mb-2">Edit Resource</h2>
                <select
                  className="border rounded-lg px-3 py-2"
                  value={editResource.facility}
                  onChange={e => setEditResource({ ...editResource, facility: e.target.value })}
                  required
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.name}>
                      {fac.name}
                    </option>
                  ))}
                </select>
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Resource Name"
                  value={editResource.resource}
                  onChange={e => setEditResource({ ...editResource, resource: e.target.value })}
                  required
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Category"
                  value={editResource.category}
                  onChange={e => setEditResource({ ...editResource, category: e.target.value })}
                  required
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Unit (e.g. pcs, box)"
                  value={editResource.unit}
                  onChange={e => setEditResource({ ...editResource, unit: e.target.value })}
                  required
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Quantity"
                  type="number"
                  value={editResource.remaining}
                  onChange={e => setEditResource({ ...editResource, remaining: e.target.value })}
                  required
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-gray-300 rounded"
                    onClick={() => setShowEditModal(false)}
                    disabled={editing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-yellow-500 rounded"
                    disabled={editing}
                  >
                    {editing ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
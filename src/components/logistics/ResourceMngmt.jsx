import { useState, useEffect } from "react";
import {
  ArchiveRestore,
  Package,
  Truck,
  CircleAlert,
  ChevronDown,
} from "lucide-react";
import resourceService from "../../services/resourceService";

export default function ResourceMngmt() {
  const [filter, setFilter] = useState("All");
  const [seeAll, setSeeAll] = useState(false);
  const evacCategories = ["All", "Food & Water", "Hygiene"];
  const medicalCategories = ["All", "Medicine", "First Aid Kit"];
  const [facility, setFacility] = useState("Evacuation Center");
  const categories =
    facility === "Evacuation Center" ? evacCategories : medicalCategories;
  const [open, setOpen] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch resources from backend
  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        facility: facility,
      };

      // Add category filter if not "All"
      if (filter !== "All" && filter !== "Critical") {
        params.category = filter;
      }

      // Add status filter for Critical
      if (filter === "Critical") {
        params.status = "Critical";
      }

      const data = await resourceService.getAll(params);

      // Map backend data to frontend format
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

      setInventory(mappedData);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError("Failed to load resources. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources on component mount and when filters change
  useEffect(() => {
    fetchResources();
  }, [facility, filter]);

  const filteredInventory = inventory.filter((item) => {
    const categoryMatch =
      filter === "All"
        ? true
        : filter === "Critical"
        ? item.status === "Critical"
        : item.category === filter;

    const facilityMatch =
      item.facility === facility || item.facility.includes(facility);
    return categoryMatch && facilityMatch;
  });

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

  return (
    <div className="grid grid-rows-[auto_1fr] w-full min-h-screen gap-5 p-4 sm:p-6 lg:p-4 font-sans pb-20">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-3 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
          Resource Management
        </h1>
        <button
          onClick={fetchResources}
          className="px-4 py-2 bg-highlight hover:bg-yellow-500 text-white font-medium rounded-lg shadow-lg transition duration-200"
        >
          Refresh Data
        </button>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
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

      {!seeAll && !loading && !error && (
        <div className="bg-[#1A4718] rounded-xl p-4 flex flex-col gap-5 shadow-xl border border-gray-100 hover:shadow-2xl transition duration-300">
          <h2 className="text-white text-xl font-bold">Overview</h2>
          <div className="grid grid-cols-4 gap-5 md:gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            <div className="bg-[#163a14] rounded-lg min-h-[130px] flex items-center justify-center p-3">
              <div className="flex flex-row lg:items-center md:items-center sm:items-center lg:gap-4 md:gap-2 sm:gap-1">
                <Package
                  size={90}
                  color="#f0d003"
                  className="lg:size-[90px] sm:size-[58px] md:size-[60px]"
                />
                <div className="flex flex-col items-center">
                  <div className="lg:text-[30px] text-white font-bold sm:text-[20px] md:text-[25px]">
                    {totalRemaining}
                  </div>
                  <div className="lg:text-[15px] md:text-[13px] text-center sm:text text-white">
                    Remaining Items
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#163a14] rounded-lg min-h-[130px] flex items-center justify-center p-3">
              <div className="flex flex-row lg:items-center md:items-center sm:items-center lg:gap-4 md:gap-2 sm:gap-1">
                <Truck
                  size={90}
                  color="#f0d003"
                  className="lg:size-[90px] sm:size-[50px] md:size-[60px]"
                />
                <div className="flex flex-col items-center">
                  <div className="lg:text-[30px] text-white font-bold sm:text-[20px] md:text-[25px]">
                    {totalDistributed}
                  </div>
                  <div className="lg:text-[15px] md:text-[13px] text-center sm:text text-white">
                    Distributed Items
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#163a14] rounded-lg min-h-[130px] flex items-center justify-center p-3">
              <div className="flex flex-row lg:items-center md:items-center sm:items-center lg:gap-4 md:gap-2 sm:gap-1">
                <ArchiveRestore
                  size={90}
                  color="#f0d003"
                  className="lg:size-[90px] sm:size-[50px] md:size-[60px]"
                />
                <div className="flex flex-col items-center">
                  <div className="lg:text-[30px] text-white font-bold sm:text-[20px] md:text-[25px]">
                    {totalReceived}
                  </div>
                  <div className="lg:text-[15px] md:text-[13px] text-center sm:text text-white">
                    Received Items
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#163a14] rounded-lg min-h-[130px] flex items-center justify-center p-3">
              <div className="flex flex-row lg:items-center md:items-center sm:items-center lg:gap-4 md:gap-2 sm:gap-1">
                <CircleAlert
                  size={90}
                  color="#f0d003"
                  className="lg:size-[90px] sm:size-[50px] md:size-[60px]"
                />
                <div className="flex flex-col items-center">
                  <div className="lg:text-[30px] text-white font-bold sm:text-[20px] md:text-[25px]">
                    {criticalCount}
                  </div>
                  <div className="lg:text-[15px] md:text-[13px] text-center sm:text-sm text-white">
                    Critical Items
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div
          className={`bg-white rounded-xl shadow-xl border border-gray-100 hover:shadow-2xl transition duration-300 p-4 sm:p-6 flex flex-col mb-6 ${
            seeAll ? "" : ""
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 md:flex-row md:items-center md:mb-2 gap-4">
            <div className="flex lg:flex-row sm:flex-col md:flex-row gap-x-4 gap-y-2">
              {categories.map((btn) => (
                <button
                  key={btn}
                  onClick={() => setFilter(btn === "All" ? "All" : btn)}
                  className={`relative pb-2 font-bold whitespace-nowrap
                  ${
                    filter === btn ? "text-[#f0d003]" : "text-black"
                  } lg:text-[15px] md:text-[14px] sm:text-[12px]`}
                >
                  {btn === "All" ? "All Resources" : btn}
                  {filter === btn ? (
                    <span className="absolute left-0 bottom-0 w-full h-[3px] bg-[#f0d003] rounded-full"></span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="flex lg:flex-row sm:flex-col md:flex-row items-center gap-4">
              <div className="relative inline-block">
                <button
                  onClick={() => setOpen(!open)}
                  className="border border-black text-black lg:text-[15px] sm:text-[10px]  px-3 py-1 rounded-lg font-medium"
                >
                  <div className="flex flex-row items-center justify-center gap-1">
                    {facility}
                    <ChevronDown
                      size={20}
                      className={`${
                        open ? "rotate-180" : "rotate-0"
                      } transition-transform duration-200`}
                    />
                  </div>
                </button>

                {open && (
                  <ul
                    className="
                    absolute right-0 sm:left-0 mt-2
                    bg-white rounded-lg shadow-xl border lg:text-[15px] sm:text-[13px] border-gray-200
                    z-10 w-48
                  "
                  >
                    <li
                      onClick={() => {
                        setFacility("Evacuation Center");
                        setOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-[#77905b] hover:text-white cursor-pointer rounded-t-lg"
                    >
                      Evacuation Center
                    </li>
                    <li
                      onClick={() => {
                        setFacility("Medical Facility");
                        setOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-[#77905b] hover:text-white cursor-pointer rounded-b-lg"
                    >
                      Medical Facility
                    </li>
                  </ul>
                )}
              </div>

              <button
                onClick={() => setSeeAll(!seeAll)}
                className="px-3 py-1 rounded-lg bg-[#f0d003] lg:text-[15px] sm:text-[13px]  font-medium text-black shadow-md hover:bg-yellow-400 transition"
              >
                {seeAll ? "See Less" : "See All"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-white rounded-xl overflow-x-auto">
            <div className="hidden md:grid grid-cols-7 gap-0 font-bold text-white bg-[#1A4718] p-3 mt-4 text-center text-xs md:text-xs rounded-t-xl">
              <p>Resource</p>
              <p>Category</p>
              <p>Received</p>
              <p>Distributed</p>
              <p>Remaining</p>
              <p>Unit</p>
              <p>Status</p>
            </div>

            {filteredInventory.map((item, index) => (
              <>
                <div
                  key={index}
                  className="hidden md:grid grid-cols-7 gap-2 text-sm md:text-sm text-center border-b border-yellow-300 py-3 items-center"
                >
                  <p>{item.resource}</p>
                  <p className="text-gray-600">{item.category}</p>
                  <p className="font-medium">{item.received}</p>
                  <p className="font-medium">{item.distributed}</p>
                  <p className="font-bold">{item.remaining}</p>
                  <p className="text-xs text-gray-500">{item.unit}</p>
                  <p
                    className={`font-bold py-1 px-2 rounded-full text-xs mx-auto w-fit ${
                      item.status === "Critical"
                        ? "bg-red-100 text-red-600"
                        : item.status === "High"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {item.status}
                  </p>
                </div>
                <div
                  key={`mobile-${index}`}
                  className="md:hidden flex flex-col gap-2 p-3 border-b border-gray-100 last:border-b-0 rounded-lg bg-white hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-lg font-extrabold text-[#1A4718]">
                      {item.resource}
                    </div>
                    <div
                      className={`py-1 px-3 text-xs font-bold rounded-full text-white ${
                        item.status === "Critical"
                          ? "bg-red-600"
                          : item.status === "High"
                          ? "bg-green-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      {item.status}
                    </div>
                  </div>
                  <div className="flex flex-col gap-y-1 text-sm text-gray-700">
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="font-medium text-gray-500">
                        Category:
                      </span>{" "}
                      <span>{item.category}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="font-medium text-gray-500">
                        Received:
                      </span>{" "}
                      <span className="text-green-700">{item.received}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                      <span className="font-medium text-gray-500">
                        Distributed:
                      </span>{" "}
                      <span className="text-red-700">{item.distributed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-500">
                        Remaining:
                      </span>{" "}
                      <span className="font-bold">
                        {item.remaining} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ))}

            {filteredInventory.length > 0 && (
              <>
                <div className="hidden md:grid grid-cols-7 gap-2 font-bold text-white bg-[#1A4718] p-3 text-center text-xs md:text-sm rounded-b-xl mt-2">
                  <p className="text-center">TOTAL</p>
                  <p></p>
                  <p>{totalReceived}</p>
                  <p>{totalDistributed}</p>
                  <p>{totalRemaining}</p>
                  <p></p>
                  <p></p>
                </div>

                <div className="md:hidden flex flex-col gap-2 font-bold text-white bg-[#1A4718] p-4 text-sm rounded-lg mt-3 shadow-lg">
                  <div className="text-lg mb-1 border-b border-[#3c6b39] pb-2">
                    TOTAL INVENTORY SUMMARY
                  </div>
                  <div className="flex justify-between border-b border-[#3c6b39] pb-1">
                    <span>Total Received:</span> <span>{totalReceived}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#3c6b39] pb-1">
                    <span>Total Distributed:</span>{" "}
                    <span>{totalDistributed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Remaining:</span> <span>{totalRemaining}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

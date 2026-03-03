import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";

// --- Icons & Constants ---
const DOWNLOAD_ICON_SVG = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 md:h-6 md:w-6 text-green-50 group-hover:text-white transition"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="12" y1="12" x2="12" y2="18"></line>
    <polyline points="9 15 12 18 15 15"></polyline>
  </svg>
);

// Mock data for triage history 
const triageHistory = [
  {
    id: "RM023271",
    date: "2024-11-20",
    temp: 38.1,
    hr: 66,
    spo2: 85,
    complaint: "Difficulty breathing",
    mental: "A (Alert)",
    level: "medium",
    doctor: "Pulmonologist"
  },
  {
    id: "RM023271",
    date: "2024-11-15",
    temp: 37.8,
    hr: 64,
    spo2: 99,
    complaint: "Dizziness",
    mental: "A (Alert)",
    level: "medium",
    doctor: "Neurologist"
  },
  {
    id: "RM023271",
    date: "2024-11-10",
    temp: 39.1,
    hr: 103,
    spo2: 86,
    complaint: "Chest pain",
    mental: "V (Verbal)",
    level: "medium",
    doctor: "Cardiologist"
  },
  {
    id: "RM023271",
    date: "2024-11-05",
    temp: 37.5,
    hr: 74,
    spo2: 90,
    complaint: "Chest pain",
    mental: "P (Pain)",
    level: "medium",
    doctor: "Cardiologist"
  }
];

const TABS = {
  TRIAGE: "Triage History",
  LAB: "Lab Results"
};

export default function HealthRecords() {
  const location = useLocation();
  
  // Read tab from query string
  function getTabFromQuery() {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && tab.toLowerCase() === "lab") return TABS.LAB;
    if (tab && tab.toLowerCase() === "triage") return TABS.TRIAGE;
    return TABS.TRIAGE;
  }
  const [activeTab, setActiveTab] = useState(getTabFromQuery());

  // Update tab if URL changes
  useEffect(() => {
    setActiveTab(getTabFromQuery());
    // eslint-disable-next-line
  }, [location.search]);

  // Lab results state and filter/sort
  const [labResults, setLabResults] = useState([]);
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2025-07-10");
  const [sortBy, setSortBy] = useState("Descending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // For triage filtering
  const [triageDateFrom, setTriageDateFrom] = useState("2024-01-01");
  const [triageDateTo, setTriageDateTo] = useState("2025-07-10");
  const [triageSortBy, setTriageSortBy] = useState("Descending");
  
  // Pagination for triage
  const [triagePage, setTriagePage] = useState(1);
  const TRIAGE_PAGE_SIZE = 10;
  
  // Pagination for lab results
  const [labPage, setLabPage] = useState(1);
  const LAB_PAGE_SIZE = 10;

  useEffect(() => {
    if (activeTab !== TABS.LAB) return;
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/lab-results', {
          params: {
            date_from: dateFrom,
            date_to: dateTo,
            sort_by: sortBy,
          }
        });
        setLabResults(response.data);
      } catch (err) {
        // Fallback for demo purposes if API fails
        setError("Failed to fetch lab results. Please try again later.");
        // Remove this mock setLabResults in production if strictly using API
        setLabResults([
           { lab_no: "L001", branch: "Main", order_date: "2024-11-20", patient_id_text: "RM023271", account: "Self", type: "Blood" },
           { lab_no: "L002", branch: "North", order_date: "2024-11-15", patient_id_text: "RM023271", account: "HMO", type: "Urinalysis" }
        ]); 
        setError(null); // Clear error for demo visuals
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [activeTab, dateFrom, dateTo, sortBy]);

  // Handle Download Logic
  const handleDownload = (labNo) => {
    console.log(`Downloading result file for Lab No: ${labNo}`);
    // Add API call or download logic here
  };

  // Filter and sort triage data by date
  const filteredTriage = triageHistory
    .filter(item => {
      const d = new Date(item.date);
      return d >= new Date(triageDateFrom) && d <= new Date(triageDateTo);
    })
    .sort((a, b) => {
      if (triageSortBy === "Descending") {
        return new Date(b.date) - new Date(a.date);
      } else {
        return new Date(a.date) - new Date(b.date);
      }
    });

  // Paginated triage data
  const triageTotalPages = Math.ceil(filteredTriage.length / TRIAGE_PAGE_SIZE);
  const paginatedTriage = filteredTriage.slice((triagePage - 1) * TRIAGE_PAGE_SIZE, triagePage * TRIAGE_PAGE_SIZE);

  // Reusable Page Indicator
  const PageIndicator = ({ number, isCurrent, onClick }) => (
    <button
      onClick={() => onClick(number)}
      className={`h-8 w-8 rounded font-bold transition flex items-center justify-center ${
        isCurrent
          ? 'bg-green-700 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {number}
    </button>
  );

  // Paginated lab results
  const labTotalPages = Math.ceil(labResults.length / LAB_PAGE_SIZE);
  const paginatedLabResults = labResults.slice((labPage - 1) * LAB_PAGE_SIZE, labPage * LAB_PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8">
      <header className="mb-4 md:mb-6 p-2 md:p-4">
        <h1 className="text-2xl md:text-4xl font-extrabold text-primary text-left">
          My Health Records
        </h1>
      </header>

      {/* Tab Navigation */}
      <div className="flex space-x-4 md:space-x-8 border-b border-gray-300 sticky top-0 z-20 overflow-x-auto overflow-y-hidden bg-gray-50 px-2 md:px-4 no-scrollbar">
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              py-3
              text-sm md:text-base whitespace-nowrap transition-all duration-300
              border-b-4 -mb-[1px]
              ${
                activeTab === tab
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 font-medium hover:text-primary'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <section className="bg-white p-3 md:p-6 rounded-xl shadow-lg border border-gray-100 mt-4">
        {activeTab === TABS.TRIAGE && (
          <div>
            {/* Filter Bar */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col text-left">
                  <label className="text-sm font-semibold mb-1 text-primary">Date From:</label>
                  <input 
                    type="date" 
                    value={triageDateFrom} 
                    onChange={e => { setTriageDateFrom(e.target.value); setTriagePage(1); }} 
                    className="w-full p-2.5 rounded-lg text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-green-700 outline-none transition" 
                  />
                </div>
                <div className="flex flex-col text-left">
                  <label className="text-sm font-semibold mb-1 text-primary">Date To:</label>
                  <input 
                    type="date" 
                    value={triageDateTo} 
                    onChange={e => { setTriageDateTo(e.target.value); setTriagePage(1); }} 
                    className="w-full p-2.5 rounded-lg text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-green-700 outline-none transition" 
                  />
                </div>
                <div className="flex flex-col text-left">
                  <label className="text-sm font-semibold mb-1 text-primary">Sort By</label>
                  <select 
                    value={triageSortBy} 
                    onChange={e => { setTriageSortBy(e.target.value); setTriagePage(1); }} 
                    className="w-full p-2.5 rounded-lg text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-green-700 outline-none transition"
                  >
                    <option value="Descending">Latest</option>
                    <option value="Ascending">Oldest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* --- MOBILE VIEW: Cards --- */}
            <div className="md:hidden space-y-4">
                {paginatedTriage.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white">
                        <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-2">
                            <div>
                                <span className="block text-xs text-gray-500">Date</span>
                                <span className="font-semibold text-gray-800">{item.date}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-gray-500">Patient ID</span>
                                <span className="font-bold text-green-700">{item.id}</span>
                            </div>
                        </div>
                        
                        {/* Vitals Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 p-2 rounded">
                            <div className="text-center">
                                <span className="block text-xs text-gray-500">Temp</span>
                                <span className="font-medium text-gray-900">{item.temp}°C</span>
                            </div>
                            <div className="text-center border-l border-gray-200">
                                <span className="block text-xs text-gray-500">HR</span>
                                <span className="font-medium text-gray-900">{item.hr}</span>
                            </div>
                            <div className="text-center border-l border-gray-200">
                                <span className="block text-xs text-gray-500">SpO₂</span>
                                <span className="font-medium text-gray-900">{item.spo2}%</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Complaint:</span>
                                <span className="font-medium text-right">{item.complaint}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mental:</span>
                                <span>{item.mental}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Level:</span>
                                <span className="capitalize px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">{item.level}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="text-gray-500 text-xs">Doctor</span>
                                <span className="font-semibold text-primary">{item.doctor}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- DESKTOP VIEW: Table --- */}
            <div className="hidden md:block overflow-x-auto overflow-y-hidden rounded-xl border border-gray-200">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="px-4 py-3 text-center">Patient ID</th>
                    <th className="px-4 py-3 text-center">Date</th>
                    <th className="px-4 py-3 text-center">Temp</th>
                    <th className="px-4 py-3 text-center">HR</th>
                    <th className="px-4 py-3 text-center">SpO₂</th>
                    <th className="px-4 py-3 text-center">Complaint</th>
                    <th className="px-4 py-3 text-center">Mental</th>
                    <th className="px-4 py-3 text-center">Level</th>
                    <th className="px-4 py-3 text-center">Doctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTriage.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-green-700">{item.id}</td>
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">{item.temp}</td>
                      <td className="px-4 py-3">{item.hr}</td>
                      <td className="px-4 py-3">{item.spo2}</td>
                      <td className="px-4 py-3">{item.complaint}</td>
                      <td className="px-4 py-3">{item.mental}</td>
                      <td className="px-4 py-3 capitalize">{item.level}</td>
                      <td className="px-4 py-3">{item.doctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {(triageTotalPages > 1 || filteredTriage.length > 0) && (
              <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 mt-6">
                 <span className="text-xs text-gray-500">
                    Showing {paginatedTriage.length} of {filteredTriage.length} records
                  </span>
                {triageTotalPages > 1 && (
                    <div className="flex gap-2">
                         {Array.from({ length: triageTotalPages }, (_, i) => i + 1).map(pageNumber => (
                            <PageIndicator key={pageNumber} number={pageNumber} isCurrent={triagePage === pageNumber} onClick={setTriagePage} />
                        ))}
                    </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === TABS.LAB && (
          <div>
            {/* Filter Bar */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col text-left">
                  <label className="text-sm font-semibold mb-1 text-primary">Order Date From:</label>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setLabPage(1); }} className="w-full p-2.5 rounded-lg text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-green-700 outline-none transition" />
                </div>
                <div className="flex flex-col text-left">
                  <label className="text-sm font-semibold mb-1 text-primary">Order Date To:</label>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setLabPage(1); }} className="w-full p-2.5 rounded-lg text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-green-700 outline-none transition" />
                </div>
                <div className="flex flex-col text-left">
                  <label className="text-sm font-semibold mb-1 text-primary">Sort By</label>
                  <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setLabPage(1); }} className="w-full p-2.5 rounded-lg text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-green-700 outline-none transition">
                    <option value="Descending">Latest</option>
                    <option value="Ascending">Oldest</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              {isLoading ? (
                <div className="py-12 text-center text-gray-500 font-medium animate-pulse">Loading results...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-500 font-medium bg-red-50 rounded-lg">{error}</div>
              ) : labResults.length > 0 ? (
                <>
                  {/* --- MOBILE VIEW: Cards --- */}
                  <div className="md:hidden space-y-4">
                    {paginatedLabResults.map((result, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:border-green-200 transition relative">
                             {/* Floating Download Button on Mobile Card */}
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={() => handleDownload(result.lab_no)}
                                    className="group p-2 rounded-full bg-green-800 hover:bg-primary transition shadow-md shrink-0 flex items-center justify-center"
                                    title="Download Result"
                                >
                                    {DOWNLOAD_ICON_SVG}
                                </button>
                            </div>

                            <div className="flex justify-between items-center mb-3 pr-12"> {/* pr-12 to avoid overlap with button */}
                                <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                    {result.type}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(result.order_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div>
                                    <span className="block text-xs text-gray-500">Lab No.</span>
                                    <span className="font-medium">{result.lab_no}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-500">Branch</span>
                                    <span className="font-medium">{result.branch}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500">Patient ID</span>
                                    <span className="font-medium">{result.patient_id_text}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-500">Account</span>
                                    <span className="font-medium">{result.account}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>

                  {/* --- DESKTOP VIEW: Table --- */}
                  <div className="hidden md:block overflow-x-auto overflow-y-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full table-auto text-sm">
                      <thead className="bg-primary text-white">
                        <tr>
                          <th className="px-4 py-3 text-center">Lab No.</th>
                          <th className="px-4 py-3 text-center">Branch</th>
                          <th className="px-4 py-3 text-center">Order Date</th>
                          <th className="px-4 py-3 text-center">Patient ID</th>
                          <th className="px-4 py-3 text-center">Account</th>
                          <th className="px-4 py-3 text-center">Type</th>
                          <th className="px-4 py-3 text-center">Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedLabResults.map((result, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium text-green-700">{result.lab_no}</td>
                            <td className="px-4 py-3">{result.branch}</td>
                            <td className="px-4 py-3">{new Date(result.order_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                            <td className="px-4 py-3">{result.patient_id_text}</td>
                            <td className="px-4 py-3">{result.account}</td>
                            <td className="px-4 py-3">
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                    {result.type}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                                <button
                                    onClick={() => handleDownload(result.lab_no)}
                                    className="group p-2 rounded-full bg-green-700 hover:bg-green-800 transition inline-flex items-center justify-center shadow-sm"
                                    title="Download Result"
                                >
                                    {DOWNLOAD_ICON_SVG}
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {(labTotalPages > 1 || labResults.length > 0) && (
                    <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 mt-6">
                        <span className="text-xs text-gray-500">
                            Showing {paginatedLabResults.length} of {labResults.length} records
                        </span>
                      {labTotalPages > 1 && (
                        <div className="flex gap-2">
                            {Array.from({ length: labTotalPages }, (_, i) => i + 1).map(pageNumber => (
                                <PageIndicator key={pageNumber} number={pageNumber} isCurrent={labPage === pageNumber} onClick={setLabPage} />
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-gray-500 font-medium bg-gray-50 rounded-lg">No results found.</div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
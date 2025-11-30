import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";

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
        setError("Failed to fetch lab results. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [activeTab, dateFrom, dateTo, sortBy]);

  const handleGoClick = () => {
    // Triggers useEffect
    setLabResults([]);
  };

  // For Triage: add a state to trigger re-render on button click
  const [triageShowResultsKey, setTriageShowResultsKey] = useState(0);
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

  // Dashboard-style page indicator for triage
  const TriagePageIndicator = ({ number, isCurrent }) => (
    <button
      onClick={() => setTriagePage(number)}
      className={`h-8 w-8 rounded font-bold transition ${
        isCurrent
          ? 'bg-green-700 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {number}
    </button>
  );
  const TriagePagination = () => (
    <div className="flex justify-center items-center gap-2 mt-4">
      {Array.from({ length: triageTotalPages }, (_, i) => i + 1).map(pageNumber => (
         <TriagePageIndicator key={pageNumber} number={pageNumber} isCurrent={triagePage === pageNumber} />
      ))}
    </div>
  );

  // Paginated lab results
  const labTotalPages = Math.ceil(labResults.length / LAB_PAGE_SIZE);
  const paginatedLabResults = labResults.slice((labPage - 1) * LAB_PAGE_SIZE, labPage * LAB_PAGE_SIZE);

  // Dashboard-style page indicator for lab results
  const LabPageIndicator = ({ number, isCurrent }) => (
    <button
      onClick={() => setLabPage(number)}
      className={`h-8 w-8 rounded font-bold transition ${
        isCurrent
          ? 'bg-green-700 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {number}
    </button>
  );
  const LabPagination = () => (
    <div className="flex justify-center items-center gap-2 mt-4">
      {Array.from({ length: labTotalPages }, (_, i) => i + 1).map(pageNumber => (
         <LabPageIndicator key={pageNumber} number={pageNumber} isCurrent={labPage === pageNumber} />
      ))}
    </div>
  );

  // Handler for Triage Show Results
  const handleTriageShowResults = () => {
    setTriageShowResultsKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-6 p-4 bg-background">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
          My Health Records
        </h1>
      </header>

      {/* Tab Navigation */}
      <div className="flex space-x-8 border-b border-gray-300 sticky top-0 z-20 overflow-x-auto overflow-y-hidden mb-6 bg-background px-4">
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
                ? 
                'border-[#1a4d3e] text-[#1a4d3e] font-bold'
                : 
                'border-transparent text-gray-500 font-medium hover:text-[#1a4d3e]'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area - Changed min-h-[60vh] to h-fit */}
      <section className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl h-fit border border-gray-100">
        {activeTab === TABS.TRIAGE && (
          <div>
            {/* Filter Bar for Triage */}
            <div className={`flex flex-col md:flex-row md:items-end gap-4 mb-6`}>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col text-left">
                  <label className={`text-sm font-semibold mb-1 text-primary`}>Date From:</label>
                  <div className="relative">
                    <input type="date" value={triageDateFrom} onChange={e => { setTriageDateFrom(e.target.value); setTriagePage(1); }} className={`w-full p-2.5 rounded-lg text-sm text-primary bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none`} />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <label className={`text-sm font-semibold mb-1 text-primary`}>Date To:</label>
                  <div className="relative">
                    <input type="date" value={triageDateTo} onChange={e => { setTriageDateTo(e.target.value); setTriagePage(1); }} className={`w-full p-2.5 rounded-lg text-sm text-primary bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none`} />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <label className={`text-sm font-semibold mb-1 text-primary`}>Sort By</label>
                  <div className="relative">
                    <select value={triageSortBy} onChange={e => { setTriageSortBy(e.target.value); setTriagePage(1); }} className={`w-full p-2.5 rounded-lg text-sm text-primary bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none pr-10 cursor-pointer`}>
                      <option value="Descending">Latest</option>
                      <option value="Ascending">Oldest</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm border rounded-xl overflow-hidden">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="px-2 py-2">Patient ID</th>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Temp</th>
                    <th className="px-2 py-2">HR</th>
                    <th className="px-2 py-2">SpO₂</th>
                    <th className="px-2 py-2">Complaint</th>
                    <th className="px-2 py-2">Mental</th>
                    <th className="px-2 py-2">Level</th>
                    <th className="px-2 py-2">Doctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTriage.map((item, idx) => (
                    <tr key={idx} className="text-center">
                      <td className="px-2 py-2 font-medium text-green-700">{item.id}</td>
                      <td className="px-2 py-2">{item.date}</td>
                      <td className="px-2 py-2">{item.temp}</td>
                      <td className="px-2 py-2">{item.hr}</td>
                      <td className="px-2 py-2">{item.spo2}</td>
                      <td className="px-2 py-2">{item.complaint}</td>
                      <td className="px-2 py-2">{item.mental}</td>
                      <td className="px-2 py-2">{item.level}</td>
                      <td className="px-2 py-2">{item.doctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls and Showing count for Triage (single line) */}
              {(triageTotalPages > 1 || filteredTriage.length > 0) && (
                <div className="flex flex-wrap justify-between items-center gap-2 mt-4">
                  {triageTotalPages > 1 && <TriagePagination />}
                  <span className="text-xs text-primary ml-auto">
                    Showing {paginatedTriage.length} of {filteredTriage.length} total results.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === TABS.LAB && (
          <div>
            {/* Filter Bar */}
            <div className={`flex flex-col md:flex-row md:items-end gap-4 mb-6`}>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col text-left">
                  <label className={`text-sm font-semibold mb-1 text-primary`}>Order Date From:</label>
                  <div className="relative">
                    <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setLabPage(1); }} className={`w-full p-2.5 rounded-lg text-sm text-primary bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none`} />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <label className={`text-sm font-semibold mb-1 text-primary`}>Order Date To:</label>
                  <div className="relative">
                    <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setLabPage(1); }} className={`w-full p-2.5 rounded-lg text-sm text-primary bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none`} />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <label className={`text-sm font-semibold mb-1 text-primary`}>Sort By</label>
                  <div className="relative">
                    <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setLabPage(1); }} className={`w-full p-2.5 rounded-lg text-sm text-primary bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none pr-10 cursor-pointer`}>
                      <option value="Descending">Latest</option>
                      <option value="Ascending">Oldest</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-8 text-center text-gray-500 font-medium">Loading results...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-500 font-medium">{error}</div>
              ) : labResults.length > 0 ? (
                <>
                  <table className="min-w-full table-auto text-sm border rounded-xl overflow-hidden">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th className="px-2 py-2">Lab No.</th>
                        <th className="px-2 py-2">Branch</th>
                        <th className="px-2 py-2">Order Date</th>
                        <th className="px-2 py-2">Patient ID</th>
                        <th className="px-2 py-2">Account</th>
                        <th className="px-2 py-2">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedLabResults.map((result, idx) => (
                        <tr key={idx} className="text-center">
                          <td className="px-2 py-2 font-medium text-green-700">{result.lab_no}</td>
                          <td className="px-2 py-2">{result.branch}</td>
                          <td className="px-2 py-2">{new Date(result.order_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                          <td className="px-2 py-2">{result.patient_id_text}</td>
                          <td className="px-2 py-2">{result.account}</td>
                          <td className="px-2 py-2">{result.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Pagination Controls and Showing count for Lab Results (single line) */}
                  {(labTotalPages > 1 || labResults.length > 0) && (
                    <div className="flex flex-wrap justify-between items-center gap-2 mt-4">
                      {labTotalPages > 1 && <LabPagination />}
                      <span className="text-xs text-primary ml-auto">
                        Showing {paginatedLabResults.length} of {labResults.length} total results.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-gray-500 font-medium">No results found.</div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
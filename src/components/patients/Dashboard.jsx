import { useState } from "react";
import { FileText, Calendar, ChevronDown, Download } from "lucide-react";

// Load Tailwind CSS configuration classes
const DARK = {
  bg: 'bg-background', 
  card: 'bg-white', 
  header: 'bg-primary', 
  textLight: 'text-primary', 
  textMuted: 'text-primary', 
  accent: 'bg-[#1f883d] hover:bg-[#238636] text-white', 
  inputBorder: 'border-primary', 
};

const DOWNLOAD_ICON_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green-50 group-hover:text-white transition">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="12" y1="12" x2="12" y2="18"></line>
    <polyline points="9 15 12 18 15 15"></polyline>
  </svg>
);


// --- Mock Data ---

const MOCK_RESULTS = [
  { labNo: "2599019773", branch: "ROBINSONS MAGNOLIA", orderDate: "Jun-06-2025", patientID: "RM023271", patientName: "CACHERO, GEN RYV FABRO", account: "REFERRAL", gender: "FEMALE", age: 21, type: "X-RAY" },
  { labNo: "2599019618", branch: "ROBINSONS MAGNOLIA", orderDate: "Jun-05-2025", patientID: "RM023271", patientName: "CACHERO, GEN RYV FABRO", account: "REFERRAL", gender: "FEMALE", age: 21, type: "LAB" },
  { labNo: "2599019208", branch: "ROBINSONS MAGNOLIA", orderDate: "Jun-02-2025", patientID: "RM023271", patientName: "CACHERO, GEN RYV FABRO", account: "REFERRAL", gender: "FEMALE", age: 21, type: "X-RAY" },
  { labNo: "2599019209", branch: "ROBINSONS MAGNOLIA", orderDate: "Jun-02-2025", patientID: "RM023271", patientName: "CACHERO, GEN RYV FABRO", account: "PE", gender: "FEMALE", age: 21, type: "PE" },
  { labNo: "2599019210", branch: "ROBINSONS MAGNOLIA", orderDate: "Jun-01-2025", patientID: "RM023271", patientName: "CACHERO, GEN RYV FABRO", account: "REFERRAL", gender: "FEMALE", age: 21, type: "LAB" },
  { labNo: "2599019774", branch: "S.M. NORTH EDSA", orderDate: "May-15-2025", patientID: "RM023272", patientName: "CACHERO, GEN RYV FABRO", account: "HMO", gender: "FEMALE", age: 21, type: "LAB" },
  { labNo: "2599019885", branch: "ROBINSONS MAGNOLIA", orderDate: "May-01-2025", patientID: "RM023271", patientName: "CACHERO, GEN RYV FABRO", account: "REFERRAL", gender: "FEMALE", age: 21, type: "LAB" },
];


// --- Main Component ---

export default function PatientDash() {
  const [dateFrom, setDateFrom] = useState("2022-10-10");
  const [dateTo, setDateTo] = useState("2025-10-10");
  const [sortBy, setSortBy] = useState("Descending");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  // Placeholder function for filtering and sorting the MOCK_RESULTS
  const getFilteredAndSortedResults = () => {
    let results = MOCK_RESULTS.slice(); // Use a copy

    // 1. Filter by Date (Placeholder logic for demonstration)
    results = results.filter(item => {
      const itemDate = new Date(item.orderDate).getTime();
      const from = new Date(dateFrom).getTime();
      const to = new Date(dateTo).getTime();
      return itemDate >= from && itemDate <= to;
    });

    // 2. Sort
    results.sort((a, b) => {
      const dateA = new Date(a.orderDate);
      const dateB = new Date(b.orderDate);
      return sortBy === "Descending" ? dateB - dateA : dateA - dateB;
    });

    return results;
  };

  const results = getFilteredAndSortedResults();
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const currentResults = results.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const handleGoClick = () => {
    setCurrentPage(1);
    console.log(`Filtering from ${dateFrom} to ${dateTo}, sorted ${sortBy}`);
    // In a real app, this would trigger data fetching
  };
  
  const handleDownload = (labNo) => {
      console.log(`Downloading result file for Lab No: ${labNo}`);
  };

  const PageIndicator = ({ number, isCurrent }) => (
    <button
      onClick={() => setCurrentPage(number)}
      className={`h-8 w-8 rounded-md font-bold transition ${
        isCurrent 
          ? DARK.accent 
          : `bg-gray-200 text-gray-700 hover:bg-gray-300`
      }`}
    >
      {number}
    </button>
  );

  const Pagination = () => (
    <div className="flex justify-start items-center gap-2 mt-4">
      {/* Simple pagination: show current page and ellipsis */}
      {currentPage > 1 && <PageIndicator number={currentPage - 1} isCurrent={false} />}
      {totalPages > 0 && <PageIndicator number={1} isCurrent={currentPage === 1} />}
      {currentPage > 3 && <span className={DARK.textMuted}>...</span>}
      {currentPage > 2 && currentPage !== 1 && <PageIndicator number={currentPage - 1} isCurrent={false} />}
      {currentPage !== 1 && currentPage !== totalPages && <PageIndicator number={currentPage} isCurrent={true} />}
      {currentPage < totalPages - 1 && currentPage !== totalPages && <PageIndicator number={currentPage + 1} isCurrent={false} />}
      {totalPages > currentPage + 1 && <span className={DARK.textMuted}>...</span>}
      {totalPages > 1 && currentPage !== totalPages && <PageIndicator number={totalPages} isCurrent={false} />}
    </div>
  );

  const tableHeaders = [
    { key: "labNo", name: "Lab No.", isHidden: false },
    { key: "branch", name: "Branch", isHidden: true }, 
    { key: "orderDate", name: "Order Date", isHidden: false },
    { key: "patientID", name: "Patient ID", isHidden: true }, 
    { key: "patientName", name: "Patient Name", isHidden: false },
    { key: "account", name: "Account", isHidden: true }, 
    { key: "gender", name: "Gender", isHidden: true }, 
    { key: "age", name: "Age", isHidden: true }, 
    { key: "type", name: "Type", isHidden: false },
    { key: "download", name: "Download", isHidden: false },
  ];

  const MobileResultCard = ({ result }) => (
    <div className={`p-4 mb-3 border-b-2 border-gray-100 last:border-b-0 flex justify-between items-start`}>
      <div className="flex flex-col text-left space-y-1">
        
        {/* Patient Name & Lab No. (Primary Info) */}
        <p className={`text-base font-semibold ${DARK.textLight}`}>{result.patientName}</p>
        <p className={`text-xs ${DARK.textMuted}`}>Lab No: <span className="font-medium text-green-700">{result.labNo}</span></p>

        {/* Key Attributes */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
            <span className={`font-medium text-green-600 px-2 py-0.5 rounded-full bg-green-50`}>{result.type}</span>
            <span className={`font-medium ${DARK.textMuted}`}>{result.orderDate}</span>
            <span className={`font-medium ${DARK.textMuted}`}>{result.branch}</span>
        </div>

        {/* Secondary Details (Expanded for mobile view) */}
        <div className="text-xs mt-2 space-y-0.5 pt-1 border-t border-dashed border-gray-200">
            <p className={DARK.textMuted}><span className="font-semibold">Patient ID:</span> {result.patientID}</p>
            <p className={DARK.textMuted}><span className="font-semibold">Account:</span> {result.account}</p>
            <p className={DARK.textMuted}><span className="font-semibold">Gender/Age:</span> {result.gender}, {result.age}</p>
        </div>
      </div>
      
      {/* Download Button */}
      <button 
        onClick={() => handleDownload(result.labNo)}
        className="group p-2 rounded-full bg-green-700 hover:bg-green-800 transition shadow-md shrink-0"
        title="Download Result"
      >
        {DOWNLOAD_ICON_SVG}
      </button>
    </div>
  );


  return (
    <div className={`min-h-screen p-4 sm:p-6 md:p-8 ${DARK.bg} font-inter`}>
      {/* Header - Always responsive */}
      <header className="mb-6 p-4 bg-white rounded-xl shadow-lg">
        <h1 className={`text-3xl md:text-4xl text-left font-extrabold ${DARK.textLight}`}>
          Dashboard
        </h1>
      </header>

      {/* Filter Bar - Responsive: stacks vertically on mobile, aligns horizontally on MD+ */}
      <div className={`p-4 rounded-xl shadow-lg mb-6 ${DARK.card} flex flex-col md:flex-row md:items-end gap-4`}>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Order Date From */}
          <div className="flex flex-col text-left">
            <label className={`text-sm font-semibold mb-1 ${DARK.textMuted}`}>Order Date From:</label>
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`w-full p-2.5 rounded-lg text-sm ${DARK.textLight} ${DARK.card} ${DARK.inputBorder} border focus:ring-green-500 focus:border-green-500 appearance-none`}
              />
              <Calendar size={16} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${DARK.textMuted} pointer-events-none`} />
            </div>
          </div>
          
          {/* Order Date To */}
          <div className="flex flex-col text-left">
            <label className={`text-sm font-semibold mb-1 ${DARK.textMuted}`}>Order Date To:</label>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`w-full p-2.5 rounded-lg text-sm ${DARK.textLight} ${DARK.card} ${DARK.inputBorder} border focus:ring-green-500 focus:border-green-500 appearance-none`}
              />
              <Calendar size={16} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${DARK.textMuted} pointer-events-none`} />
            </div>
          </div>

          {/* Sort By */}
          <div className="flex flex-col text-left">
            <label className={`text-sm font-semibold mb-1 ${DARK.textMuted}`}>Sort By</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full p-2.5 rounded-lg text-sm ${DARK.textLight} ${DARK.card} ${DARK.inputBorder} border focus:ring-green-500 focus:border-green-500 appearance-none pr-10 cursor-pointer`}
              >
                <option value="Descending">Latest</option>
                <option value="Ascending">Oldest</option>
              </select>
              <ChevronDown size={18} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${DARK.textMuted} pointer-events-none`} />
            </div>
          </div>

        </div>

        {/* Show Results Button */}
        <button
          onClick={handleGoClick}
          className={`h-11 px-6 font-bold rounded-lg shadow-md transition shrink-0 ${DARK.header} text-white text-sm hover:bg-green-800`}
        >
          Show Results
        </button>
      </div>

      {/* Data Table / Mobile Card View - Conditional Rendering */}
      <div className={`rounded-xl shadow-2xl ${DARK.card} overflow-hidden`}>
        
        {/* 1. Mobile Card List (Default/Small Screens: hidden above SM breakpoint) */}
        <div className="sm:hidden divide-y divide-gray-100">
            {currentResults.length > 0 ? (
                currentResults.map((result) => (
                    <MobileResultCard key={result.labNo} result={result} />
                ))
            ) : (
                <div className="py-8 text-center text-gray-500 font-medium">No results found for the selected date range.</div>
            )}
        </div>

        {/* 2. Desktop Table View (SM and up: hidden below SM breakpoint) */}
        <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className={DARK.header}>
                    <tr>
                    {tableHeaders.map((header) => (
                        <th
                        key={header.key}
                        scope="col"
                        // Hide less critical columns on small screens
                        className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white 
                            ${header.isHidden ? 'hidden sm:table-cell' : 'table-cell'}`}
                        >
                        {header.name}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody className={`divide-y divide-gray-100 ${DARK.card}`}>
                    {currentResults.map((result) => (
                    <tr key={result.labNo} className="hover:bg-gray-50 transition text-center">
                        
                        {/* Lab No. (Always Visible) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${DARK.textLight}`}>{result.labNo}</td>
                        
                        {/* Branch (Hidden on mobile) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted} hidden sm:table-cell`}>{result.branch}</td>
                        
                        {/* Order Date (Always Visible) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted}`}>{result.orderDate}</td>
                        
                        {/* Patient ID (Hidden on mobile) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted} hidden sm:table-cell`}>{result.patientID}</td>
                        
                        {/* Patient Name (Always Visible) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${DARK.textLight}`}>{result.patientName}</td>
                        
                        {/* Account (Hidden on mobile) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted} hidden md:table-cell`}>{result.account}</td>
                        
                        {/* Gender (Hidden on mobile) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted} hidden md:table-cell`}>{result.gender}</td>
                        
                        {/* Age (Hidden on mobile) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted} hidden md:table-cell`}>{result.age}</td>
                        
                        {/* Type (Always Visible) */}
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600`}>{result.type}</td>
                        
                        {/* Download (Always Visible) */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button 
                            onClick={() => handleDownload(result.labNo)}
                            className="group p-2 rounded-full bg-green-700 hover:bg-green-800 transition"
                            title="Download Result"
                        >
                            {DOWNLOAD_ICON_SVG}
                        </button>
                        </td>
                    </tr>
                    ))}
                    {currentResults.length === 0 && (
                        <tr>
                            <td colSpan={10} className="py-8 text-center text-gray-500 font-medium">No results found for the selected date range.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Pagination & Footer */}
      <Pagination />
      <div className={`mt-4 text-xs ${DARK.textMuted}`}>
        Showing {currentResults.length} results on page {currentPage} of {totalPages}.
      </div>
    </div>
  );
}

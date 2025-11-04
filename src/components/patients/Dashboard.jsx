import { useState, useEffect } from "react";
import { 
  Calendar, 
  ChevronDown, 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudLightning, 
  Loader2 
} from "lucide-react";
import api from "../../services/api"; 
import { useAuth } from "../../context/AuthContext"; 
import { formatDistanceToNow } from 'date-fns'; 
import { useNavigate } from 'react-router-dom'; 

// --- START: Weather Helper Functions ---
const describeWeatherCode = (code) => {
  const codes = {
    0: { label: "Clear sky", variant: "clear" },
    1: { label: "Mainly clear", variant: "partly" },
    2: { label: "Partly cloudy", variant: "partly" },
    3: { label: "Overcast", variant: "cloudy" },
    45: { label: "Fog", variant: "fog" },
    48: { label: "Depositing rime fog", variant: "fog" },
    51: { label: "Light drizzle", variant: "drizzle" },
    53: { label: "Drizzle", variant: "drizzle" },
    55: { label: "Dense drizzle", variant: "drizzle" },
    61: { label: "Slight rain", variant: "rain" },
    63: { label: "Rain", variant: "rain" },
    65: { label: "Heavy rain", variant: "rain" },
    80: { label: "Slight rain showers", variant: "rain" },
    81: { label: "Rain showers", variant: "rain" },
    82: { label: "Violent rain showers", variant: "rain" },
    95: { label: "Thunderstorm", variant: "thunder" },
    96: { label: "Thunderstorm + hail", variant: "thunder" },
    99: { label: "Thunderstorm + heavy hail", variant: "thunder" },
  };
  return codes[code] || { label: "Cloudy", variant: "cloudy" };
};

const iconForVariant = (variant) => {
  switch (variant) {
    case "clear": return Sun;
    case "partly": return CloudSun;
    case "cloudy": return Cloud;
    case "fog": return CloudFog;
    case "drizzle": return CloudDrizzle;
    case "rain": return CloudRain;
    case "thunder": return CloudLightning;
    default: return Cloud;
  }
};

const formatTemperature = (value, unit) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "–";
  return `${Math.round(value)}°${unit.toUpperCase()}`;
};
// --- END: Weather Helper Functions ---


// --- Weather Widget Component ---
const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m,weathercode&timezone=Asia%2FManila");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setWeather(data.current);
      } catch (err) {
        setError(true);
        console.error("Failed to fetch weather", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="text-center text-red-500">
        <p>Weather data unavailable.</p>
      </div>
    );
  }

  const weatherInfo = describeWeatherCode(weather.weathercode);
  const Icon = iconForVariant(weatherInfo.variant);

  return (
    <div className="flex items-center gap-4">
      <Icon size={48} className="text-primary" />
      <div className="text-left">
        <p className="text-3xl font-bold text-primary">
          {formatTemperature(weather.temperature_2m, 'C')}
        </p>
        <p className="text-sm text-primary">{weatherInfo.label}</p>
      </div>
    </div>
  );
};
// --- END: Weather Widget Component ---

// --- Notification Widget Component ---
const NotificationWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await api.get('/notifications');
        setNotifications(response.data.slice(0, 3)); 
      } catch (err) {
        console.error("Failed to fetch notifications for widget", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return <div className="text-center text-sm text-gray-500">Loading...</div>;
  }

  if (notifications.length === 0) {
    return <div className="text-center text-sm text-gray-500">No new notifications.</div>;
  }

  return (
    <ul className="space-y-3 text-left">
      {notifications.map((notif) => (
        <li key={notif.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg text-primary text-sm border-l-4 border-green-700">
          <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-green-700 rounded-full"></span>
          <div className="flex-1">
            <p className="font-semibold">{notif.title}</p>
            <p className="text-xs text-gray-600">{notif.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};
// --- END: Notification Widget Component ---


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

// --- Main Component ---

export default function PatientDash() {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2025-07-10");
  const [sortBy, setSortBy] = useState("Descending");

  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  let greeting = "Good morning";
  const currentHour = new Date().getHours();
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon";
  } else if (currentHour >= 18) {
    greeting = "Good evening";
  }

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
      setResults(response.data);
    } catch (err) {
      setError("Failed to fetch lab results. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleGoClick = () => {
    setCurrentPage(1);
    fetchResults();
  };

  const handleDownload = (labNo) => {
    console.log(`Downloading result file for Lab No: ${labNo}`);
  };
  
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const formattedResults = paginatedResults.map(result => ({
    labNo: result.lab_no,
    branch: result.branch,
    orderDate: new Date(result.order_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    patientID: result.patient_id_text,
    account: result.account,
    type: result.type,
  }));

  const PageIndicator = ({ number, isCurrent }) => (
    <button
      onClick={() => setCurrentPage(number)}
      className={`h-8 w-8 rounded font-bold transition ${
        isCurrent
          ? 'bg-green-700 text-white'
          : `bg-gray-200 text-gray-700 hover:bg-gray-300`
      }`}
    >
      {number}
    </button>
  );

  const Pagination = () => (
    <div className="flex justify-start items-center gap-2 mt-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
         <PageIndicator key={pageNumber} number={pageNumber} isCurrent={currentPage === pageNumber} />
      ))}
    </div>
  );
  
  const tableHeaders = [
    { key: "labNo", name: "Lab No." },
    { key: "branch", name: "Branch" },
    { key: "orderDate", name: "Order Date" },
    { key: "patientID", name: "Patient ID" },
    { key: "account", name: "Account" },
    { key: "type", name: "Type" },
    { key: "download", name: "Download" },
  ];

  const MobileResultCard = ({ result }) => (
    <div className={`p-4 mb-3 border-b-2 border-gray-100 last:border-b-0 flex justify-between items-start`}>
        <div className="flex flex-col text-left space-y-1">
        
        <p className={`text-xs ${DARK.textMuted}`}>Lab No: <span className="font-medium text-green-700">{result.labNo}</span></p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
            <span className={`font-medium text-green-600 px-2 py-0.5 rounded-full bg-green-50`}>{result.type}</span>
            <span className={`font-medium ${DARK.textMuted}`}>{result.orderDate}</span>
            <span className={`font-medium ${DARK.textMuted}`}>{result.branch}</span>
        </div>

        <div className="text-xs mt-2 space-y-0.5 pt-1 border-t border-dashed border-gray-200">
            <p className={DARK.textMuted}><span className="font-semibold">Patient ID:</span> {result.patientID}</p>
            <p className={DARK.textMMuted}><span className="font-semibold">Account:</span> {result.account}</p>
        </div>
      </div>
      
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

      <header className="mb-6 p-4 text-left">
        <h1 className={`text-3xl md:text-4xl font-extrabold ${DARK.textLight}`}>
          {greeting}, {user ? user.name : 'Patient'}!
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- COLUMN 1: Main Content Card --- */}
        <div className="lg:col-span-2 space-y-6 bg-white rounded-xl shadow-lg p-6">
          
          {/* Filter Bar */}
          <div className={`flex flex-col md:flex-row md:items-end gap-4`}>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col text-left">
                <label className={`text-sm font-semibold mb-1 ${DARK.textMuted}`}>Order Date From:</label>
                <div className="relative">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`w-full p-2.5 rounded-lg text-sm ${DARK.textLight} bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none`} />
                  <Calendar size={16} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${DARK.textMuted} pointer-events-none`} />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <label className={`text-sm font-semibold mb-1 ${DARK.textMuted}`}>Order Date To:</label>
                <div className="relative">
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`w-full p-2.5 rounded-lg text-sm ${DARK.textLight} bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none`} />
                  <Calendar size={16} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${DARK.textMuted} pointer-events-none`} />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <label className={`text-sm font-semibold mb-1 ${DARK.textMuted}`}>Sort By</label>
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`w-full p-2.5 rounded-lg text-sm ${DARK.textLight} bg-gray-50 border-gray-300 border focus:ring-green-500 focus:border-green-500 appearance-none pr-10 cursor-pointer`}>
                    <option value="Descending">Latest</option>
                    <option value="Ascending">Oldest</option>
                  </select>
                  <ChevronDown size={18} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${DARK.textMuted} pointer-events-none`} />
                </div>
              </div>
            </div>
            <button onClick={handleGoClick} className={`h-11 px-6 font-bold rounded-lg shadow-md transition shrink-0 ${DARK.header} text-white text-sm hover:bg-green-800`}>
              Show Results
            </button>
          </div>

          {/* Data Table Container */}
          <div className={`rounded-xl overflow-hidden border border-gray-200`}>
            {/* Mobile Card List */}
            <div className="sm:hidden">
              {isLoading ? (
                <div className="py-8 text-center text-gray-500 font-medium">Loading results...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-500 font-medium">{error}</div>
              ) : formattedResults.length > 0 ? (
                formattedResults.map((result) => (
                  <MobileResultCard key={result.labNo} result={result} />
                ))
              ) : (
                <div className="py-8 text-center text-gray-500 font-medium">No results found.</div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead className={DARK.header}>
                  <tr>
                    {tableHeaders.map((header) => (
                      <th key={header.key} scope="col" className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white`}>
                        {header.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-100 ${DARK.card}`}>
                  {isLoading ? (
                    <tr><td colSpan={tableHeaders.length} className="py-8 text-center text-gray-500 font-medium">Loading results...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={tableHeaders.length} className="py-8 text-center text-red-500 font-medium">{error}</td></tr>
                  ) : formattedResults.length > 0 ? (
                    formattedResults.map((result) => (
                      <tr key={result.labNo} className="hover:bg-gray-50 transition text-center">
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${DARK.textLight}`}>{result.labNo}</td>
                        <td className={`px-4 py-3 whitespace-nowLg text-sm ${DARK.textMuted}`}>{result.branch}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted}`}>{result.orderDate}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted}`}>{result.patientID}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${DARK.textMuted}`}>{result.account}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600`}>{result.type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button onClick={() => handleDownload(result.labNo)} className="group p-2 rounded-full bg-green-700 hover:bg-green-800 transition" title="Download Result">
                            {DOWNLOAD_ICON_SVG}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableHeaders.length} className="py-8 text-center text-gray-500 font-medium">No results found for the selected criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination & Footer */}
          <div className="flex justify-between items-center mt-4">
            {!isLoading && !error && results.length > 0 && <Pagination />}
            {!isLoading && !error && (
              <div className={`text-xs ${DARK.textMuted}`}>
                Showing {paginatedResults.length} of {results.length} total results.
              </div>
            )}
          </div>

        </div> 

        {/* --- COLUMN 2: Sidebar --- */}
        <aside className="lg:col-span-1 space-y-6">
          
          {/* Notifications Section */}
          <button 
            onClick={() => navigate('/patient/notifications')} 
            className="w-full bg-white rounded-xl shadow-lg p-6 text-left hover:bg-gray-50 transition"
          >
            <h2 className="text-xl font-bold text-primary mb-4">Notifications</h2>
            <NotificationWidget /> 
          </button>

          {/* Weather Section */}
          <button 
            onClick={() => navigate('/patient/weather')}
            className="w-full bg-white rounded-xl shadow-lg p-6 text-left hover:bg-gray-50 transition"
          >
            <h2 className="text-xl font-bold text-primary mb-4">Weather</h2>
            <WeatherWidget />
          </button>
          
        </aside>

      </div> 

    </div>
  );
}
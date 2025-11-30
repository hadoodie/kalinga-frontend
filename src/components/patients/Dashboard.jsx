import { useState, useEffect, useMemo } from "react";
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
  Loader2,
  Clock          
} from "lucide-react";
import api from "../../services/api"; 
import { useAuth } from "../../context/AuthContext"; 
import { formatDistanceToNow } from 'date-fns'; 
import { useNavigate } from 'react-router-dom'; 
import { useNotifications } from "../../hooks/useNotifications"; 

// --- Weather Helper Functions ---
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

// --- Notification Widget Component ---
const NotificationWidget = () => {
  // Use real-time notifications hook
  const { notifications: allNotifications, loading } = useNotifications({ limit: 5 });
  
  // Get only the first 3 notifications
  const notifications = useMemo(() => allNotifications.slice(0, 3), [allNotifications]);

  if (loading) {
    return <div className="text-center text-sm text-gray-500">Loading...</div>;
  }

  if (notifications.length === 0) {
    return <div className="text-center text-sm text-gray-500">No new notifications.</div>;
  }

  return (
    <ul className="space-y-3 text-left">
      {notifications.map((notif) => (
        <li key={notif.id} className={`flex gap-3 p-3 rounded-lg text-primary text-sm ${
          !notif.read_at ? "bg-green-50" : "bg-gray-50"
        }`}>
          <span className={`flex-shrink-0 w-2 h-2 mt-1.5 rounded-full ${
            !notif.read_at ? "bg-green-700 animate-pulse" : "bg-green-700"
          }`}></span>
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

// --- Upcoming Appointment Widget ---
const AppointmentWidget = () => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextAppointment = async () => {
      try {
        setLoading(true);
        const response = await api.get('/appointments');
        
        // Filter for upcoming only and sort by date ascending (soonest first)
        const upcoming = response.data
          .filter(app => app.status.toLowerCase() === 'upcoming')
          .map(app => ({
            ...app,
            dateObj: new Date(app.appointment_at)
          }))
          .sort((a, b) => a.dateObj - b.dateObj);

        // Take the very first one
        if (upcoming.length > 0) {
          setAppointment(upcoming[0]);
        }
      } catch (err) {
        console.error("Failed to fetch appointment widget", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNextAppointment();
  }, []);

  if (loading) return <div className="text-center text-sm text-gray-500">Loading...</div>;

  if (!appointment) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-gray-500">No upcoming appointments.</p>
        <p className="text-xs text-green-600 font-semibold mt-1">Book a visit now</p>
      </div>
    );
  }

  const date = new Date(appointment.appointment_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-2">
       <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-md shadow-sm text-center min-w-[3.5rem]">
             <p className="text-xs text-green-800 font-bold uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
             <p className="text-xl font-extrabold text-green-700">{date.getDate()}</p>
          </div>
          <div className="flex-1">
             <p className="font-bold text-primary text-sm line-clamp-1">{appointment.provider_name}</p>
             <p className="text-xs text-green-700 font-medium mb-1">{appointment.provider_specialty}</p>
             <div className="flex items-center gap-1 text-xs text-gray-600">
               <Clock size={12} />
               {timeStr}
             </div>
          </div>
       </div>
    </div>
  );
};


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

// --- Vitals Mock Data ---
const vitalsData = [
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
  const resultsPerPage = 5;

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

  // --- Mobile Card for Vitals ---
  const MobileVitalsCard = ({ item }) => (
    <div className="p-4 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm text-left">
      <div className="flex justify-between items-start mb-2">
         <span className="text-xs font-bold text-gray-800 break-words w-2/3">{item.id}</span>
         <span className="text-xs text-gray-500">{item.date}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 p-2 rounded">
         <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Temp</p>
            <p className="font-bold text-gray-800">{item.temp}</p>
         </div>
         <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">HR</p>
            <p className="font-bold text-gray-800">{item.hr}</p>
         </div>
         <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">SpO2</p>
            <p className="font-bold text-gray-800">{item.spo2}</p>
         </div>
      </div>

      <div className="space-y-1 text-xs text-gray-700">
         <p><span className="font-semibold">Complaint:</span> {item.complaint}</p>
         <p><span className="font-semibold">Mental:</span> {item.mental}</p>
         <p><span className="font-semibold">Doctor:</span> {item.doctor}</p>
      </div>
      
      <div className={`mt-2 text-center text-xs font-bold py-1 px-2 rounded ${item.level === 'medium' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100'}`}>
         Level: {item.level.toUpperCase()}
      </div>
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
        <div className="lg:col-span-2 space-y-8">
            
          {/* --- Vitals Table (Triage History) --- */}
          <div className="bg-white rounded-xl shadow-lg p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4 justify-between">
              <h2 className="text-xl font-bold text-primary">Triage History</h2>
              <button
                className="text-green-700 font-semibold text-sm hover:underline"
                onClick={() => navigate('/patient/health-records?tab=triage')}
              >
                See All
              </button>
            </div>
            {/* Mobile Vitals View */}
            <div className="md:hidden">
              {vitalsData.slice(0, 5).map((item, idx) => (
                <MobileVitalsCard key={idx} item={item} />
              ))}
            </div>
            {/* Desktop Vitals Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 min-w-0">
              <table className="w-full table-auto text-sm"> 
                <thead className="bg-primary">
                  <tr>
                    <th className="px-2 py-3 text-center font-semibold uppercase tracking-wider text-white">Patient ID</th>
                    <th className="px-2 py-3 text-center font-semibold uppercase tracking-wider text-white">Date</th>
                    <th className="px-1 py-3 text-center font-semibold uppercase tracking-wider text-white">Temp</th>
                    <th className="px-1 py-3 text-center font-semibold uppercase tracking-wider text-white">HR</th>
                    <th className="px-1 py-3 text-center font-semibold uppercase tracking-wider text-white">SpO₂</th>
                    <th className="px-2 py-3 text-center font-semibold uppercase tracking-wider text-white">Complaint</th>
                    <th className="px-2 py-3 text-center font-semibold uppercase tracking-wider text-white">Mental</th>
                    <th className="px-2 py-3 text-center font-semibold uppercase tracking-wider text-white">Level</th>
                    <th className="px-2 py-3 text-center font-semibold uppercase tracking-wider text-white">Doctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {vitalsData.slice(0, 5).map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition text-center">
                      <td className="px-2 py-3 font-medium text-green-700">{item.id}</td>
                      <td className="px-2 py-3 text-primary">{item.date}</td>
                      <td className="px-1 py-3 text-primary">{item.temp}</td>
                      <td className="px-1 py-3 text-primary">{item.hr}</td>
                      <td className="px-1 py-3 font-bold text-green-600">{item.spo2}</td>
                      <td className="px-2 py-3 max-w-[100px] truncate text-primary" title={item.complaint}>{item.complaint}</td>
                      <td className="px-2 py-3 text-primary">{item.mental}</td>
                      <td className={`px-2 py-3 font-bold ${item.level === 'medium' ? 'bg-orange-50 text-[#C05621]' : ''}`}>{item.level}</td>
                      <td className="px-2 py-3 text-green-800 break-words">{item.doctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- Lab Results --- */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4 justify-between">
              <h2 className="text-xl font-bold text-primary">Lab Results</h2>
              <button
                className="text-green-700 font-semibold text-sm hover:underline"
                onClick={() => navigate('/patient/health-records?tab=lab')}
              >
                See All
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
                ) : formattedResults.slice(0, 5).length > 0 ? (
                  formattedResults.slice(0, 5).map((result) => (
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
                    ) : formattedResults.slice(0, 5).length > 0 ? (
                      formattedResults.slice(0, 5).map((result) => (
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
          </div>

        </div> 

        {/* --- COLUMN 2: Sidebar --- */}
        <aside className="lg:col-span-1 space-y-6">

          {/* Upcoming Appointment */}
          <button 
            onClick={() => navigate('/patient/appointments')}
            className="w-full bg-white rounded-xl shadow-lg p-6 text-left hover:bg-gray-50 transition"
          >
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary">Upcoming Appointment</h2>
             </div>
             <AppointmentWidget />
          </button>
          
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
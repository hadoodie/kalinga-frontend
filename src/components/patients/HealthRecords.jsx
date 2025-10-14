import { useState } from "react";
import { 
  FileText, FlaskConical, Stethoscope, Pill, Shield, Info, X, 
  Download, Printer, ChevronDown, CheckCircle, AlertTriangle, MessageSquare, 
  Activity, Calendar, User, RefreshCw, Plus, Minus
} from "lucide-react";

// --- MOCK DATA ---

const MOCK_TEST_RESULTS = [
  { 
    id: 101, type: "Lab Result", name: "Comprehensive Metabolic Panel (CMP)", date: "2024-09-15", 
    provider: "Dr. Kiandra Karingal", status: "Review",
    details: [
      { key: "Glucose", value: 105, unit: "mg/dL", range: "70-99", flag: "High", explanation: "Slightly elevated fasting glucose. May indicate pre-diabetes or temporary stress. Follow-up is recommended." },
      { key: "Potassium", value: 4.0, unit: "mEq/L", range: "3.5-5.1", flag: "Normal", explanation: "Potassium levels are within the expected range." },
    ]
  },
  { 
    id: 102, type: "Imaging", name: "Chest X-Ray", date: "2024-07-20", 
    provider: "Dr. Gian Asentista", status: "Normal",
    details: [{ key: "Impression", value: "No acute findings. Lungs are clear.", range: "N/A", flag: "Normal", explanation: "The image shows no immediate health concerns." }]
  },
  { 
    id: 103, type: "Lab Result", name: "Cholesterol Panel", date: "2024-03-01", 
    provider: "Dr. Jayvee Moral", status: "High",
    details: [
      { key: "Total Cholesterol", value: 220, unit: "mg/dL", range: "0-200", flag: "High", explanation: "Total cholesterol is above the healthy range. Discuss lifestyle changes with your doctor." },
    ]
  },
];

const MOCK_MEDICATIONS = [
  { id: 201, name: "Lisinopril", dosage: "10 mg", frequency: "Once daily", physician: "Dr. Leda Vance", status: "Active" },
  { id: 202, name: "Ibuprofen", dosage: "200 mg", frequency: "As needed (Max 3 daily)", physician: "Dr. Alex Chen", status: "Active" },
  { id: 203, name: "Amoxicillin", dosage: "500 mg", frequency: "Twice daily", physician: "Dr. Leda Vance", status: "Inactive" },
];

const MOCK_SUMMARIES = {
  allergies: [
    { name: "Penicillin", reaction: "Hives, Anaphylaxis Risk" },
    { name: "Latex", reaction: "Mild Skin Rash" },
  ],
  diagnoses: [
    { name: "Essential Hypertension", status: "Active", date: "2023-05-10" },
    { name: "Seasonal Allergies", status: "Active", date: "2022-03-15" },
    { name: "Tonsillitis", status: "Inactive", date: "2020-11-01" },
  ],
  immunizations: [
    { vaccine: "COVID-19 (Booster)", date: "2024-09-10" },
    { vaccine: "Influenza (Flu Shot)", date: "2024-10-05" },
    { vaccine: "Tetanus/Diphtheria (Tdap)", date: "2021-04-12" },
  ]
};

const MOCK_DOCUMENTS = [
  { id: 301, name: "2024 Annual Exam Notes", type: "Doctor's Notes", date: "2024-09-15" },
  { id: 302, name: "Hospital Discharge Summary", type: "Summary", date: "2024-01-28" },
  { id: 303, name: "Radiology Report (X-Ray)", type: "Imaging Report", date: "2024-07-20" },
];

// --- Configuration ---
const TABS = {
  TESTS: "Tests",
  MEDS: "Meds",
  SUMMARIES: "Summaries",
  DOCS: "Documents",
};

const COLORS = {
  primary: "bg-primary hover:bg-green-700 text-white",
  secondary: "bg-gray-100 hover:bg-gray-200 text-primary",
  danger: "bg-red-500 hover:bg-red-600 text-white",
};

// --- Sub-Components: Modals and Helpers ---

/**
 * Custom Modal Component
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
            <X size={24} className="text-primary" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const StatusPill = ({ status, isLarge = false }) => {
  let classes = "";
  let Icon = Info;
  
  switch (status) {
    case "High":
    case "Review":
      classes = "bg-red-100 text-red-700 border-red-300";
      Icon = AlertTriangle;
      break;
    case "Normal":
    case "Active":
      classes = "bg-green-100 text-green-700 border-green-300";
      Icon = CheckCircle;
      break;
    case "Inactive":
      classes = "bg-gray-100 text-primary border-gray-300";
      Icon = Minus;
      break;
    default:
      classes = "bg-blue-100 text-blue-700 border-blue-300";
      Icon = Info;
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${classes} 
        ${isLarge ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'}`}
    >
      <Icon size={isLarge ? 16 : 14} />
      {status}
    </span>
  );
};

// --- Test Results Tab ---

const TestResultDetail = ({ result }) => {
  const formatDateTime = (dateString) => new Date(dateString).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="text-xl font-bold text-primary">{result.name}</div>
        <StatusPill status={result.status} isLarge={true} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-white p-4 rounded-xl shadow-inner border text-left">
        <DetailItem icon={Calendar} label="Date/Time" value={formatDateTime(result.date)} />
        <DetailItem icon={Stethoscope} label="Ordering Provider" value={result.provider} />
        <DetailItem icon={FileText} label="Type" value={result.type} />
      </div>

      <h3 className="text-2xl font-bold text-primary border-b pb-2 mt-6">Detailed Values</h3>
      
      <div className="space-y-4">
        {result.details.map((item, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg border p-4">
            <div className="flex justify-between items-center mb-2 border-b pb-2">
              <h4 className="text-xl font-bold text-primary flex items-center gap-2">
                <Activity size={24} className={item.flag === 'High' ? 'text-red-500' : 'text-primary'} />
                {item.key}
              </h4>
              <StatusPill status={item.flag} isLarge={true} />
            </div>
            
            <div className="grid grid-cols-3 text-sm text-center font-medium bg-gray-50 rounded-lg p-3 my-2">
              <div><span className="text-primary block">Value</span> <span className="font-bold text-primary">{item.value} {item.unit}</span></div>
              <div><span className="text-primary block">Reference Range</span> <span className="font-bold text-primary">{item.range}</span></div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 className="font-bold text-yellow-800 flex items-center gap-2 mb-1"><MessageSquare size={16} /> Simple Explanation:</h5>
              <p className="text-sm text-yellow-900 text-left">{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TestsTab = () => {
  const [selectedResult, setSelectedResult] = useState(null);

  return (
    <>
      <div className="space-y-4">
        {MOCK_TEST_RESULTS.map((result) => (
          <div 
            key={result.id} 
            className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md border cursor-pointer hover:border-primary transition"
            onClick={() => setSelectedResult(result)}
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-bold text-primary text-left">{result.name}</p>
                <p className="text-sm text-primary text-left">Ordered by {result.provider} on {new Date(result.date).toLocaleDateString()}</p>
              </div>
            </div>
            <StatusPill status={result.status} />
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!selectedResult} 
        onClose={() => setSelectedResult(null)} 
        title="Test Result Details"
      >
        {selectedResult && <TestResultDetail result={selectedResult} />}
      </Modal>
    </>
  );
};

// --- Medications Tab ---

const MedicationsTab = () => {
  const activeMeds = MOCK_MEDICATIONS.filter(m => m.status === "Active");
  const inactiveMeds = MOCK_MEDICATIONS.filter(m => m.status === "Inactive");
  
  const handleRefillRequest = (med) => {
    alert(`Refill request sent for ${med.name}. A pharmacy contact will follow up shortly.`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary flex items-center gap-2 border-b pb-2">
        <Pill size={24} className="text-primary" /> Active Prescriptions 
      </h2>
      
      <div className="space-y-4 text-left text-primary">
        {activeMeds.map((med) => (
          <div key={med.id} className="bg-white p-4 rounded-xl shadow-lg border border-green-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="flex-1 space-y-1">
              <p className="text-xl font-extrabold text-primary">{med.name}</p>
              <p className="text-sm text-primary">
                <span className="font-semibold">{med.dosage}</span> • <span className="italic">{med.frequency}</span>
              </p>
              <p className="text-xs text-primary flex items-center gap-1">
                <User size={14} /> Prescribed by: {med.physician}
              </p>
            </div>
            
            <button 
              onClick={() => handleRefillRequest(med)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition shadow-md ${COLORS.primary}`}
            >
              <RefreshCw size={18} /> Request Refill
            </button>
          </div>
        ))}
      </div>
      
      <h2 className="text-2xl font-bold text-primary flex items-center gap-2 pt-6 border-t">
        <Minus size={24} className="text-primary" /> Inactive Medications
      </h2>
      <div className="space-y-2">
        {inactiveMeds.map((med) => (
          <div key={med.id} className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center text-primary">
            <span className="font-medium">{med.name} ({med.dosage})</span>
            <StatusPill status="Inactive" />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Key Summaries Tab ---

const SummaryCard = ({ title, data, icon: Icon, colorClass }) => (
  <div className={`bg-white rounded-xl shadow-lg p-5 border-t-4 ${colorClass} min-h-[250px]`}>
    <div className="flex items-center gap-3 mb-4 border-b pb-2">
      <h3 className="text-xl font-bold text-primary">{title}</h3>
    </div>
    
    <ul className="space-y-3 text-sm text-left">
      {data.slice(0, 5).map((item, index) => (
        <li key={index} className="flex justify-between items-start">
          <span className="font-semibold text-primary flex-1">{item.name || item.vaccine}</span>
          {item.reaction && <span className="text-red-600 font-medium text-right ml-2">{item.reaction}</span>}
          {item.status && <StatusPill status={item.status} />}
          {item.date && <span className="text-primary text-right ml-2">{new Date(item.date).toLocaleDateString()}</span>}
        </li>
      ))}
      {data.length > 5 && <li className="text-primary italic mt-2">...and {data.length - 5} more</li>}
      {data.length === 0 && <li className="text-primary italic">No verified records found.</li>}
    </ul>
  </div>
);

const SummariesTab = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <SummaryCard 
      title="Allergies & Reactions" 
      data={MOCK_SUMMARIES.allergies} 
      icon={AlertTriangle} 
      colorClass="border-red-500" 
    />
    <SummaryCard 
      title="Active Diagnoses" 
      data={MOCK_SUMMARIES.diagnoses} 
      icon={Stethoscope} 
      colorClass="border-yellow-500" 
    />
    <SummaryCard 
      title="Immunization Record" 
      data={MOCK_SUMMARIES.immunizations} 
      icon={Shield} 
      colorClass="border-green-500" 
    />
  </div>
);

// --- Documentation Tab ---

const DocumentsTab = () => (
  <div className="space-y-4">
    {MOCK_DOCUMENTS.map((doc) => (
      <div 
        key={doc.id} 
        className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md border"
      >
        <div className="flex items-center gap-4 text-left">
          <FileText size={32} className="text-primary shrink-0" />
          <div>
            <p className="text-lg font-bold text-primary">{doc.name}</p>
            <p className="text-sm text-primary">{doc.type} | Date: {new Date(doc.date).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => alert(`Downloading ${doc.name}...`)}
            className={`p-2 rounded-lg text-sm transition ${COLORS.secondary}`}
          >
            <Download size={20} />
          </button>
          <button 
            onClick={() => alert(`Printing ${doc.name}...`)}
            className={`p-2 rounded-lg text-sm transition ${COLORS.secondary}`}
          >
            <Printer size={20} />
          </button>
        </div>
      </div>
    ))}
  </div>
);

const tabsConfig = [
  { key: TABS.TESTS, label: "Test Results", Icon: FlaskConical, Component: TestsTab },
  { key: TABS.MEDS, label: "Medications", Icon: Pill, Component: MedicationsTab }, // Changed 'Pills' to 'Pill'
  { key: TABS.SUMMARIES, label: "Key Summaries", Icon: Shield, Component: SummariesTab },
  { key: TABS.DOCS, label: "Documents", Icon: FileText, Component: DocumentsTab },
];

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center">
    <Icon size={18} className="text-primary mr-2 shrink-0" />
    <div className="flex flex-col">
      <span className="text-xs font-medium text-primary uppercase">{label}</span>
      <span className="font-semibold text-primary">{value}</span>
    </div>
  </div>
);


// --- Main Health Records Component ---

export default function HealthRecords() {
  const [activeTab, setActiveTab] = useState(TABS.TESTS);
  const ActiveComponent = tabsConfig.find(t => t.key === activeTab).Component;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      
      <header className="mb-8 p-4 bg-white rounded-xl shadow-lg ">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
          My Health Records
        </h1>
      </header>

      {/* Tab Navigation */}
      <div className="flex space-x-2 md:space-x-4 p-1 bg-white rounded-xl shadow-lg border sticky top-0 z-20 overflow-x-auto mb-6">
        {tabsConfig.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-lg font-bold text-sm md:text-base whitespace-nowrap transition-all duration-300 ${
              activeTab === key 
                ? `${COLORS.primary} shadow-md` 
                : `hover:text-green-700`
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <section className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl min-h-[60vh] border border-gray-100">
        <ActiveComponent />
      </section>

    </div>
  );
}

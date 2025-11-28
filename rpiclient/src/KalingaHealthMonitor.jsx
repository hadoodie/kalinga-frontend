import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, User, Check, X, Thermometer, Heart, Save, ArrowRight, 
  Settings, Loader2, ScanLine, Power, CheckCircle, Server, 
  FileText, Trash2, UserPlus, History, Lock, Search
} from 'lucide-react';

// --- Configuration & Helpers ---

const getApiUrl = (port) => {
  // Determine backend URL based on current host
  const host = window.location.hostname || 'localhost'; 
  return `http://${host}:${port}`;
};

// Default API endpoints (Configurable via Settings UI)
const DEFAULT_HARDWARE_API = getApiUrl(5000); // Python Backend
const DEFAULT_DATABASE_API = `${getApiUrl(8000)}/api`; // Laravel/DB Backend

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">System Error</h1>
            <p className="text-slate-500 text-sm mb-4">Something went wrong in the application interface.</p>
            <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-left text-xs font-mono overflow-auto mb-6 max-h-32">
              {this.state.error && this.state.error.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main Application Component ---
function KalingaHealthMonitor() {
  const [step, setStep] = useState('WELCOME'); 
  
  // Settings State
  const [hardwareUrl, setHardwareUrl] = useState(DEFAULT_HARDWARE_API);
  const [databaseUrl, setDatabaseUrl] = useState(DEFAULT_DATABASE_API);
  const [showSettings, setShowSettings] = useState(false);
  
  // Patient Data State
  const [user, setUser] = useState(null); 
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  // Vitals Data State
  const [tempResult, setTempResult] = useState(0);
  const [pulseResult, setPulseResult] = useState({ bpm: 0, spo2: 0 });
  const [signalStrength, setSignalStrength] = useState(0);
  
  // UI/Scanner State
  const [qrInput, setQrInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [camLoading, setCamLoading] = useState(false);
  
  // Refs for Scanner
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const stepRef = useRef(step); // Ref to track step inside intervals

  // CRUD / History State
  const [records, setRecords] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('');

  // Update stepRef whenever step changes
  useEffect(() => { stepRef.current = step; }, [step]);

  // --- API Wrapper ---
  const api = async (endpoint, method = 'GET', body = null) => {
    let baseUrl = hardwareUrl; 
    
    // Route traffic: /vitals goes to Database API, others to Hardware API
    if (endpoint.includes('/vitals')) baseUrl = databaseUrl; 

    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${cleanBase}${cleanEndpoint}`;

    try {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      
      const res = await fetch(fullUrl, opts);
      
      if (!res.ok) {
          // Attempt to read error text
          const text = await res.text().catch(() => "Unknown Error");
          throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}`);
      }
      
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch (e) {
      if (e.message.includes("Failed to fetch")) {
          console.error(`Fetch failed for ${fullUrl}`);
          throw new Error(`Connection Failed. Is the server at ${cleanBase} running?`);
      }
      throw e;
    }
  };

  // --- Identity Check Logic ---
  const checkPatientIdentity = async (scannedId, hardwareName) => {
      console.log("🔍 Checking Identity For ID:", scannedId);
      
      try {
          // Check DB for existing records to find name
          const data = await api('/vitals', 'GET');
          const allRecords = Array.isArray(data) ? data : [];
          
          const existingRecord = allRecords.find(r => 
              String(r.patient_id).trim().toLowerCase() === String(scannedId).trim().toLowerCase()
          );
          
          if (existingRecord) {
              return { 
                  found: true, 
                  name: existingRecord.patient_name || "Unnamed Patient", 
                  role: 'Patient' 
              };
          }
      } catch (e) {
          console.warn("DB Check Failed, falling back to hardware name or new user:", e);
      }

      // Fallback to name provided by hardware QR scan if available
      if (hardwareName && !["Unknown Visitor", "New Patient", "Manual Patient"].includes(hardwareName)) {
          return { found: true, name: hardwareName, role: 'Visitor' };
      }

      return { found: false, name: '', role: 'New' };
  };

  const handleScanProcess = async (id, hardwareName) => {
    stopCamera();
    setCamLoading(true);
    
    try {
      const result = await checkPatientIdentity(id, hardwareName);
      
      if (result.found) {
          setUser({ id, name: result.name, role: result.role });
          setStep('CONFIRM');
      } else {
          setUser({ id, name: '', role: 'New' });
          setStep('CREATE_USER');
      }
    } catch (error) {
      alert("Error processing scan: " + error.message);
    } finally {
      setCamLoading(false);
    }
  };

  // --- Camera & QR Scanning Logic ---
  
  // Manage Camera Life-cycle based on 'step'
  useEffect(() => {
    if (step === 'SCAN') {
        startCamera();
    } else {
        stopCamera();
    }
    return () => stopCamera();
  }, [step]);

  const startCamera = async () => {
      try {
          // Request camera access
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: "environment", width: { ideal: 640 } } 
          });
          
          streamRef.current = stream;
          
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              // Wait for video metadata to load before starting the scan loop
              videoRef.current.onloadedmetadata = () => {
                  videoRef.current.play().catch(e => console.error("Play error:", e));
                  startScanningLoop();
              };
          }
      } catch (e) {
          console.error("Camera access denied:", e);
          let errorMessage = "Camera error.";
          
          if (e.name === 'NotAllowedError') errorMessage = "Camera access denied. Please allow permissions.";
          else if (e.name === 'NotFoundError') errorMessage = "No camera found.";
          else if (e.name === 'NotReadableError') errorMessage = "Camera is in use by another app.";
          else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
             errorMessage = "Camera requires HTTPS or localhost.";
          }
          
          alert(`${errorMessage} Please use manual input.`);
      }
  };

  const stopCamera = () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
  };

  const startScanningLoop = () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      
      // Send frame to backend every 800ms
      scanIntervalRef.current = setInterval(async () => {
          if (stepRef.current !== 'SCAN') return;
          await captureAndDecode();
      }, 800);
  };

  const captureAndDecode = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.readyState !== 4) return; // Ensure video has data

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Scale down for performance (width 480px)
    const scale = 480 / video.videoWidth;
    const w = 480;
    const h = video.videoHeight * scale;

    canvas.width = w;
    canvas.height = h;
    context.drawImage(video, 0, 0, w, h);

    // Convert to Base64 (JPEG 0.7 quality)
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.7);

    try {
        // Post to python backend
        const res = await api('/api/scan-image', 'POST', { image: imageBase64 });
        
        if (res.found) {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            await handleScanProcess(res.id, res.user?.name);
        }
    } catch (e) {
        // Ignore network hiccups during scanning loop
        console.warn("Scan check skipped:", e.message);
    }
  };

  const handleManualScan = async (e) => {
    e.preventDefault();
    const code = qrInput.trim();
    if (!code) return;
    stopCamera();
    await handleScanProcess(code, null);
    setQrInput('');
  };

  // --- Admin / User Editing ---
  const toggleNameEdit = () => {
      if (isEditingName) {
          // Save changes
          setUser({ ...user, name: tempName });
          setIsEditingName(false);
      } else {
          // Auth check
          const password = prompt("🔐 Admin Access Required\nEnter Password (default: admin123):");
          if (password === "admin123") {
              setTempName(user.name);
              setIsEditingName(true);
          } else if (password !== null) {
              alert("❌ Access Denied");
          }
      }
  };
  
  const saveNewUser = (e) => {
      e.preventDefault();
      if(!user.name) return alert("Please enter a name");
      setStep('CONFIRM');
  };

  // --- Sensor Logic ---
  
  const runTempCheck = () => {
    setStep('TEMP'); 
    setProgress(0); 
    setStatusMsg('Scanning Temp...');
    
    let ticks = 0;
    const interval = setInterval(async () => {
      if (stepRef.current !== 'TEMP') { clearInterval(interval); return; }
      
      ticks++; 
      setProgress(Math.min(ticks * 10, 100)); 
      
      try {
        const data = await api('/api/temp');
        if (data.temp_c > 0) setTempResult(data.temp_c);
      } catch(e) {
          console.warn("Temp read error", e);
      }

      // Finish after ~5 seconds (10 ticks * 500ms)
      if (ticks >= 10) { 
          clearInterval(interval); 
          setStep('PULSE_PREP'); 
      }
    }, 500);
  };

  const runPulseCheck = () => {
    setStep('PULSE'); 
    setProgress(0); 
    setStatusMsg('Place finger on sensor...'); 
    setSignalStrength(0);
    
    let ticks = 0;
    const interval = setInterval(async () => {
      if (stepRef.current !== 'PULSE') { clearInterval(interval); return; }
      
      try {
        const data = await api('/api/pulse-stream');
        
        // Visualize signal strength based on raw IR data
        // Assumption: raw_ir usually > 1000 when finger is present
        const sig = Math.min(Math.max(((data.raw_ir||0) - 1000) / 300, 0), 100);
        setSignalStrength(sig);
        
        if (!data.finger_detected) {
            setStatusMsg('Please place finger...');
            return;
        }

        setStatusMsg(`Reading... BPM: ${data.bpm}`);
        ticks++; 
        setProgress(Math.min(ticks * 4, 100)); // ~5 seconds (25 ticks * 200ms)

        if (ticks >= 25) {
          clearInterval(interval);
          setPulseResult({ bpm: data.bpm, spo2: data.spo2 });
          setStep('SUMMARY');
        }
      } catch(e) {
          console.warn("Pulse read error", e);
      }
    }, 200); 
  };

  const saveToLaravel = async () => {
    setStep('SAVING');
    try {
        const payload = {
          patient_id: user.id,
          patient_name: user.name, 
          temperature: tempResult,
          bpm: pulseResult.bpm,
          spo2: pulseResult.spo2
        };
        await api('/vitals', 'POST', payload);
        setStep('DONE');
    } catch(e) { 
        alert("Save failed: " + e.message); 
        setStep('SUMMARY'); 
    }
  };

  // --- History / CRUD ---
  
  const loadHistory = async (filterId = null) => {
    setStep('HISTORY_LOADING');
    try {
      const data = await api('/vitals', 'GET');
      const allRecords = Array.isArray(data) ? data : [];
      
      if (filterId) {
          setHistoryFilter(filterId);
          setRecords(allRecords.filter(r => String(r.patient_id) === String(filterId)));
      } else {
          setHistoryFilter('');
          setRecords(allRecords);
      }
      setStep('HISTORY');
    } catch (e) { 
        alert("Load Failed: " + e.message); 
        setStep('WELCOME'); 
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Are you sure you want to delete this record?")) return;
    try {
      await api(`/vitals/${id}`, 'DELETE');
      setRecords(records.filter(r => r.id !== id));
    } catch (e) { 
        alert("Delete Failed: " + e.message); 
    }
  };

  // --- Reset & Format ---
  const reset = () => { 
      setUser(null); 
      setTempResult(0); 
      setPulseResult({ bpm: 0, spo2: 0 }); 
      setStep('WELCOME'); 
  };
  
  const formatNum = (n) => n ? Number(n).toFixed(1) : "--";

  // --- Components ---

  const PatientBanner = () => {
    if (!user || ['WELCOME', 'SCAN', 'HISTORY', 'HISTORY_LOADING'].includes(step)) return null;
    return (
      <div className="w-full max-w-lg bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between mb-6 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <User size={20} />
            </div>
            <div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Patient</div>
                <div className="text-lg font-bold text-blue-900 leading-none">{user.name}</div>
            </div>
        </div>
        <div className="text-right">
            <div className="text-xs text-blue-400 font-mono bg-blue-100 px-2 py-1 rounded">ID: {user.id}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative flex flex-col items-center justify-center p-6 transition-all">
      
      {/* SETTINGS BUTTON & MODAL */}
      <button 
        onClick={() => setShowSettings(!showSettings)} 
        className="absolute top-6 right-6 text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
      >
        <Settings size={24}/>
      </button>
      
      {showSettings && (
        <div className="absolute top-16 right-6 bg-white p-5 shadow-2xl rounded-2xl border border-slate-100 w-80 z-50 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Server size={16}/> API Configuration
          </h3>
          <div className="mb-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hardware API URL</label>
            <input 
                value={hardwareUrl} 
                onChange={e => setHardwareUrl(e.target.value)} 
                className="w-full border border-slate-200 bg-slate-50 p-2 text-xs font-mono rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Database API URL</label>
            <input 
                value={databaseUrl} 
                onChange={e => setDatabaseUrl(e.target.value)} 
                className="w-full border border-slate-200 bg-slate-50 p-2 text-xs font-mono rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={() => setShowSettings(false)} 
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-xs font-bold transition-colors"
          >
            Save & Close
          </button>
        </div>
      )}

      {/* PATIENT HEADER */}
      <PatientBanner />

      {/* STEP: WELCOME */}
      {step === 'WELCOME' && (
        <div className="text-center max-w-md w-full animate-in zoom-in-95 duration-300">
          <div className="mb-8 relative">
             <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-200 mb-6 rotate-3">
                <Activity size={48} className="text-white" />
             </div>
             <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                Kalinga<span className="text-blue-600">Health</span>
             </h1>
             <p className="text-slate-500 mt-2 font-medium">Smart Triage System</p>
          </div>
          <div className="flex gap-4 flex-col">
            <button 
                onClick={() => setStep('SCAN')} 
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 hover:scale-[1.02] transition-all"
            >
                <Power size={20} /> Start Assessment
            </button>
            <button 
                onClick={() => loadHistory(null)} 
                className="w-full py-4 bg-white text-slate-700 font-bold rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors"
            >
                <FileText size={20} /> View All Records
            </button>
          </div>
        </div>
      )}

      {/* STEP: SCANNING */}
      {step === 'SCAN' && (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-xl animate-in fade-in slide-in-from-bottom-4">
           <ScanLine size={48} className="text-blue-600 mx-auto mb-6" />
           <h1 className="text-2xl font-bold mb-2 text-slate-800">Scan QR Code</h1>
           <p className="text-slate-400 text-sm mb-6">Point camera at patient ID card</p>
           
           {/* LIVE CAMERA VIEW */}
           <div className="mb-6 relative bg-slate-950 rounded-xl overflow-hidden aspect-video shadow-inner">
               <video 
                  ref={videoRef} 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover opacity-90"
               ></video>
               {/* Hidden Canvas for Frame Capture */}
               <canvas ref={canvasRef} className="hidden"></canvas>
               
               {/* TARGET OVERLAY */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-48 h-48 border-2 border-green-500/80 rounded-lg relative bg-transparent shadow-[0_0_0_100vh_rgba(0,0,0,0.5)]">
                       {/* Animated Scan Line */}
                       <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 shadow-[0_0_10px_#4ade80] animate-[bounce_2s_infinite]"></div>
                       
                       {/* Corners */}
                       <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-0.5 -ml-0.5"></div>
                       <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-0.5 -mr-0.5"></div>
                       <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-0.5 -ml-0.5"></div>
                       <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-0.5 -mr-0.5"></div>
                   </div>
               </div>
               
               {camLoading && (
                   <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                       <Loader2 className="animate-spin text-white w-10 h-10 mb-3"/>
                       <div className="text-white font-bold text-sm tracking-wide">VERIFYING ID...</div>
                   </div>
               )}
           </div>

           {/* MANUAL INPUT */}
           <div className="relative mb-6">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
             <div className="relative flex justify-center text-xs font-bold"><span className="px-2 bg-white text-slate-300">OR ENTER MANUALLY</span></div>
           </div>
           
           <form onSubmit={handleManualScan} className="flex gap-2">
               <div className="relative flex-1">
                 <input 
                    value={qrInput} 
                    onChange={e=>setQrInput(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                    placeholder="Enter Patient ID"
                 />
                 <Search size={18} className="absolute left-3 top-3.5 text-slate-400"/>
               </div>
               <button type="submit" className="px-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">
                 <ArrowRight size={20}/>
               </button>
           </form>

           <button onClick={reset} className="mt-6 text-slate-400 font-bold text-xs hover:text-red-500 transition-colors uppercase tracking-wider">Cancel Assessment</button>
        </div>
      )}

      {/* STEP: CREATE NEW USER */}
      {step === 'CREATE_USER' && (
          <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-xl animate-in zoom-in-95">
              <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus size={32} className="text-amber-500"/>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-800">New Patient Found</h2>
              <p className="text-slate-500 mb-6">
                ID <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">{user.id}</span> is not registered.
              </p>
              
              <form onSubmit={saveNewUser}>
                  <div className="text-left mb-6">
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Full Name</label>
                      <input 
                        className="w-full p-4 border-2 border-slate-100 rounded-xl font-bold text-lg text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="e.g. Juan Dela Cruz" 
                        value={user.name} 
                        onChange={e => setUser({...user, name: e.target.value})} 
                        autoFocus 
                      />
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors shadow-lg shadow-blue-200">
                    <Save size={20}/> Register & Continue
                  </button>
              </form>
          </div>
      )}

      {/* STEP: CONFIRM PATIENT */}
      {step === 'CONFIRM' && (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-xl animate-in fade-in">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <User size={40} className="text-slate-300" />
          </div>
          
          <div className="mb-8">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Patient</div>
              
              {/* Name Display / Edit Mode */}
              {isEditingName ? (
                  <div className="flex gap-2 justify-center animate-in fade-in">
                      <input 
                        className="border-b-2 border-blue-500 text-2xl font-bold text-slate-800 text-center w-full outline-none pb-1 bg-transparent" 
                        value={tempName} 
                        onChange={e => setTempName(e.target.value)} 
                      />
                      <button onClick={toggleNameEdit} className="text-green-600 p-2 bg-green-50 rounded-lg hover:bg-green-100">
                        <Check size={20}/>
                      </button>
                  </div>
              ) : (
                  <div 
                    className="flex items-center justify-center gap-2 group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors" 
                    onClick={toggleNameEdit}
                    title="Click to edit name (Admin)"
                  >
                      <h1 className="text-3xl font-bold text-slate-800">{user?.name}</h1>
                      <Lock size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                  </div>
              )}
              
              <div className="mt-2 text-slate-500 font-mono text-sm bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-100">
                ID: {user?.id}
              </div>
          </div>

          <div className="flex flex-col gap-3">
             <button 
                onClick={() => setStep('TEMP_START')} 
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex justify-center items-center gap-2 transition-all hover:scale-[1.02]"
             >
                <Activity size={20}/> Start Vitals Check
             </button>
             
             <div className="flex gap-3">
                 <button 
                    onClick={() => loadHistory(user.id)} 
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors"
                 >
                    <History size={18}/> History
                 </button>
                 <button 
                    onClick={reset} 
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 rounded-xl font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors"
                 >
                    Cancel
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* STEP: HISTORY TABLE */}
      {step === 'HISTORY' && (
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[80vh] animate-in fade-in slide-in-from-bottom-8">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText size={20}/></div>
                    {historyFilter ? (
                        <span>History: <span className="text-blue-600">{user?.name}</span></span>
                    ) : "All Medical Records"}
                </h2>
                <div className="flex gap-2">
                    {historyFilter && (
                        <button onClick={() => loadHistory(null)} className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                            Show All
                        </button>
                    )}
                    <button onClick={reset} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                        <X size={24}/>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1 p-0 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-5 font-medium">Patient ID</th>
                            <th className="p-5 font-medium">Name</th>
                            <th className="p-5 font-medium">Temp</th>
                            <th className="p-5 font-medium">BPM</th>
                            <th className="p-5 font-medium">SpO2</th>
                            <th className="p-5 font-medium">Timestamp</th>
                            <th className="p-5 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300">
                                        <FileText size={48} className="mb-4 opacity-50"/>
                                        <p>No records found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : records.map(r => (
                            <tr key={r.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="p-5 font-mono font-bold text-blue-600">{r.patient_id}</td>
                                <td className="p-5 font-bold text-slate-700">{r.patient_name || "--"}</td>
                                <td className="p-5">
                                    <span className={`font-bold ${r.temperature > 37.5 ? 'text-red-500' : 'text-slate-600'}`}>
                                        {r.temperature}°C
                                    </span>
                                </td>
                                <td className="p-5 font-mono text-slate-600">{r.bpm}</td>
                                <td className="p-5 font-mono text-slate-600">{r.spo2}%</td>
                                <td className="p-5 text-slate-400 text-xs font-medium">
                                    {new Date(r.created_at || Date.now()).toLocaleString()}
                                </td>
                                <td className="p-5 text-right">
                                    <button 
                                        onClick={() => handleDelete(r.id)} 
                                        className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                        title="Delete Record"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* STEP: START TEMPERATURE */}
      {step === 'TEMP_START' && (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-xl animate-in zoom-in-95">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Thermometer size={48} className="text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Check Temperature</h2>
          <p className="text-slate-500 mb-8">Align sensor with forehead</p>
          <button 
            onClick={runTempCheck} 
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
          >
            Start Scan
          </button>
        </div>
      )}

      {/* STEP: ACTIVE MEASUREMENT (TEMP or PULSE) */}
      {(step === 'TEMP' || step === 'PULSE') && (
        <div className="text-center max-w-md w-full animate-in fade-in">
           <div className="mb-8 relative inline-block">
               {step === 'TEMP' ? (
                   <Thermometer size={80} className="text-orange-500 animate-pulse drop-shadow-xl"/>
               ) : (
                   <div className="relative">
                       <Heart size={80} className="text-red-500 animate-pulse drop-shadow-xl"/>
                       {/* Signal strength indicator ring */}
                       <svg className="absolute -top-4 -left-4 w-28 h-28 -rotate-90">
                           <circle cx="56" cy="56" r="52" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200" />
                           <circle cx="56" cy="56" r="52" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-red-500 transition-all duration-300" strokeDasharray={326} strokeDashoffset={326 - (326 * signalStrength / 100)} />
                       </svg>
                   </div>
               )}
           </div>
           
           <h2 className="text-6xl font-black mb-4 text-slate-800 font-mono tracking-tighter">
             {step === 'TEMP' ? formatNum(tempResult) : signalStrength > 0 ? "..." : "--"}
             <span className="text-2xl text-slate-400 ml-2 font-sans font-bold">
                 {step === 'TEMP' ? '°C' : 'BPM'}
             </span>
           </h2>
           
           <p className="text-slate-500 mb-8 font-medium animate-pulse">{statusMsg}</p>
           
           {/* Progress Bar */}
           <div className="w-64 mx-auto h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
               <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out" 
                  style={{width: `${progress}%`}}
               ></div>
           </div>
        </div>
      )}

      {/* STEP: PREP FOR PULSE */}
      {step === 'PULSE_PREP' && (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-xl animate-in slide-in-from-right-8">
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-8 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Thermometer size={20}/></div>
                  <span className="font-bold text-slate-500 text-sm uppercase">Temperature</span>
              </div>
              <span className="text-3xl font-bold text-slate-800">{formatNum(tempResult)}°C</span>
          </div>
          
          <h3 className="text-xl font-bold mb-2">Next: Heart Rate</h3>
          <p className="text-slate-400 text-sm mb-6">Place finger gently on the sensor</p>

          <button 
            onClick={runPulseCheck} 
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-blue-200"
          >
            Start Pulse Check <ArrowRight size={20}/>
          </button>
        </div>
      )}

      {/* STEP: SUMMARY & SAVE */}
      {step === 'SUMMARY' && (
        <div className="w-full max-w-xl bg-white p-8 rounded-3xl shadow-xl text-center animate-in zoom-in-95">
          <h1 className="text-2xl font-bold mb-8 text-slate-800">Assessment Complete</h1>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Temp Card */}
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-2">Temp</div>
                <div className="text-3xl font-black text-slate-800">{formatNum(tempResult)}</div>
                <div className="text-xs text-slate-400 font-bold mt-1">°C</div>
            </div>
            
            {/* BPM Card */}
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="text-xs text-red-500 font-bold uppercase tracking-wider mb-2">Heart Rate</div>
                <div className="text-3xl font-black text-slate-800">{pulseResult.bpm}</div>
                <div className="text-xs text-slate-400 font-bold mt-1">BPM</div>
            </div>
            
            {/* SpO2 Card */}
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-2">Oxygen</div>
                <div className="text-3xl font-black text-slate-800">{pulseResult.spo2}<span className="text-lg text-slate-400">%</span></div>
                <div className="text-xs text-slate-400 font-bold mt-1">SpO2</div>
            </div>
          </div>
          
          <div className="flex gap-4">
             <button 
                onClick={() => setStep('PULSE_PREP')} 
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
             >
                Retake Pulse
             </button>
             <button 
                onClick={saveToLaravel} 
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-colors flex items-center justify-center gap-2"
             >
                <Save size={18}/> Save Record
             </button>
          </div>
        </div>
      )}

      {/* STEP: SUCCESS STATE */}
      {(step === 'SAVING' || step === 'DONE') && (
        <div className="text-center animate-in zoom-in-95">
          <div className="mb-6">
              {step === 'SAVING' ? (
                  <Loader2 size={80} className="text-blue-500 animate-spin mx-auto"/>
              ) : (
                  <CheckCircle size={80} className="text-green-500 mx-auto animate-bounce-short"/>
              )}
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-slate-800">
            {step === 'SAVING' ? 'Saving...' : 'Record Saved!'}
          </h2>
          <p className="text-slate-400 mb-8">
            {step === 'SAVING' ? 'Syncing with database' : 'Data has been securely stored.'}
          </p>
          
          {step === 'DONE' && (
            <button 
                onClick={reset} 
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all hover:scale-105 shadow-xl"
            >
                Next Patient
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <KalingaHealthMonitor />
    </ErrorBoundary>
  );
}

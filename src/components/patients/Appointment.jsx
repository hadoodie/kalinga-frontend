import { useState, useEffect } from "react";
import { 
  CalendarCheck, Clock3, History, ChevronRight, X, CalendarPlus, 
  Bell, Info, ArrowRight, CornerUpLeft, User, Phone, Mail, FileText,
  MapPin, CheckCircle, AlertCircle, ChevronLeft, QrCode
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import api from "../../services/api"; 

// --- Configuration & Constants ---
const TABS = {
  UPCOMING: "Upcoming",
  PAST: "Past",
};

const COLORS = {
  primary: "bg-primary hover:bg-[#143d31]", 
  primaryText: "text-primary",
  secondary: "bg-gray-100 hover:bg-gray-200 text-primary",
  danger: "bg-red-500 hover:bg-red-600",
  status: {
    Upcoming: "bg-yellow-50 text-yellow-700 border-yellow-200 border",
    Past: "bg-gray-50 text-gray-600 border-gray-200 border",
  }
};

// --- Helper Components ---

const InputField = ({ label, value, onChange, type = "text", placeholder, required = true, align = "" }) => (
  <div className={`flex flex-col gap-1 ${align}`}>
    <label className="text-xs font-bold text-primary uppercase">{label}{required && <span className="text-red-500">*</span>}</label>
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 md:p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm transition"
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    // Full screen overlay with z-index 50 to sit on top of everything
    <div className="fixed inset-0 flex justify-center items-end sm:items-center sm:p-4 z-50 backdrop-blur-md bg-black/30">
      <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-4xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
        <div className="p-4 sm:p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className={`text-lg sm:text-xl font-extrabold ${COLORS.primaryText}`}>{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition"><X size={24} className={COLORS.primaryText} /></button>
        </div>
        <div className="p-4 sm:p-6 flex-grow overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const AppointmentCard = ({ appointment, onSelect }) => {
  const statusClasses = COLORS.status[appointment.status] || COLORS.status.Upcoming;
  const formatDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition duration-200 hover:shadow-lg hover:border-primary group active:scale-[0.98]" onClick={() => onSelect(appointment)}>
      <div className="flex items-center gap-4 w-full sm:w-auto border-b sm:border-b-0 pb-3 sm:pb-0">
        <div className="text-center p-3 rounded-xl bg-green-50 text-primary font-bold w-16 sm:w-20 flex flex-col shrink-0 border border-green-100 group-hover:bg-primary group-hover:text-white transition-colors">
          <span className="text-[10px] sm:text-xs uppercase">{formatDate(appointment.date).split(' ')[0]}</span>
          <span className="text-2xl sm:text-3xl">{appointment.date.getDate()}</span>
        </div>
        <div className="flex flex-col flex-1 text-left">
          <p className={`text-sm font-semibold flex items-center gap-1 ${COLORS.primaryText}`}><Clock3 size={16} className="text-yellow-600" /> {appointment.time}</p>
          <p className={`text-base sm:text-lg font-bold ${COLORS.primaryText}`}>{appointment.hospital}</p>
          <p className="text-xs sm:text-sm text-gray-500">{appointment.service}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${statusClasses}`}>{appointment.status}</span>
        <button className="p-2 rounded-full text-gray-400 group-hover:text-primary hover:bg-green-50 transition" aria-label="View Details"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value, isLink = false }) => (
  <div className="flex items-start p-3 sm:p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-primary transition-colors">
    <Icon size={16} className="text-primary mr-2 mt-1 shrink-0" />
    <div className="flex flex-col text-left overflow-hidden">
      <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{label}</span>
      {isLink ? (
        <a href={label === "Email" ? `mailto:${value}` : `tel:${value}`} className="font-bold text-green-800 text-xs sm:text-sm hover:text-primary hover:underline truncate">{value}</a>
      ) : (
        <span className="font-bold text-green-800 text-xs sm:text-sm truncate">{value}</span>
      )}
    </div>
  </div>
);

// --- Updated AppointmentDetail (No longer contains the modal) ---
const AppointmentDetail = ({ appointment, onRequestCancel, onReschedule, onBack }) => {
  
  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Mobile Back Button */}
      <div className="lg:hidden flex items-center gap-2 pb-4 border-b border-gray-100 mb-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-primary">
            <ChevronLeft size={24} />
        </button>
        <h3 className="font-bold text-lg text-primary">Appointment Details</h3>
      </div>

      <div className="bg-green-50 p-5 rounded-xl border border-green-100 shadow-inner text-left">
        <h3 className="text-xs sm:text-sm font-bold text-green-800 flex items-center gap-2 mb-2 uppercase tracking-wide"><QrCode size={18} /> Reference: {appointment.id}</h3>
        <p className={`text-xl sm:text-2xl font-extrabold text-center ${COLORS.primaryText}`}>{appointment.hospital}</p>
        <p className="text-base sm:text-lg text-gray-600 font-medium text-center">{appointment.service}</p>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <DetailItem icon={CalendarCheck} label="Date" value={new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(appointment.date)} />
          <DetailItem icon={Clock3} label="Time" value={appointment.time} />
          <DetailItem icon={FileText} label="Reason" value={appointment.complaint} />
          <DetailItem icon={User} label="Patient" value={appointment.patientName} />
        </div>

        {appointment.instructions && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-left">
            <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-1 text-sm"><Bell size={16} /> Reminders</h4>
            <p className="text-sm text-yellow-900 leading-relaxed">{appointment.instructions}</p>
          </div>
        )}
      </div>

      {appointment.status === TABS.UPCOMING && (
        <div className="pt-4 border-t mt-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => onReschedule(appointment)} className={`flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition ${COLORS.secondary}`}>Reschedule</button>
            {/* Calls the parent function to open the global modal */}
            <button onClick={onRequestCancel} className={`flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition text-white ${COLORS.danger}`}>Cancel Appointment</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Booking Flow Steps ---

const StepTerms = ({ formData, updateForm }) => (
  <div className="space-y-6">
    <div className="prose max-w-none text-sm text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-200 h-64 overflow-y-auto text-justify">
      <p className="font-bold mb-2 text-primary">In English</p>
      <p className="mb-4">This appointment and scheduling system allocates slots on a first come, first served basis. There is no guarantee that a slot will always be available for a user's first choice.</p>
      <p className="mb-4">Users accept the responsibility for providing, checking and verifying the validity and accuracy of the information they provide on this system.</p>
      <p className="font-bold mb-2 text-primary">Sa Filipino</p>
      <p className="mb-4">Ang sistema ng appointment at pag-iskedyul na ito ay nagbibigay ng mga slot batay sa "first come, first served".</p>
      <p>Responsibilidad ng mga user ang magbigay, mag-check, at mag-verify ng katumpakan ng impormasyon.</p>
    </div>
    <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition active:bg-gray-100">
      <input 
        type="checkbox" 
        className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500" 
        checked={formData.agreedToTerms}
        onChange={(e) => updateForm('agreedToTerms', e.target.checked)}
      />
      <span className="text-sm text-gray-700">
        I have read and understood the instructions and information on this page, and agree to the Terms and Conditions. <br/>
        <em className="text-primary text-xs">Nabasa at naunawaan ko ang mga instruksyon at impormasyon...</em>
      </span>
    </label>
  </div>
);

const StepServices = ({ formData, updateForm }) => (
  <div className="space-y-6 max-w-2xl mx-auto py-4">
    <div className="space-y-2">
      <label className="text-sm font-bold text-primary">Hospital</label>
      <select 
        className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
        value={formData.hospital}
        onChange={(e) => updateForm('hospital', e.target.value)}
      >
        <option value="">Please Select Hospital</option>
        <option value="Philippine Heart Center">Philippine Heart Center</option>
        <option value="San Lazaro Hospital">San Lazaro Hospital</option>
        <option value="Jose R. Reyes Memorial Medical Center">Jose R. Reyes Memorial Medical Center</option>
        <option value="Dr. Jose Fabella Memorial Hospital">Dr. Jose Fabella Memorial Hospital</option>
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-sm font-bold text-primary">Type of Service</label>
      <select 
        className="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
        value={formData.serviceType}
        onChange={(e) => updateForm('serviceType', e.target.value)}
        disabled={!formData.hospital}
      >
        <option value="">Please Select Service</option>
        <option value="OPD - Internal Medicine">OPD - Internal Medicine</option>
        <option value="OPD - Cardiology">OPD - Cardiology</option>
        <option value="Pharmacy 4F (Pay)">Pharmacy 4F (Pay)</option>
        <option value="XRAY (One Stop Shop)">XRAY (One Stop Shop)</option>
        <option value="Laboratory">Laboratory</option>
      </select>
    </div>
  </div>
);

const StepSchedule = ({ formData, updateForm }) => (
  <div className="flex flex-col md:flex-row gap-8">
    <div className="flex-1">
      <label className="text-sm font-bold text-primary mb-2 block">Select Date (Pumili ng Petsa)</label>
      <input 
        type="date" 
        className="w-full p-4 text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
        value={formData.date}
        onChange={(e) => updateForm('date', e.target.value)}
        min={new Date().toISOString().split('T')[0]}
      />
      <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-xl border border-yellow-100 flex gap-2">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>Please select a date to see available time slots.</p>
      </div>
    </div>
    
    <div className="flex-1 border-l-0 md:border-l pl-0 md:pl-8 border-gray-200">
      <label className="text-sm font-bold text-primary mb-4 block">Select Time & Availability</label>
      {formData.date ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
           {["07:00:00", "08:00:00", "09:00:00", "10:00:00", "11:00:00", "13:00:00", "14:00:00"].map((time) => (
             <label key={time} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition active:scale-[0.98] ${formData.time === time ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50 border-gray-200'}`}>
               <div className="flex items-center gap-3">
                 <input 
                  type="radio" 
                  name="timeSlot" 
                  value={time} 
                  checked={formData.time === time}
                  onChange={(e) => updateForm('time', e.target.value)}
                  className="w-5 h-5 text-green-600 focus:ring-green-500"
                 />
                 <span className="font-mono font-medium text-lg">{time}</span>
               </div>
               <span className={`text-xs font-bold px-2 py-1 rounded ${formData.time === time ? 'bg-white/20' : 'bg-green-100 text-green-800'}`}>
                 {Math.floor(Math.random() * 10) + 1} Slots
               </span>
             </label>
           ))}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-xl p-8 border border-dashed">
          Select a date first
        </div>
      )}
    </div>
  </div>
);

const StepPatientInfo = ({ formData, updateForm }) => (
  <div className="space-y-4">
    <div className="bg-yellow-50 p-4 rounded-xl mb-6">
      <h3 className="font-bold text-green-900">Patient Information (Impormasyon ng Pasyente)</h3>
      <p className="text-xs text-green-700">Please ensure all data matches your valid government ID.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
      <InputField label="Last Name" value={formData.lastName} onChange={v => updateForm('lastName', v)} placeholder="Lastname" />
      <InputField label="First Name" value={formData.firstName} onChange={v => updateForm('firstName', v)} placeholder="Firstname" />
      <InputField label="Middle Name" value={formData.middleName} onChange={v => updateForm('middleName', v)} placeholder="Middlename" required={false} />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <InputField type="date" label="Date of Birth" value={formData.dob} onChange={v => updateForm('dob', v)} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-primary uppercase">Sex</label>
        <div className="flex flex-wrap gap-4 mt-2 items-center">
          <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"><input type="radio" name="sex" value="Male" checked={formData.sex === "Male"} onChange={() => updateForm('sex', 'Male')} /> Male</label>
          <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"><input type="radio" name="sex" value="Female" checked={formData.sex === "Female"} onChange={() => updateForm('sex', 'Female')} /> Female</label>
          <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"><input type="radio" name="sex" value="Other" checked={formData.sex === "Other"} onChange={() => updateForm('sex', 'Other')} /> Other</label>
        </div>
      </div>
    </div>

    <InputField label="House No, Street, Barangay" value={formData.address} onChange={v => updateForm('address', v)} align="text-left" />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <InputField label="Civil Status" value={formData.civilStatus} onChange={v => updateForm('civilStatus', v)} />
      <InputField label="Occupation" value={formData.occupation} onChange={v => updateForm('occupation', v)} />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <InputField type="email" label="Email Address" value={formData.email} onChange={v => updateForm('email', v)} required />
      <InputField type="tel" label="Contact No" value={formData.contactNo} onChange={v => updateForm('contactNo', v)} required />
    </div>

    <InputField label="Chief Complaint (Pangunahing sanhi ng pagbisita)" value={formData.complaint} onChange={v => updateForm('complaint', v)} required align="text-left" />
  </div>
);

const StepSummary = ({ formData, updateForm }) => (
  <div className="space-y-6">
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm text-yellow-800">
        <strong>Note:</strong> Please review your details carefully. You need to submit all information before the date is reserved.
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm border-t border-b py-6">
      <SummaryRow label="Hospital" value={formData.hospital} />
      <SummaryRow label="Service" value={formData.serviceType} />
      <SummaryRow label="Date" value={formData.date} />
      <SummaryRow label="Time" value={formData.time} />
      <SummaryRow label="Patient Name" value={`${formData.lastName}, ${formData.firstName} ${formData.middleName}`} />
      <SummaryRow label="Email" value={formData.email} />
      <SummaryRow label="Contact" value={formData.contactNo} />
      <SummaryRow label="Complaint" value={formData.complaint} />
    </div>

    {/* RECAPTCHA SECTION */}
    <div className="flex justify-center md:justify-start">
       <ReCAPTCHA
         sitekey="6LeOBSUsAAAAAN-o1st35LjjRFSVP1LvRgPg-Ix3" 
         onChange={(token) => updateForm('captchaToken', token)}
       />
    </div>
  </div>
);

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between md:block border-b md:border-none pb-2 md:pb-0 border-dashed border-gray-200">
    <span className="font-bold text-primary block text-xs uppercase">{label}</span>
    <span className="font-bold text-primary text-sm sm:text-base text-right md:text-left">{value || "-"}</span>
  </div>
);

const StepReceipt = ({ formData, onClose }) => (
  <div className="flex flex-col items-center justify-center space-y-6 text-center py-4">
     <div className="bg-green-100 p-4 rounded-full text-primary mb-2">
       <CheckCircle size={48} />
     </div>
     <h2 className="text-2xl font-bold text-primary underline">RESERVATION SUCCESSFUL</h2>
     
     <div className="w-full max-w-md bg-white border-2 border-dashed border-gray-300 p-6 rounded-xl space-y-4 relative">
        <div className="absolute top-4 right-4 opacity-50"><QrCode size={64} /></div>
        
        <div className="text-left space-y-2 text-sm">
           <p><span className="font-bold text-primary block text-xs">Patient Name:</span> <span className="font-bold uppercase">{formData.lastName}, {formData.firstName}</span></p>
           <p><span className="font-bold text-primary block text-xs">Schedule:</span> <span className="font-bold">{formData.date} ; {formData.time}</span></p>
           <p><span className="font-bold text-primary block text-xs">Hospital:</span> <span className="font-bold">{formData.hospital}</span></p>
           <p><span className="font-bold text-primary block text-xs">Service:</span> <span className="font-bold">{formData.serviceType}</span></p>
        </div>
     </div>

     <div className="text-left bg-gray-50 p-4 rounded-lg text-xs text-gray-600 border border-gray-200 w-full max-w-md">
        <p className="font-bold text-red-500 mb-1">NOTE:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>We highly recommend to follow the scheduled appointment date and time.</li>
          <li>If email address is not available please SCREENSHOT this form.</li>
          <li>Please bring this form together with a valid government-issued ID.</li>
        </ul>
     </div>

     <button onClick={onClose} className={`w-full max-w-md py-3 text-white rounded-xl font-bold shadow-lg ${COLORS.primary}`}>
       Done
     </button>
  </div>
);

// --- Booking Flow Controller ---
const BookingFlow = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    agreedToTerms: false,
    hospital: "",
    serviceType: "",
    date: "",
    time: "",
    lastName: "",
    firstName: "",
    middleName: "",
    dob: "",
    sex: "",
    address: "",
    civilStatus: "",
    occupation: "",
    email: "",
    contactNo: "",
    complaint: "",
    captchaToken: null,
  });

  const updateForm = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const STEPS_LABELS = ["Terms", "Services", "Schedule", "Patient Info", "Summary"];
  
  const handleNext = async () => {
    if (step === 1 && !formData.agreedToTerms) return alert("Please agree to the Terms.");
    if (step === 2 && (!formData.hospital || !formData.serviceType)) return alert("Please select Hospital and Service.");
    if (step === 3 && (!formData.date || !formData.time)) return alert("Please select Date and Time.");
    
    // If we are at the Summary step (Step 5), submitting moves us to Step 6 (Receipt)
    if (step === 5) {
        if (!formData.captchaToken) {
            return alert("Please complete the reCAPTCHA verification.");
        }

        setIsSubmitting(true);
        try {
            // Construct Payload for Backend
            const payload = {
                hospital: formData.hospital,
                service: formData.serviceType,
                appointment_at: `${formData.date} ${formData.time}`, // Combine Date & Time
                complaint: formData.complaint,
                patient_name: `${formData.firstName} ${formData.lastName}`,
                contact_email: formData.email,
                contact_phone: formData.contactNo,
                location: "Main Building", // Defaulting for now
                instructions: "Please arrive 30 mins early.", // Defaulting
                status: "upcoming", // CRITICAL: Explicitly set status to upcoming
                provider_name: "Assigned Physician", 
                provider_specialty: "General",
                recaptcha_token: formData.captchaToken
            };

            // Capture the response
            const response = await api.post('/book-appointment', payload);
            
            // CRITICAL: Call onSuccess immediately with the response data
            if (onSuccess) {
                onSuccess(response.data);
            }

            setStep(prev => prev + 1); // Move to Receipt
        } catch (error) {
            console.error("Booking Error:", error);
            alert("Failed to book appointment. " + (error.response?.data?.message || "Please check your inputs."));
        } finally {
            setIsSubmitting(false);
        }
    } else {
        setStep(prev => prev + 1);
    }
  };

  const handleBack = () => setStep(prev => prev - 1);

  return (
    <div className="flex flex-col h-full">
      {step < 6 && (
        <div className="flex justify-between items-center mb-6 px-2">
          {STEPS_LABELS.map((label, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step > idx + 1 ? 'bg-primary text-white' : step === idx + 1 ? 'bg-primary text-white ring-4 ring-green-100' : 'bg-gray-200 text-primary'}`}>
                 {step > idx + 1 ? <CheckCircle size={14} /> : idx + 1}
               </div>
               <span className={`text-[10px] mt-1 font-semibold uppercase ${step === idx + 1 ? 'text-primary' : 'text-gray-400'} hidden sm:block`}>{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-grow overflow-y-auto pb-4">
        {step === 1 && <StepTerms formData={formData} updateForm={updateForm} />}
        {step === 2 && <StepServices formData={formData} updateForm={updateForm} />}
        {step === 3 && <StepSchedule formData={formData} updateForm={updateForm} />}
        {step === 4 && <StepPatientInfo formData={formData} updateForm={updateForm} />}
        {step === 5 && <StepSummary formData={formData} updateForm={updateForm} />}
        {step === 6 && <StepReceipt formData={formData} onClose={onClose} />}
      </div>

      {step < 6 && (
        <div className="flex justify-between pt-4 mt-auto border-t border-gray-100 bg-white sticky bottom-0">
          {step > 1 ? (
            <button onClick={handleBack} className="px-6 py-3 rounded-xl font-bold text-primary hover:bg-gray-100 transition flex items-center gap-2" disabled={isSubmitting}>
              <ChevronLeft size={20} /> Back
            </button>
          ) : <div></div>}
          
          <button 
            onClick={handleNext} 
            className={`px-8 py-3 text-white rounded-xl font-bold shadow-lg transition flex items-center gap-2 ${(!formData.agreedToTerms && step === 1) || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : COLORS.primary}`}
            disabled={(step === 1 && !formData.agreedToTerms) || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : (step === 5 ? 'Submit' : 'Next')} <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Appointments Scheduler Component ---
export default function Appointments() {
  const [activeTab, setActiveTab] = useState(TABS.UPCOMING);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // NEW: State for the global Cancel Modal (outside the sidebar)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/appointments');
      
      // Map Laravel snake_case to Frontend Format
      const formattedData = response.data.map(app => {
          const appDate = new Date(app.appointment_at);
          // Capitalize status correctly for tab matching
          const rawStatus = app.status || 'upcoming';
          const formattedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

          return {
              id: app.id,
              hospital: app.hospital,
              service: app.service,
              patientName: app.patient_name || "Self",
              complaint: app.complaint,
              date: appDate,
              time: appDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              location: app.location || "Main Lobby",
              status: formattedStatus, 
              instructions: app.instructions,
              contact: { email: app.contact_email, phone: app.contact_phone },
          };
      });

      // SORT: Ensure nearest upcoming dates are at the top
      formattedData.sort((a, b) => a.date - b.date);

      setAppointments(formattedData);
      
      // IMPORTANT: Return data for use in handlers
      return formattedData;
    } catch (err) {
      console.error(err);
      setError("Failed to load appointments.");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(
    (app) => app.status === activeTab
  );

  // UPDATED: Function to handle actual cancellation
  const confirmCancel = async () => {
    if (!selectedAppointment) return;
    
    try {
        await api.delete(`/appointments/${selectedAppointment.id}`);
        alert("Appointment has been cancelled.");
        setIsCancelModalOpen(false); // Close modal
        setSelectedAppointment(null); // Clear selection
        fetchAppointments(); // Refresh list
    } catch (err) {
        alert("Failed to cancel appointment.");
    }
  };

  // NEW HANDLER: Automatically selects the newly booked appointment
  const handleBookingSuccess = async (newAppointmentRaw) => {
    // 1. Refresh list and get valid data
    const allAppointments = await fetchAppointments();
    
    // 2. Find the new item in the list
    if (newAppointmentRaw && newAppointmentRaw.id) {
        const newItem = allAppointments.find(app => app.id === newAppointmentRaw.id);
        if (newItem) {
            setSelectedAppointment(newItem);
        }
    }
  };

  const handleReschedule = (app) => {
    setIsBookingModalOpen(true);
    setSelectedAppointment(null);
  };

  const handleAddToCalendar = (app) => {
    alert(`Exporting appointment at ${app.hospital} to your calendar!`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans pb-20 sm:pb-8">
      
      <header className="mb-6 p-4 bg-background">
        <h1 className={`text-3xl md:text-4xl font-extrabold text-primary text-left`}>
          Appointments
        </h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 relative">
        <section className="lg:w-7/12 flex-grow space-y-6">
          {/* Tabs and Request Button Container */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 border-b border-gray-200 pb-0 gap-4 sm:gap-0">
             {/* Tabs - Updated Style */}
             <div className="flex space-x-6 w-full sm:w-auto">
                <button 
                  onClick={() => setActiveTab(TABS.UPCOMING)} 
                  className={`
                    pb-3 px-2 font-bold text-sm transition-all duration-200 border-b-4 flex-1 sm:flex-none text-center
                    ${activeTab === TABS.UPCOMING 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-400 hover:text-primary'
                    }
                  `}
                >
                  Upcoming
                </button>
                <button 
                  onClick={() => setActiveTab(TABS.PAST)} 
                  className={`
                    pb-3 px-2 font-bold text-sm transition-all duration-200 border-b-4 flex-1 sm:flex-none text-center
                    ${activeTab === TABS.PAST 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-400 hover:text-primary'
                    }
                  `}
                >
                  Past
                </button>
             </div>

             {/* Moved Request Button */}
             <button onClick={() => setIsBookingModalOpen(true)} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2 mb-2 font-bold rounded-xl text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all ${COLORS.primary} text-sm`}>
                <CalendarPlus size={16} /> Book Appointment
             </button>
          </div>

          <div className="space-y-4 pb-12 sm:pb-0">
            {isLoading ? (
              <p className="p-12 text-center text-gray-400 animate-pulse">Loading appointments...</p>
            ) : error ? (
              <div className="p-6 text-center bg-red-50 rounded-xl border border-red-100 text-red-600 flex flex-col items-center">
                <AlertCircle size={32} className="mb-2" />
                {error}
              </div>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((app) => (
                <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} />
              ))
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <CalendarPlus size={48} className="mb-4 opacity-20" />
                <p className="font-medium">No {activeTab.toLowerCase()} appointments found.</p>
                {activeTab === TABS.UPCOMING && <p className="text-sm mt-2 text-primary cursor-pointer hover:underline" onClick={() => setIsBookingModalOpen(true)}>Book one now?</p>}
              </div>
            )}
          </div>
        </section>

        {/* RESPONSIVE DETAILS PANEL */}
        {/* On Mobile: Full screen fixed overlay when selected */}
        {/* On Desktop: Standard sidebar column */}
        <aside className={`
            fixed inset-0 z-40 bg-white overflow-y-auto transition-transform duration-300 ease-in-out p-4
            lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:overflow-visible lg:p-0 lg:w-5/12 lg:block lg:transform-none lg:transition-none
            ${selectedAppointment ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="bg-white rounded-2xl shadow-none lg:shadow-xl border-none lg:border border-gray-100 lg:p-6 transition duration-300 min-h-[500px] h-full">
            {selectedAppointment ? (
              <AppointmentDetail 
                appointment={selectedAppointment} 
                // NEW: Pass function to trigger the global modal
                onRequestCancel={() => setIsCancelModalOpen(true)}
                onReschedule={handleReschedule} 
                onAddToCalendar={handleAddToCalendar}
                onBack={() => setSelectedAppointment(null)} // Only shows on mobile
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[450px] text-center p-8 opacity-60">
                <div className="bg-gray-50 p-6 rounded-full mb-6">
                   <Info size={48} className="text-primary" />
                </div>
                <h3 className={`text-xl font-bold ${COLORS.primaryText}`}>No Appointment Selected</h3>
                <p className="text-primary mt-2 max-w-xs">Click on any appointment card on the left to view full details, instructions, and actions.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
      
      {/* Booking Modal */}
      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Patient Appointment System">
        <BookingFlow onClose={() => setIsBookingModalOpen(false)} onSuccess={handleBookingSuccess} />
      </Modal>

      {/* NEW LOCATION: Cancel Confirmation Modal (Global Level) */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Appointment?">
         {selectedAppointment && (
            <div className="flex flex-col items-center gap-6 p-4">
              <p className="text-lg text-red-700 text-center">Are you sure you want to cancel your appointment at <span className="font-bold">{selectedAppointment.hospital}</span>?</p>
              <div className="flex flex-col sm:flex-row w-full gap-3 mt-4">
                <button onClick={() => setIsCancelModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-primary bg-gray-100 hover:bg-gray-200 transition">No, Keep</button>
                <button onClick={confirmCancel} className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition">Yes, Cancel</button>
              </div>
            </div>
         )}
      </Modal>

    </div>
  );
}
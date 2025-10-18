import { useState, useEffect } from "react";
import { 
    CalendarCheck, Clock3, History, ChevronRight, X, CalendarPlus, 
    Bell, Info, ArrowRight, CornerUpLeft, User, Phone, Mail, FileText 
} from "lucide-react";
import api from "../../services/api"; 

// Configuration
const TABS = {
  UPCOMING: "Upcoming",
  PAST: "Past",
};

const COLORS = {
  primary: "bg-primary hover:bg-green-700",
  secondary: "bg-gray-200 hover:bg-gray-300 text-primary",
  danger: "bg-red-500 hover:bg-red-600",
  accent: "text-yellow-500",
  status: {
    Upcoming: "bg-blue-100 text-blue-700 border-blue-300",
    Past: "bg-gray-100 text-primary border-gray-300",
  }
};

// --- Sub-Components ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition"><X size={24} className="text-primary" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const AppointmentCard = ({ appointment, onSelect }) => {
  const statusClasses = COLORS.status[appointment.status];
  const formatDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);

  return (
    <div className="bg-background rounded-xl shadow-lg border border-gray-100 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition duration-200 hover:shadow-xl hover:border-green-300" onClick={() => onSelect(appointment)}>
      <div className="flex items-center gap-4 w-full sm:w-auto border-b sm:border-b-0 pb-3 sm:pb-0">
        <div className="text-center p-3 rounded-lg text-green-700 font-bold w-16 flex flex-col shrink-0">
          <span className="text-xl">{formatDate(appointment.date).split(' ')[0]}</span>
          <span className="text-3xl">{appointment.date.getDate()}</span>
        </div>
        <div className="flex flex-col flex-1 text-left">
          <p className="text-sm font-semibold text-primary flex items-center gap-1"><Clock3 size={16} className={COLORS.accent} /> {appointment.time}</p>
          <p className="text-lg font-bold text-primary">{appointment.provider}</p>
          <p className="text-sm text-primary">{appointment.specialty}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${statusClasses}`}>{appointment.status}</span>
        <button className="p-2 rounded-full text-green-600 hover:bg-green-50 transition" aria-label="View Details"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

const AppointmentDetail = ({ appointment, onCancel, onReschedule, onAddToCalendar }) => (
  <div className="space-y-6">
    <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-inner">
      <h3 className="text-lg font-bold text-green-800 flex items-center gap-2 mb-1"><CalendarCheck size={20} /> Scheduled Visit</h3>
      <p className="text-3xl font-extrabold text-primary">{appointment.provider}</p>
      <p className="text-lg text-primary">{appointment.specialty}</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-left text-primary">
      <DetailItem icon={CalendarCheck} label="Date" value={new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(appointment.date)} />
      <DetailItem icon={Clock3} label="Time" value={appointment.time} />
      <DetailItem icon={ArrowRight} label="Reason" value={appointment.reason} />
      <DetailItem icon={CornerUpLeft} label="Location" value={appointment.location} />
      <DetailItem icon={Phone} label="Contact" value={appointment.contact.phone} isLink />
      <DetailItem icon={Mail} label="Email" value={appointment.contact.email} isLink />
    </div>
    {appointment.instructions && (
      <div className="p-4 bg-yellow-50 rounded-lg shadow-sm">
        <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-2"><Bell size={18} /> Pre-Visit Instructions</h4>
        <p className="text-sm text-yellow-900">{appointment.instructions}</p>
        <button className="text-sm font-semibold text-yellow-700 mt-2 hover:underline flex items-center gap-1"><FileText size={16} /> View Required Paperwork</button>
      </div>
    )}
    {appointment.status === TABS.UPCOMING && (
      <div className="pt-4 border-t space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => onAddToCalendar(appointment)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition ${COLORS.secondary}`}><CalendarPlus size={20} /> Add to Calendar</button>
          <button onClick={() => onReschedule(appointment)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition ${COLORS.secondary}`}><CornerUpLeft size={20} /> Reschedule</button>
        </div>
        <button onClick={() => onCancel(appointment)} className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition text-white ${COLORS.danger}`}><X size={20} /> Cancel Appointment</button>
      </div>
    )}
    {appointment.status === TABS.PAST && (
      <a href="#" target="_blank" rel="noopener noreferrer" className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition text-white ${COLORS.primary}`}><FileText size={20} /> View Visit Summary</a>
    )}
  </div>
);

const DetailItem = ({ icon: Icon, label, value, isLink = false }) => (
  <div className="flex items-center bg-gray-50 p-3 rounded-lg border">
    <Icon size={20} className="text-green-600 mr-3 shrink-0" />
    <div className="flex flex-col">
      <span className="text-xs font-medium text-primary uppercase">{label}</span>
      {isLink ? (
        <a href={label === "Email" ? `mailto:${value}` : `tel:${value}`} className="font-semibold text-green-700 hover:text-green-800 hover:underline">{value}</a>
      ) : (
        <span className="font-semibold text-primary">{value}</span>
      )}
    </div>
  </div>
);

/**
 * Guided Flow for Requesting a New Appointment (Step 1 of 3)
 */
const BookingFlow = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState({});

  const bookingOptions = [
    { type: "Provider", icon: User, details: "See a specific doctor or nurse." },
    { type: "Specialty", icon: Info, details: "Need to see a Cardiologist, Dermatologist, etc." },
    { type: "Reason", icon: FileText, details: "Follow-up, sick visit, or routine check." },
  ];

  // Mock Step 2 & 3 content
  const Step2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Step 2: Select a Time Slot</h3>
      <p className="text-primary">You selected to book by <strong>{selection.type}</strong>. Choose an available time below.</p>
      
      {/* Mock time slot selector */}
      <div className="grid grid-cols-3 gap-2">
        {['Mon 28th (8:00 AM)', 'Tue 29th (1:30 PM)', 'Wed 30th (10:00 AM)'].map((slot, index) => (
          <button 
            key={index} 
            className={`p-3 text-center rounded-lg border transition duration-150 ${index === 0 ? 'bg-green-100 border-green-500 font-bold' : 'bg-white hover:bg-gray-50'}`}
          >
            {slot}
          </button>
        ))}
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={() => setStep(1)} className={`py-2 px-4 rounded-xl font-semibold ${COLORS.secondary}`}>
          Back
        </button>
        <button onClick={() => setStep(3)} className={`py-2 px-4 text-white rounded-xl font-semibold ${COLORS.primary}`}>
          Next: Confirm Details
        </button>
      </div>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Step 3: Review and Confirm</h3>
      <div className="bg-green-50 p-4 rounded-xl border border-green-200">
        <p className="font-bold text-lg text-green-800">Appointment Summary:</p>
        <p>Provider: Dr. Kiandra Karingal (Mock)</p>
        <p>Date/Time: Mon, Oct 28, 10:00 AM</p>
      </div>
      <p className="text-sm text-red-600">Note: All bookings are tentative and subject to final provider approval.</p>
      
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={() => setStep(2)} className={`py-2 px-4 rounded-xl font-semibold ${COLORS.secondary}`}>
          Back
        </button>
        <button onClick={() => { alert('Appointment Request Sent!'); onClose(); }} className={`py-2 px-4 text-white rounded-xl font-semibold ${COLORS.primary}`}>
          Submit Request
        </button>
      </div>
    </div>
  );

  const Step1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Step 1: How would you like to book?</h3>
      <div className="grid grid-cols-1 gap-4">
        {bookingOptions.map(option => (
          <div 
            key={option.type}
            onClick={() => { setSelection({ type: option.type }); setStep(2); }}
            className="p-5 border border-gray-200 rounded-xl cursor-pointer hover:bg-green-50 transition duration-150 flex items-center gap-4 shadow-sm"
          >
            <option.icon size={30} className="text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-lg text-primary">{option.type}</p>
              <p className="text-sm text-primary">{option.details}</p>
            </div>
            <ChevronRight size={20} className="text-primary" />
          </div>
        ))}
      </div>
      <button onClick={onClose} className="text-sm text-primary hover:text-primary font-semibold mt-4 flex items-center gap-1">
        <X size={16} /> Close Booking
      </button>
    </div>
  );

  if (step === 2) return <Step2 />;
  if (step === 3) return <Step3 />;
  return <Step1 />;
};


// --- Main Appointments Scheduler Component ---
export default function Appointments() {
  const [activeTab, setActiveTab] = useState(TABS.UPCOMING);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use the 'api' client to call your backend
        const response = await api.get('/appointments');
        
        // Format the data from the backend to match what the component expects
        const formattedData = response.data.map(app => {
            const appDate = new Date(app.appointment_at);
            return {
                id: app.id,
                provider: app.provider_name,
                specialty: app.provider_specialty,
                date: appDate,
                time: appDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                location: app.location,
                reason: app.reason,
                status: app.status.charAt(0).toUpperCase() + app.status.slice(1), // Capitalize status
                instructions: app.instructions,
                contact: { email: app.contact_email, phone: app.contact_phone },
                summaryLink: "#" // Placeholder
            };
        });
        setAppointments(formattedData);
      } catch (err) {
        setError("Failed to load appointments. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(
    (app) => app.status === activeTab
  );

  const handleCancel = (app) => {
    if (window.confirm(`Are you sure you want to cancel your appointment with ${app.provider}?`)) {
      alert("Appointment has been cancelled.");
      setSelectedAppointment(null);
    }
  };

  const handleReschedule = (app) => {
    alert(`Initiating reschedule for appointment with ${app.provider}.`);
    setSelectedAppointment(null);
    setIsBookingModalOpen(true);
  };

  const handleAddToCalendar = (app) => {
    alert(`Exporting appointment with ${app.provider} to your calendar!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      
      <header className="mb-8 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
          Appointments & Scheduling
        </h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <section className="lg:w-7/12 flex-grow space-y-4">
          <div className="flex justify-between items-center mb-4 sticky top-0 z-10 p-2 -mx-2 -mt-2 rounded-lg">
            <div className="flex space-x-2 p-1">
              <button onClick={() => setActiveTab(TABS.UPCOMING)} className={`py-2 px-4 rounded-lg font-bold text-sm transition ${activeTab === TABS.UPCOMING ? `${COLORS.primary} text-white` : `${COLORS.secondary}`}`}><CalendarCheck size={18} className="inline mr-1" /> Upcoming</button>
              <button onClick={() => setActiveTab(TABS.PAST)} className={`py-2 px-4 rounded-lg font-bold text-sm transition ${activeTab === TABS.PAST ? `${COLORS.primary} text-white` : `${COLORS.secondary}`}`}><History size={18} className="inline mr-1" /> Past</button>
            </div>
            <button onClick={() => setIsBookingModalOpen(true)} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-lg transition ${COLORS.primary}`}><CalendarPlus size={20} /> Request New Appointment</button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <p className="p-8 text-center bg-white rounded-xl shadow-lg text-primary">Loading appointments...</p>
            ) : error ? (
              <p className="p-8 text-center bg-red-50 rounded-xl shadow-lg text-red-600">{error}</p>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((app) => (
                <AppointmentCard key={app.id} appointment={app} onSelect={setSelectedAppointment} />
              ))
            ) : (
              <div className="p-8 text-center bg-white rounded-xl shadow-lg text-primary">
                {activeTab === TABS.UPCOMING ? "You have no upcoming appointments." : "No past appointments found in your history."}
              </div>
            )}
          </div>
        </section>

        <aside className="lg:w-5/12 lg:sticky lg:top-4 h-fit">
          <div className="bg-white rounded-2xl shadow-2xl p-6 transition duration-300 min-h-[300px]">
            {selectedAppointment ? (
              <AppointmentDetail appointment={selectedAppointment} onCancel={handleCancel} onReschedule={handleReschedule} onAddToCalendar={handleAddToCalendar} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4">
                <Info size={48} className="text-yellow-500 mb-3" />
                <h3 className="text-xl font-semibold text-primary">Select an Appointment</h3>
                <p className="text-primary mt-1">Click on any appointment on the left to view details.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
      
      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Request a New Appointment">
        <BookingFlow onClose={() => setIsBookingModalOpen(false)} />
      </Modal>

    </div>
  );
}
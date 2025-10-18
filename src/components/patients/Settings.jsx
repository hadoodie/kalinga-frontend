import { useState, useEffect } from "react";
import { 
  Shield, 
  User, 
  Bell, 
  Cog, 
  Lock, 
  X, 
  Save 
} from "lucide-react";
import api from "../../services/api"; 

export default function PatientSetting() {
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    availability: "",
    language: "English",
    theme: "Light",
    visibility: "Public",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NEW: Fetch user data when the component loads ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/me"); // This uses the existing /me route
        setFormData(response.data);
      } catch (err) {
        setError("Failed to load user settings.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const openModal = (modal) => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- NEW: Handle saving data to the backend ---
  const handleSave = async () => {
    try {
      const response = await api.put("/profile", formData);
      setFormData(response.data); // Update state with the saved data
      alert("Settings saved successfully!");
      closeModal();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        // Handle validation errors
        const validationErrors = err.response.data;
        alert("Please fix the following errors:\n" + Object.values(validationErrors).flat().join('\n'));
      } else {
        alert("Failed to save settings. Please try again.");
      }
      console.error(err);
    }
  };

  const sections = [
    {
      title: "Account and Security",
      icon: <Shield size={18} className="text-green-800 mr-2" />,
      items: [
        { name: "Personal Information", modal: "personalInfo" },
        { name: "Login Devices", modal: "loginDevices" },
      ],
    },
    {
      title: "Professional Information",
      icon: <User size={18} className="text-green-800 mr-2" />,
      items: [
        { name: "Role and Position", modal: "rolePosition" },
        { name: "Availability", modal: "availability" },
      ],
    },
    {
      title: "Notifications",
      icon: <Bell size={18} className="text-green-800 mr-2" />,
      items: [
        { name: "Notification Type", modal: "notificationType" },
        { name: "Priority Alerts", modal: "priorityAlerts" },
        { name: "Mute / Snooze", modal: "muteSnooze" },
        { name: "Reminders", modal: "reminders" },
      ],
    },
    {
      title: "System Preferences",
      icon: <Cog size={18} className="text-green-800 mr-2" />,
      items: [
        { name: "Language", modal: "language" },
        { name: "Theme", modal: "theme" },
      ],
    },
    {
      title: "Privacy and Data",
      icon: <Lock size={18} className="text-green-800 mr-2" />,
      items: [
        { name: "Visibility Settings", modal: "visibilitySettings" },
      ],
    },
  ];
  
  if (isLoading) {
      return <div className="p-8 text-center">Loading settings...</div>
  }
  
  if (error) {
      return <div className="p-8 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-5 bg-gray-50 min-h-[calc(100vh-140px)] overflow-y-auto font-sans text-left text-primary">
      <header className="mb-8 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary text-left">
          Settings
        </h1>
      </header>

      {/* Search Bar */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Find the setting you need"
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* Settings Sections */}
      {sections.map((section, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4"
        >
          <h3 className="flex items-center text-gray-900 font-semibold text-base mb-3">
            {section.icon}
            {section.title}
          </h3>
          <ul>
            {section.items.map((item, idx) => (
              <li
                key={idx}
                onClick={() => openModal(item.modal)}
                className={`py-2 text-sm text-gray-700 border-t border-gray-200 cursor-pointer hover:text-green-600 transition ${
                  idx === 0 ? "border-t-0" : ""
                }`}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="bg-white w-[95%] max-w-md mx-auto rounded-2xl p-5 shadow-lg relative 
                       sm:w-[90%] sm:rounded-xl 
                       max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:rounded-none 
                       max-sm:p-6 max-sm:overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 transition"
              onClick={closeModal}
            >
              <X size={22} />
            </button>

            {/* Modal Title */}
            <h2 className="text-lg font-semibold mb-4 text-primary">
              {activeModal === "personalInfo" && "Personal Information"}
              {activeModal === "loginDevices" && "Login Devices"}
              {activeModal === "rolePosition" && "Role and Position"}
              {activeModal === "availability" && "Availability"}
              {activeModal === "language" && "Language"}
              {activeModal === "theme" && "Theme"}
              {activeModal === "visibilitySettings" && "Visibility Settings"}
              {activeModal === "notificationType" && "Notification Type"}
              {activeModal === "priorityAlerts" && "Priority Alerts"}
              {activeModal === "muteSnooze" && "Mute / Snooze"}
              {activeModal === "reminders" && "Reminders"}
            </h2>

            {/* Modal Content */}
            <div className="space-y-3 text-sm text-gray-700">
              {/* PERSONAL INFO */}
              {activeModal === "personalInfo" && (
                <>
                  <label className="block font-medium">Full Name</label>
                  <input 
                  name="name" 
                  value={formData.name || ''} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 mb-2 focus:ring-2 focus:ring-emerald-500"/>
                  <label className="block font-medium">Email Address</label>
                  <input 
                  name="email" 
                  value={formData.email || ''} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 mb-2 focus:ring-2 focus:ring-emerald-500"/>
                  <label className="block font-medium">Phone Number</label>
                  <input 
                  name="phone" 
                  value={formData.phone || ''} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"/>
                </>
              )}

              {/* ROLE */}
              {activeModal === "rolePosition" && (
                <>
                  <label className="block font-medium">Your Role</label>
                  <input 
                  name="role" 
                  value={formData.role || ''} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"/>
                </>
              )}

              {/* AVAILABILITY */}
              {activeModal === "availability" && (
                <>
                  <label className="block font-medium">Availability</label>
                  <input 
                  name="availability" 
                  value={formData.availability || ''} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"/>
                </>
              )}

              {/* LANGUAGE */}
              {activeModal === "language" && (
                <>
                  <label className="block font-medium">Language</label>
                  <select 
                  name="language" 
                  value={formData.language} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500">
                    <option>English</option>
                    <option>Filipino</option>
                  </select>
                </>
              )}

              {/* THEME */}
              {activeModal === "theme" && (
                <>
                  <label className="block font-medium">Theme</label>
                  <select 
                  name="theme" 
                  value={formData.theme} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500">
                    <option>Light</option>
                    <option>Dark</option>
                  </select>
                </>
              )}

              {/* VISIBILITY */}
              {activeModal === "visibilitySettings" && (
                <>
                  <label className="block font-medium">Visibility</label>
                  <select 
                  name="visibility" 
                  value={formData.visibility} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500">
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                </>
              )}
              
              {/* Other placeholders */}
              {activeModal === "loginDevices" && (
                <p>Manage all devices connected to your account (coming soon).</p>
              )}
              {activeModal === "notificationType" && (
                <p>Choose how to receive updates (Email, SMS, App).</p>
              )}
              {activeModal === "priorityAlerts" && (
                <p>Configure high-priority alerts for emergencies.</p>
              )}
              {activeModal === "muteSnooze" && (
                <p>Set quiet hours and snooze schedules.</p>
              )}
              {activeModal === "reminders" && (
                <p>Set reminders for meetings or upcoming events.</p>
              )}
              
            </div>

            {/* Save button */}
            {(activeModal === "personalInfo" || 
            activeModal === "rolePosition" || 
            activeModal === "availability" || 
            activeModal === "language" || 
            activeModal === "theme" || 
            activeModal === "visibilitySettings") && (
              <button 
              onClick={handleSave} 
              className="mt-6 flex items-center gap-2 bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-green-700 w-full justify-center text-sm">
                <Save size={16} /> Save Changes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
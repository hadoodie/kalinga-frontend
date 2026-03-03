import { Shield, User, Bell, Cog, Lock } from "lucide-react";
import {
  FaUserShield,
  FaUser,
  FaBell,
  FaCogs,
  FaLock,
  FaTimes,
  FaSave,
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaSignOutAlt,
  FaKey,
  FaBellSlash,
  FaCalendarAlt,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function OtherNotificationsModal({ onClose }) {
  const [notificationSettings, setNotificationSettings] = useState({
    lab_results_availability: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const response = await api.get("/notifications/other-settings");
        setNotificationSettings(response.data);
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      }
    };
    fetchNotificationSettings();
  }, []);

  const handleToggle = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.post("/notifications/other-settings", notificationSettings);
      alert("Notification settings saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving notification settings:", error);
      alert("Failed to save notification settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const notifications = [
    {
      key: "lab_results_availability",
      label: "Lab Results Availability",
      description: "Get notified when your lab results are ready",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border-t-4 border-green-700">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            Other Notifications
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Manage your notification preferences
        </p>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.key}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {notification.label}
                </span>
                <button
                  onClick={() => handleToggle(notification.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${
                    notificationSettings[notification.key]
                      ? "bg-green-700"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings[notification.key]
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {notification.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition shadow-md disabled:opacity-50"
          >
            <div className="mr-2" />
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MuteNotificationsModal({ onClose }) {
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const durations = [
    { label: "15 minutes", value: 15, unit: "minutes" },
    { label: "1 hour", value: 1, unit: "hours" },
    { label: "8 hours", value: 8, unit: "hours" },
    { label: "24 hours", value: 24, unit: "hours" },
    { label: "Until I change it", value: null, unit: "permanent" },
  ];

  const handleMute = async () => {
    if (selectedDuration === null && durations[4].unit !== "permanent") {
      alert("Please select a duration");
      return;
    }

    setIsLoading(true);
    try {
      const duration = durations.find((d) =>
        selectedDuration === null
          ? d.unit === "permanent"
          : d.value === selectedDuration
      );

      await api.post("/notifications/mute", {
        duration: duration.value,
        unit: duration.unit,
      });

      alert(`Notifications muted for ${duration.label.toLowerCase()}`);
      onClose();
    } catch (error) {
      console.error("Error muting notifications:", error);
      alert("Failed to mute notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-t-4 border-green-600">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FaBellSlash className="mr-2 text-green-800" />
            Mute Notifications
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Choose how long you want to mute notifications
        </p>

        <div className="space-y-2">
          {durations.map((duration, index) => (
            <button
              key={index}
              onClick={() => setSelectedDuration(duration.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                selectedDuration === duration.value
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {duration.label}
                </span>
                {selectedDuration === duration.value && (
                  <div className="w-5 h-5 bg-green-800 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            onClick={handleMute}
            disabled={isLoading || selectedDuration === undefined}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50"
          >
            <div className="mr-2" />
            {isLoading ? "Muting..." : "Mute Notifications"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      alert("Password changed successfully!");
      onClose();
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-t-4 border-green-600">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              placeholder="Confirm new password"
            />
          </div>

          <p className="text-xs text-gray-500">
            Password must be at least 8 characters long
          </p>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            onClick={handleChangePassword}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50"
          >
            <div className="mr-2" />
            {isLoading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoggedInDevicesModal({ onClose }) {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await api.get("/devices");
        setDevices(response.data);
      } catch (error) {
        console.error("Error fetching devices:", error);
        setDevices([
          {
            id: 1,
            device_name: "Windows PC",
            device_type: "desktop",
            location: "Manila, Philippines",
            ip_address: "192.168.1.100",
            last_active: "2025-11-30 10:30:00",
            is_current: true,
          },
          {
            id: 2,
            device_name: "iPhone 14",
            device_type: "mobile",
            location: "Quezon City, Philippines",
            ip_address: "192.168.1.101",
            last_active: "2025-11-29 18:45:00",
            is_current: false,
          },
          {
            id: 3,
            device_name: "iPad Pro",
            device_type: "tablet",
            location: "Makati, Philippines",
            ip_address: "192.168.1.102",
            last_active: "2025-11-28 14:20:00",
            is_current: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const getDeviceIcon = (type) => {
    switch (type) {
      case "mobile":
        return <FaMobileAlt className="text-green-600" size={24} />;
      case "tablet":
        return <FaTabletAlt className="text-green-600" size={24} />;
      default:
        return <FaDesktop className="text-green-600" size={24} />;
    }
  };

  const handleLogout = async (deviceId) => {
    if (window.confirm("Are you sure you want to log out this device?")) {
      try {
        await api.post(`/devices/${deviceId}/logout`);
        setDevices(devices.filter((d) => d.id !== deviceId));
        alert("Device logged out successfully");
      } catch (error) {
        console.error("Error logging out device:", error);
        alert("Failed to log out device. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 border-t-4 border-green-600 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900">Logged in Devices</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No devices found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">{getDeviceIcon(device.device_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">
                          {device.device_name}
                        </h4>
                        {device.is_current && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {device.location}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        IP: {device.ip_address}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last active:{" "}
                        {new Date(device.last_active).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!device.is_current && (
                    <button
                      onClick={() => handleLogout(device.id)}
                      className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <FaSignOutAlt className="mr-1" />
                      Log Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-500">
            If you see a device you don't recognize, log it out immediately and
            change your password.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentSettingsModal({ onClose }) {
  const [appointmentSettings, setAppointmentSettings] = useState({
    appointment_reminders: [], // Array of selected reminder times
    cancellation_notifications: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAppointmentSettings = async () => {
      try {
        const response = await api.get("/appointments/settings");
        setAppointmentSettings(response.data);
      } catch (error) {
        console.error("Error fetching appointment settings:", error);
      }
    };
    fetchAppointmentSettings();
  }, []);

  const handleToggleCancellation = () => {
    setAppointmentSettings((prev) => ({
      ...prev,
      cancellation_notifications: !prev.cancellation_notifications,
    }));
  };

  const handleToggleReminder = (value) => {
    setAppointmentSettings((prev) => {
      const reminders = prev.appointment_reminders || [];
      const isSelected = reminders.includes(value);

      return {
        ...prev,
        appointment_reminders: isSelected
          ? reminders.filter((r) => r !== value)
          : [...reminders, value],
      };
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.post("/appointments/settings", appointmentSettings);
      alert("Appointment settings saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving appointment settings:", error);
      alert("Failed to save appointment settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reminderOptions = [
    { label: "1 day before", value: "24_hours" },
    { label: "8 hours before", value: "8_hours" },
    { label: "5 hours before", value: "5_hours" },
    { label: "2 hours before", value: "2_hours" },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border-t-4 border-green-700">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            Appointment Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Manage your appointment notification preferences
        </p>

        <div className="space-y-4">
          {/* Appointment Reminders */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Appointment Reminders
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Choose when you want to be reminded about your appointments (you
              can select multiple)
            </p>
            <div className="space-y-2">
              {reminderOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  <span className="text-sm text-gray-900">{option.label}</span>
                  <input
                    type="checkbox"
                    checked={
                      appointmentSettings.appointment_reminders?.includes(
                        option.value
                      ) || false
                    }
                    onChange={() => handleToggleReminder(option.value)}
                    className="w-4 h-4 text-green-700 bg-gray-100 border-gray-300 rounded focus:ring-green-700 focus:ring-2 accent-green-700 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Cancellation Notifications */}
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">
                Cancellation of Appointment
              </span>
              <button
                onClick={handleToggleCancellation}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${
                  appointmentSettings.cancellation_notifications
                    ? "bg-green-700"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    appointmentSettings.cancellation_notifications
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Get notified when an appointment is cancelled
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition shadow-md disabled:opacity-50"
          >
            <div className="mr-2" />
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditSettingModal({ setting, section, onClose, onSave }) {
  const [value, setValue] = useState(`Current value for ${setting}`);

  const handleSave = () => {
    console.log(`Saving new value for ${section.title} > ${setting}: ${value}`);
    onSave(setting, value);
  };

  if (!setting) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border-t-4 border-green-600">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            Edit: {section.title} - {setting}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edit Value:
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            placeholder={`Enter new setting for ${setting}...`}
          />
          <p className="text-xs text-gray-500 mt-1">
            *This is a simplified editor. In production, this would be a
            specific form for "{setting}".
          </p>
        </div>

        <div className="flex justify-end space-x-3 mt-5">
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition shadow-md"
          >
            <FaSave className="mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientSettings() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Account & Security",
      icon: <FaUserShield size={18} className="text-green-600 mr-2" />,
      items: ["Personal Information", "Logged in Devices"],
    },
    {
      title: "Notifications",
      icon: <FaBell size={18} className="text-green-600 mr-2" />,
      items: ["Appointment Settings", "Other Notifications", "Mute"],
    },
    {
      title: "Privacy and Data",
      icon: <FaLock size={18} className="text-green-600 mr-2" />,
      items: ["Change Password"],
    },
  ];

  const [editing, setEditing] = useState(null);
  const [showDevices, setShowDevices] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showMuteNotifications, setShowMuteNotifications] = useState(false);
  const [showOtherNotifications, setShowOtherNotifications] = useState(false);
  const [showAppointmentSettings, setShowAppointmentSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (setting, section) => {
    if (setting === "Personal Information") {
      navigate("/patient/profile");
    } else if (setting === "Logged in Devices") {
      setShowDevices(true);
    } else if (setting === "Change Password") {
      setShowChangePassword(true);
    } else if (setting === "Mute") {
      setShowMuteNotifications(true);
    } else if (setting === "Other Notifications") {
      setShowOtherNotifications(true);
    } else if (setting === "Appointment Settings") {
      setShowAppointmentSettings(true);
    } else {
      setEditing({ setting, section });
    }
  };

  const handleClose = () => {
    setEditing(null);
  };

  const handleCloseDevices = () => {
    setShowDevices(false);
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
  };

  const handleCloseMuteNotifications = () => {
    setShowMuteNotifications(false);
  };

  const handleCloseOtherNotifications = () => {
    setShowOtherNotifications(false);
  };

  const handleCloseAppointmentSettings = () => {
    setShowAppointmentSettings(false);
  };

  const handleSave = (setting, value) => {
    console.log(`Successfully updated ${setting} to: "${value}"`);
    handleClose();
  };

  // Filter sections based on search query
  const filteredSections = sections
    .map((section) => {
      const filteredItems = section.items.filter(
        (item) =>
          item.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);

  return (
    <div className="p-5 bg-gray-50 min-h-[calc(100vh-140px)] font-sans text-left">
      <header className="mb-6 p-4 bg-white rounded-xl shadow-md text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
          Settings
        </h1>
      </header>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Find the setting you need"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {filteredSections.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500">
            No settings found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        filteredSections.map((section, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm"
          >
            <h3 className="flex items-center text-base font-semibold mb-3 text-gray-900">
              {section.icon}
              {section.title}
            </h3>

            <ul className="list-none p-0 m-0">
              {section.items.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleEdit(item, section)}
                  className={`py-2 text-sm text-gray-700 border-t border-gray-200 cursor-pointer hover:text-green-600 hover:bg-gray-50 px-2 rounded-md transition ${
                    idx === 0 ? "border-t-0" : ""
                  }`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {editing && (
        <EditSettingModal
          setting={editing.setting}
          section={editing.section}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}

      {showDevices && <LoggedInDevicesModal onClose={handleCloseDevices} />}
      {showChangePassword && (
        <ChangePasswordModal onClose={handleCloseChangePassword} />
      )}
      {showMuteNotifications && (
        <MuteNotificationsModal onClose={handleCloseMuteNotifications} />
      )}
      {showOtherNotifications && (
        <OtherNotificationsModal onClose={handleCloseOtherNotifications} />
      )}
      {showAppointmentSettings && (
        <AppointmentSettingsModal onClose={handleCloseAppointmentSettings} />
      )}
    </div>
  );
}
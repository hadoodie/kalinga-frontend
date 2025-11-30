// src/pages/Settings.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import "../styles/personnel-style.css"; // Keep original CSS file for custom styles
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
  FaBellSlash,
  FaKey,
  FaUserClock,
  FaVolumeUp,
} from "react-icons/fa";
import api from "../services/api";

function DutyStatusModal({ onClose }) {
  const [dutyStatus, setDutyStatus] = useState("on-duty");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDutyStatus = async () => {
      try {
        // const response = await api.get("/duty-status");
        // setDutyStatus(response.data.status);
        // Simulated data
        setDutyStatus("on-duty");
      } catch (error) {
        console.error("Error fetching duty status:", error);
      }
    };
    fetchDutyStatus();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // await api.post("/duty-status", { status: dutyStatus });
      alert(`Duty status changed to ${dutyStatus.toUpperCase()} (Simulated)`);
      onClose();
    } catch (error) {
      console.error("Error updating duty status:", error);
      alert("Failed to update duty status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-t-4 border-green-700">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FaUserClock className="mr-2 text-green-800" />
            Duty Status
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Set your current duty status
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setDutyStatus("on-duty")}
            className={`w-full text-left p-4 rounded-lg border-2 transition ${
              dutyStatus === "on-duty"
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 block">
                  On Duty
                </span>
                <span className="text-xs text-gray-500">
                  Available to respond to requests
                </span>
              </div>
              {dutyStatus === "on-duty" && (
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
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

          <button
            type="button"
            onClick={() => setDutyStatus("off-duty")}
            className={`w-full text-left p-4 rounded-lg border-2 transition ${
              dutyStatus === "off-duty"
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 block">
                  Off Duty
                </span>
                <span className="text-xs text-gray-500">
                  Not available to respond
                </span>
              </div>
              {dutyStatus === "off-duty" && (
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
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
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition shadow-md disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {isLoading ? "Saving..." : "Save Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationToneModal({ onClose }) {
  const [selectedTone, setSelectedTone] = useState("soft");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchToneSettings = async () => {
      try {
        // const response = await api.get("/notification-tone");
        // setSelectedTone(response.data.tone);
        // Simulated data
        setSelectedTone("soft");
      } catch (error) {
        console.error("Error fetching tone settings:", error);
      }
    };
    fetchToneSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // await api.post("/notification-tone", { tone: selectedTone });
      alert(`Notification tone changed to ${selectedTone.toUpperCase()} (Simulated)`);
      onClose();
    } catch (error) {
      console.error("Error updating notification tone:", error);
      alert("Failed to update notification tone. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const tones = [
    {
      value: "soft",
      label: "Soft",
      description: "Gentle notification sound",
      icon: "🔉",
    },
    {
      value: "loud",
      label: "Loud",
      description: "Loud and clear notification sound",
      icon: "🔊",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-t-4 border-green-700">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FaVolumeUp className="mr-2 text-green-800" />
            Notification Tone
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Choose your preferred notification sound level
        </p>

        <div className="space-y-3">
          {tones.map((tone) => (
            <button
              type="button"
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${
                selectedTone === tone.value
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{tone.icon}</span>
                  <div>
                    <span className="font-semibold text-gray-900 block">
                      {tone.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {tone.description}
                    </span>
                  </div>
                </div>
                {selectedTone === tone.value && (
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
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
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition shadow-md disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {isLoading ? "Saving..." : "Save Tone"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PriorityAlertsModal({ onClose }) {
  const [alertSettings, setAlertSettings] = useState({
    New_incident_alerts: true,
    critical_alerts: true,
    messages: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAlertSettings = async () => {
      // Simulate fetching settings
    };
    fetchAlertSettings();
  }, []);

  const handleToggle = (key) => {
    setAlertSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // await api.post("/notifications/alert-settings", alertSettings);
      alert("Alert settings saved successfully! (Simulated)");
      onClose();
    } catch (error) {
      console.error("Error saving alert settings:", error);
      alert("Failed to save alert settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const alerts = [
    { key: "New_incident_alerts", label: "New Incident Alerts" },
    { key: "critical_alerts", label: "Critical Alerts" },
    { key: "messages", label: "Messages" },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border-t-4 border-green-700">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-900">Priority Alerts</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Manage which alerts you want to receive
        </p>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Alerts for:
          </p>
          {alerts.map((alert) => (
            <div
              key={alert.key}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-sm font-medium text-gray-900">
                {alert.label}
              </span>
              <button
                type="button"
                onClick={() => handleToggle(alert.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${
                  alertSettings[alert.key] ? "bg-green-700" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    alertSettings[alert.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition shadow-md disabled:opacity-50"
          >
            <FaSave className="mr-2" />
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
      const duration = durations.find(
        (d) =>
          selectedDuration === null ? d.unit === "permanent" : d.value === selectedDuration
      );

      // await api.post("/notifications/mute", {
      //   duration: duration.value,
      //   unit: duration.unit,
      // });

      alert(`Notifications muted for ${duration.label.toLowerCase()} (Simulated)`);
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
            type="button"
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
              type="button"
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
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
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
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMute}
            disabled={isLoading || selectedDuration === undefined}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50"
          >
            <FaBellSlash className="mr-2" />
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
      // await api.post("/change-password", {
      //   current_password: currentPassword,
      //   new_password: newPassword,
      //   new_password_confirmation: confirmPassword,
      // });

      alert("Password changed successfully! (Simulated)");
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
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FaKey className="mr-2 text-green-800" />
            Change Password
          </h3>
          <button
            type="button"
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
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50"
          >
            <FaKey className="mr-2" />
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
      // Fallback data
      setDevices([
        {
          id: 1,
          device_name: "Windows PC (Current)",
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
      setIsLoading(false);
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
        // await api.post(`/devices/${deviceId}/logout`);
        setDevices(devices.filter((d) => d.id !== deviceId));
        alert("Device logged out successfully (Simulated)");
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
          <h3 className="text-xl font-bold text-gray-900">
            Logged in Devices
          </h3>
          <button
            type="button"
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
                        Last active: {new Date(device.last_active).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!device.is_current && (
                    <button
                      type="button"
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
            If you see a device you don't recognize, log it out immediately and change your password.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
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

// --- MAIN SETTINGS COMPONENT ---

const sectionsData = [
  {
    title: "Account & Security",
    icon: <FaUserShield size={18} className="text-green-600 mr-2" />,
    items: [
      { label: "Personal Information", action: "navigate", path: "/responder/profile" },
      { label: "Logged in Devices", modal: "loginDevices" },
      { label: "Mark as On-Duty/Off-Duty", modal: "dutyStatus" },
    ],
  },
  {
    title: "Notifications",
    icon: <FaBell size={18} className="text-green-600 mr-2" />,
    items: [
      { label: "Priority Alerts", modal: "priorityAlerts" },
      { label: "Notification Tone", modal: "notificationTone" },
      { label: "Mute/Snooze", modal: "muteSnooze" },
    ],
  },
  {
    title: "Privacy and Data",
    icon: <FaLock size={18} className="text-green-600 mr-2" />,
    items: [{ label: "Change Password", modal: "changePassword" }],
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data when component loads
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(false);
    };
    fetchUserData();
  }, []);

  const openModal = (modalName) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  const handleItemClick = (item) => {
    if (item.action === "navigate" && item.path) {
      navigate(item.path);
    } else if (item.modal) {
      openModal(item.modal);
    }
  };

  // Filter sections based on search query
  const filteredSections = sectionsData
    .map((section) => {
      const filteredItems = section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="settings-page p-5 bg-gray-50 min-h-[calc(100vh-140px)] font-sans text-left">
          <div className="text-center py-8 bg-white rounded-xl shadow-sm mt-5">
            Loading settings...
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="settings-page p-5 bg-gray-50 min-h-[calc(100vh-140px)] font-sans text-left">
          <div className="text-center p-8 bg-red-100 text-red-700 rounded-xl shadow-sm mt-5">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-5 bg-gray-50 min-h-[calc(100vh-140px)] font-sans text-left">
        {/* Header */}
        <header className="mb-6 p-4 bg-white rounded-xl shadow-md text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-green-800">
            Settings 
          </h1>
        </header>

        {/* Search Bar */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Find the setting you need"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Settings Sections */}
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
                    onClick={() => handleItemClick(item)}
                    className={`py-2 text-sm text-gray-700 border-t border-gray-200 cursor-pointer hover:text-green-600 hover:bg-gray-50 px-2 rounded-md transition ${
                      idx === 0 ? "border-t-0" : ""
                    }`}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        {/* Modals */}
        {activeModal === "loginDevices" && (
          <LoggedInDevicesModal onClose={closeModal} />
        )}
        {activeModal === "changePassword" && (
          <ChangePasswordModal onClose={closeModal} />
        )}
        {activeModal === "muteSnooze" && (
          <MuteNotificationsModal onClose={closeModal} />
        )}
        {activeModal === "priorityAlerts" && (
          <PriorityAlertsModal onClose={closeModal} />
        )}
        {activeModal === "dutyStatus" && (
          <DutyStatusModal onClose={closeModal} />
        )}
        {activeModal === "notificationTone" && (
          <NotificationToneModal onClose={closeModal} />
        )}
      </div>
    </Layout>
  );
};

export default Settings;
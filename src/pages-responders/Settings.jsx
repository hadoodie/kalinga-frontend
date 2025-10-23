// src/pages/Settings.jsx
import React, { useState } from "react";
import Layout from "../layouts/Layout";
import "../styles/personnel-style.css";
import {
  FaUserShield,
  FaUser,
  FaBell,
  FaCogs,
  FaLock,
  FaTimes,
  FaSave,
} from "react-icons/fa";

const Settings = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "johndoe@gmail.com",
    phone: "09123456789",
    role: "Youth Leader",
    availability: "Weekends",
    language: "English",
    theme: "Light",
    visibility: "Public",
  });

  const openModal = (modalName) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    alert("Settings saved successfully!");
    closeModal();
  };

  return (
    <Layout>
      <div className="settings-page">
        {/* Search bar */}
        <div className="settings-search">
          <input type="text" placeholder="Find the setting you need" />
        </div>

        {/* Account and Security */}
        <div className="settings-section">
          <h3><FaUserShield className="icon" /> Account and Security</h3>
          <ul>
            <li onClick={() => openModal("personalInfo")}>Personal Information</li>
            <li onClick={() => openModal("loginDevices")}>Login Devices</li>
          </ul>
        </div>

        {/* Professional Information */}
        <div className="settings-section">
          <h3><FaUser className="icon" /> Professional Information</h3>
          <ul>
            <li onClick={() => openModal("rolePosition")}>Role and Position</li>
            <li onClick={() => openModal("availability")}>Availability</li>
          </ul>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h3><FaBell className="icon" /> Notifications</h3>
          <ul>
            <li onClick={() => openModal("notificationType")}>Notification Type</li>
            <li onClick={() => openModal("priorityAlerts")}>Priority Alerts</li>
            <li onClick={() => openModal("muteSnooze")}>Mute/Snooze</li>
            <li onClick={() => openModal("reminders")}>Reminders</li>
          </ul>
        </div>

        {/* System Preferences */}
        <div className="settings-section">
          <h3><FaCogs className="icon" /> System Preferences</h3>
          <ul>
            <li onClick={() => openModal("language")}>Language</li>
            <li onClick={() => openModal("theme")}>Theme</li>
          </ul>
        </div>

        {/* Privacy and Data */}
        <div className="settings-section">
          <h3><FaLock className="icon" /> Privacy and Data</h3>
          <ul>
            <li onClick={() => openModal("visibilitySettings")}>Visibility Settings</li>
          </ul>
        </div>

        {/* MODALS */}
        {activeModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()} // prevent close on inner click
            >
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>

              {/* PERSONAL INFO */}
              {activeModal === "personalInfo" && (
                <>
                  <h2>Personal Information</h2>
                  <label>Full Name:</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  <label>Email Address:</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <label>Phone Number:</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <button className="save-btn" onClick={handleSave}>
                    <FaSave /> Save Changes
                  </button>
                </>
              )}

              {/* ROLE */}
              {activeModal === "rolePosition" && (
                <>
                  <h2>Role and Position</h2>
                  <label>Your Role:</label>
                  <input
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  />
                  <button className="save-btn" onClick={handleSave}>
                    <FaSave /> Save Changes
                  </button>
                </>
              )}

              {/* AVAILABILITY */}
              {activeModal === "availability" && (
                <>
                  <h2>Availability</h2>
                  <label>When are you available?</label>
                  <input
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                  />
                  <button className="save-btn" onClick={handleSave}>
                    <FaSave /> Save Changes
                  </button>
                </>
              )}

              {/* LANGUAGE */}
              {activeModal === "language" && (
                <>
                  <h2>Language</h2>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                  >
                    <option>English</option>
                    <option>Filipino</option>
                  </select>
                  <button className="save-btn" onClick={handleSave}>
                    <FaSave /> Save Changes
                  </button>
                </>
              )}

              {/* THEME */}
              {activeModal === "theme" && (
                <>
                  <h2>Theme</h2>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                  >
                    <option>Light</option>
                    <option>Dark</option>
                  </select>
                  <button className="save-btn" onClick={handleSave}>
                    <FaSave /> Save Changes
                  </button>
                </>
              )}

              {/* VISIBILITY */}
              {activeModal === "visibilitySettings" && (
                <>
                  <h2>Visibility Settings</h2>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                  >
                    <option>Public</option>
                    <option>Private</option>
                    <option>Friends Only</option>
                  </select>
                  <button className="save-btn" onClick={handleSave}>
                    <FaSave /> Save Changes
                  </button>
                </>
              )}

              {/* GENERIC PLACEHOLDERS */}
              {activeModal === "loginDevices" && (
                <>
                  <h2>Login Devices</h2>
                  <p>Feature coming soon: Manage all devices connected to your account.</p>
                </>
              )}
              {activeModal === "notificationType" && (
                <>
                  <h2>Notification Type</h2>
                  <p>Choose how you'd like to receive updates (Email, SMS, App).</p>
                </>
              )}
              {activeModal === "priorityAlerts" && (
                <>
                  <h2>Priority Alerts</h2>
                  <p>Configure high-priority alerts for emergencies.</p>
                </>
              )}
              {activeModal === "muteSnooze" && (
                <>
                  <h2>Mute / Snooze</h2>
                  <p>Control notification quiet hours and snooze schedules.</p>
                </>
              )}
              {activeModal === "reminders" && (
                <>
                  <h2>Reminders</h2>
                  <p>Set reminders for meetings or upcoming events.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Settings;

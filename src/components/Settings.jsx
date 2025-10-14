import { useState, useEffect } from "react";
import {
  Smartphone,
  LogOut,
  UserPlus,
  Edit2,
  Trash2,
  Save,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("privacy");
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load saved settings from localStorage
  const loadData = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  };

  // Devices
  const [devices, setDevices] = useState(
    loadData("devices", [
      {
        id: 1,
        name: "Chrome on Windows",
        location: "Manila, Philippines",
        lastActive: "2 hours ago",
      },
      {
        id: 2,
        name: "Safari on iPhone",
        location: "Quezon City, Philippines",
        lastActive: "Yesterday",
      },
    ])
  );

  // Contacts
  const [contacts, setContacts] = useState(
    loadData("contacts", [
      {
        id: 1,
        name: "Maria Dela Cruz",
        relation: "Sister",
        phone: "0917-123-4567",
      },
      {
        id: 2,
        name: "Brgy. Tanod",
        relation: "Barangay Official",
        phone: "0918-222-3333",
      },
    ])
  );
  const [editingContact, setEditingContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  // Preferences
  const [alerts, setAlerts] = useState(
    loadData("alerts", {
      types: [],
      sms: false,
      email: false,
      urgentOnly: false,
    })
  );
  const [location, setLocation] = useState(
    loadData("location", { address: "", gps: false, evacuation: false })
  );
  const [household, setHousehold] = useState(
    loadData("household", {
      residents: 0,
      children: false,
      elderly: false,
      pwd: false,
      medical: "",
      pets: "",
    })
  );
  const [sharing, setSharing] = useState(
    loadData("sharing", {
      responders: false,
      community: false,
      retention: "Keep for 30 days",
    })
  );

  // Persist settings
  useEffect(() => {
    localStorage.setItem("devices", JSON.stringify(devices));
    localStorage.setItem("contacts", JSON.stringify(contacts));
    localStorage.setItem("alerts", JSON.stringify(alerts));
    localStorage.setItem("location", JSON.stringify(location));
  }, [devices, contacts, alerts, location]);

  const handleLogoutAll = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been logged out from all devices.",
      });
      setDevices([]);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  const handleSave = (section) => {
    alert(`${section} settings saved!`);
  };

  // Contact handlers
  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts([...contacts, { id: Date.now(), ...newContact }]);
    setNewContact({ name: "", relation: "", phone: "" });
  };

  const handleEditContact = (id, field, value) => {
    setContacts(
      contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteContact = (id) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="flex bg-background text-white h-auto overflow-hidden p-4 gap-x-2">
      {/* Sidebar */}
      <div className="h-full w-64 bg-white p-4 rounded-lg flex flex-col shadow-md">
        <ul className="space-y-1">
          {[
            ["privacy", "Data & Privacy"],
            ["devices", "Devices"],
            ["alerts", "Alert Preferences"],
            ["location", "Location Settings"],
            ["contacts", "Emergency Contacts"],
          ].map(([key, label]) => (
            <li key={key}>
              <button
                onClick={() => setActiveTab(key)}
                className={`w-full text-left px-3 py-2 rounded text-primary ${
                  activeTab === key
                    ? "bg-primary text-white"
                    : "text-gray-300 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Content */}
      <div className="bg-white flex-1 rounded-lg p-6 overflow-y-auto shadow-md">
        {activeTab === "privacy" && (
          <div>
            <h1 className="text-2xl font-bold mb-3 text-primary text-left">
              Data & Privacy
            </h1>
            <div className="bg-background rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between bg-background text-primary">
                <span>Allow data collection for analytics</span>
                <input
                  type="checkbox"
                  checked={sharing.analytics}
                  onChange={(e) =>
                    setSharing({ ...sharing, analytics: e.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between bg-background text-primary">
                <span>Allow personalized notifications</span>
                <input
                  type="checkbox"
                  checked={sharing.personalized}
                  onChange={(e) =>
                    setSharing({ ...sharing, personalized: e.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between bg-background text-primary">
                <span>Share location with responders</span>
                <input
                  type="checkbox"
                  checked={sharing.responders}
                  onChange={(e) =>
                    setSharing({ ...sharing, responders: e.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between bg-background text-primary">
                <span>Allow community visibility of status</span>
                <input
                  type="checkbox"
                  checked={sharing.community}
                  onChange={(e) =>
                    setSharing({ ...sharing, community: e.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between bg-background text-primary">
                <label className="mb-2">Data Retention Preferences</label>
                <select
                  value={sharing.retention}
                  onChange={(e) =>
                    setSharing({ ...sharing, retention: e.target.value })
                  }
                  className="bg-primary text-gray-200 px-3 py-2 rounded"
                >
                  <option>Keep for 30 days</option>
                  <option>Keep for 90 days</option>
                  <option>Keep for 1 year</option>
                  <option>Delete immediately after use</option>
                </select>
              </div>
              <button
                onClick={() => handleSave("Privacy")}
                className="mt-4 bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        )}

        {activeTab === "devices" && (
          <div>
            <h1 className="text-2xl font-bold mb-3 text-primary text-left">
              Devices
            </h1>
            <div className="bg-background rounded-lg space-y-4">
              {devices.length === 0 ? (
                <p className="text-gray-400">No devices logged in.</p>
              ) : (
                <ul className="space-y-3">
                  {devices.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center text-left justify-between bg-background text-primary p-4 rounded"
                    >
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-gray-400">
                          {d.location} • Last active {d.lastActive}
                        </p>
                      </div>
                      <Smartphone className="w-5 h-5 text-gray-400" />
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={handleLogoutAll}
                className="mt-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log out all devices
              </button>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div>
            <h1 className="text-2xl font-bold mb-3 text-primary text-left">
              Alert Preferences
            </h1>
            <div className="bg-background rounded-lg p-6 space-y-4">
              <div>
                <p className="text-primary text-left">Alert Types</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Flood", "Fire", "Earthquake", "Medical", "Conflict"].map(
                    (type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 bg-primary px-3 py-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={alerts.types.includes(type)}
                          onChange={(e) =>
                            setAlerts({
                              ...alerts,
                              types: e.target.checked
                                ? [...alerts.types, type]
                                : alerts.types.filter((t) => t !== type),
                            })
                          }
                        />{" "}
                        {type}
                      </label>
                    )
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between bg-background text-primary">
                <span>Notification Channels: SMS</span>
                <input
                  type="checkbox"
                  checked={alerts.sms}
                  onChange={(e) =>
                    setAlerts({ ...alerts, sms: e.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between bg-background text-primary">
                <span>Notification Channels: Email</span>
                <input
                  type="checkbox"
                  checked={alerts.email}
                  onChange={(e) =>
                    setAlerts({ ...alerts, email: e.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between bg-background text-primary ">
                <span>Urgency Filter: Only life-threatening alerts</span>
                <input
                  type="checkbox"
                  checked={alerts.urgentOnly}
                  onChange={(e) =>
                    setAlerts({ ...alerts, urgentOnly: e.target.checked })
                  }
                />
              </div>
              <button
                onClick={() => handleSave("Alerts")}
                className="mt-4 bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        )}

        {activeTab === "location" && (
          <div>
            <h1 className="text-2xl font-bold mb-3 text-primary text-left">
              Location Settings
            </h1>
            <div className="bg-background rounded-lg p-6 space-y-4">
              <div>
                <p className="text-primary text-left">
                  Home Address / Barangay
                </p>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) =>
                    setLocation({ ...location, address: e.target.value })
                  }
                  placeholder="Enter your address"
                  className="w-full mt-2 px-3 py-2 rounded bg-white text-gray-700 outline-none"
                />
              </div>
              <div className="flex items-center justify-between bg-background text-primary">
                <span>Allow GPS live tracking</span>
                <input
                  type="checkbox"
                  checked={location.gps}
                  onChange={(e) =>
                    setLocation({ ...location, gps: e.target.checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between bg-background text-primary">
                <span>Evacuation zone awareness</span>
                <input
                  type="checkbox"
                  checked={location.evacuation}
                  onChange={(e) =>
                    setLocation({ ...location, evacuation: e.target.checked })
                  }
                />
              </div>
              <button
                onClick={() => handleSave("Location")}
                className="mt-4 bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div>
            <h1 className="text-2xl font-bold mb-3 text-primary text-left">
              Emergency Contacts
            </h1>
            <div className="bg-background rounded-lg p-6 space-y-4 text-left">
              <ul className="space-y-3">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between bg-background text-primary"
                  >
                    {editingContact === c.id ? (
                      <div className="flex flex-col gap-2 w-full">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) =>
                            handleEditContact(c.id, "name", e.target.value)
                          }
                          placeholder="Name"
                          className="px-2 py-1 rounded bg-background text-primary"
                        />
                        <input
                          type="text"
                          value={c.relation}
                          onChange={(e) =>
                            handleEditContact(c.id, "relation", e.target.value)
                          }
                          placeholder="Relation"
                          className="px-2 py-1 rounded bg-background text-primary"
                        />
                        <input
                          type="text"
                          value={c.phone}
                          onChange={(e) =>
                            handleEditContact(c.id, "phone", e.target.value)
                          }
                          placeholder="Phone Number"
                          className="px-2 py-1 rounded bg-background text-primary "
                        />
                        <button
                          onClick={() => setEditingContact(null)}
                          className="bg-primary text-white px-3 py-1 rounded mt-2"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-sm text-gray-400">
                            {c.relation} • {c.phone}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingContact(c.id)}
                            className="p-2 hover:text-indigo-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-2 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  className="px-2 py-1 rounded bg-white text-primary"
                />
                <input
                  type="text"
                  placeholder="Relation"
                  value={newContact.relation}
                  onChange={(e) =>
                    setNewContact({ ...newContact, relation: e.target.value })
                  }
                  className="px-2 py-1 rounded bg-white text-primary"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                  className="px-2 py-1 rounded bg-white text-primary"
                />
                <button
                  onClick={handleAddContact}
                  className="bg-primary px-4 py-2 rounded"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

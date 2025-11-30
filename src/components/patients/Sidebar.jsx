import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  ListPlus,
  Menu,
  LogOut,
  Settings,
  FolderInput,
  AlertCircle,
  Cloud,
  MessageSquare,
  Bell,
  User,
  MapPin,
  Navigation,
} from "lucide-react";
import logo from "../../assets/kalinga-logo-white.PNG";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActiveRescue } from "../../hooks/useActiveRescue";
// Ensure this path is correct based on your project structure
import { EmergencyPopup } from "/src/components/emergency-sos/PopUp";

export default function PatientSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { toast } = useToast();

  // Check for active rescue to show tracking link
  const { hasActiveRescue } = useActiveRescue({
    enabled: !!user,
    refreshInterval: 30000,
  });

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      setCollapsed(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Build menu items dynamically based on active rescue status
  const baseItems = [
    {
      label: "Dashboard",
      path: "/patient/dashboard",
      icon: <Home size={25} />,
    },
    {
      label: "Appointments",
      path: "/patient/appointments",
      icon: <FolderInput size={25} />,
    },
    {
      label: "Health Records",
      path: "/patient/health-records",
      icon: <ListPlus size={25} />,
    },
    {
      label: "Messages",
      path: "/patient/messages",
      icon: <MessageSquare size={25} />,
    },
    {
      label: "Weather",
      path: "/patient/weather",
      icon: <Cloud size={25} />,
    },
    {
      label: "Hospital Map",
      path: "/patient/hospital-map",
      icon: <MapPin size={25} />,
    },
    {
      label: "Notifications",
      path: "/patient/notifications",
      icon: <Bell size={25} />,
    },
    {
      label: "Profile",
      path: "/patient/profile",
      icon: <User size={25} />,
    },
  ];

  // Insert "Track Rescue" after Messages when there's an active rescue
  const items = hasActiveRescue
    ? [
        ...baseItems.slice(0, 4), // Dashboard, Appointments, Health Records, Messages
        {
          label: "Track Rescue",
          path: "/patient/rescue-tracker",
          icon: <Navigation size={25} className="text-orange-300" />,
          highlight: true, // Flag to style this item specially
        },
        ...baseItems.slice(4), // Weather, Hospital Map, Notifications, Profile
      ]
    : baseItems;

  const handleNavigation = (item) => {
    if (item.path) navigate(item.path);
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    } finally {
      setMobileOpen(false);
    }
  };

  // Emergency logic
  const resolveLocation = () =>
    new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve({ error: "Geolocation is not supported on this device." });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
          }),
        (error) =>
          resolve({
            error:
              error?.message ||
              "Unable to access location automatically. Please share it manually if prompted.",
          }),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });

  const handleEmergencyClick = () => {
    setShowEmergencyPopup(true);
    setMobileOpen(false); // Close mobile menu if open
  };

  const handleEmergencySendNow = async () => {
    setShowEmergencyPopup(false);
    const triggeredAt = new Date().toISOString();
    let locationPayload = { location: null, error: null };
    
    try {
      locationPayload = await resolveLocation();
    } catch (error) {
      locationPayload = {
        error:
          error?.message ||
          "Unable to access location automatically. Please share it manually if prompted.",
      };
    }

    navigate("/patient/messages", {
      state: {
        filterCategory: "Emergency",
        startEmergencyChat: {
          triggeredAt,
          ...(locationPayload.location ? { location: locationPayload.location } : {}),
          ...(locationPayload.error ? { locationError: locationPayload.error } : {}),
        },
      },
    });
  };

  const handleEmergencyCancel = () => {
    setShowEmergencyPopup(false);
  };

  return (
    <>
      {/* Global Emergency Popup - Rendered outside of sidebar layout constraints */}
      {showEmergencyPopup && (
        <EmergencyPopup
          onSendNow={handleEmergencySendNow}
          onCancel={handleEmergencyCancel}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`h-screen bg-gradient-to-b from-green-950 to-green-600 text-white flex flex-col font-sans transition-[width] duration-300 ease-in-out hidden lg:flex relative z-40
        ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* Top Section with Logo + Hamburger */}
        <div
          className={`flex items-center transition-all duration-300 flex-shrink-0
          ${
            collapsed
              ? "justify-center h-16"
              : "justify-between h-16 px-3"
          }`}
        >
          {!collapsed && (
            <img
              src={logo}
              alt="Kalinga Logo"
              className="h-8 w-auto transition-all duration-300 object-contain"
            />
          )}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="p-1 hover:bg-white/10 rounded-md flex-shrink-0"
          >
            <Menu size={30} />
          </button>
        </div>

        {/* EMERGENCY BUTTON (Desktop) */}
        <div className="px-2 mb-2 mt-2 flex-shrink-0 w-full relative group">
          <button
            onClick={handleEmergencyClick}
            className={`w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-md shadow-lg transition-all duration-300 flex items-center relative overflow-hidden
              ${
                collapsed
                  ? "justify-center py-3 px-0 aspect-square"
                  : "justify-center py-3 px-2 gap-2"
              }`}
          >
            <AlertCircle
              size={collapsed ? 24 : 20}
              className={`flex-shrink-0 ${!collapsed && "animate-pulse"}`}
            />
            {/* Using strict conditional rendering to prevent layout overflow */}
            {!collapsed && (
              <span className="text-sm uppercase tracking-wide whitespace-nowrap overflow-hidden">
                Emergency SOS
              </span>
            )}
            {/* Tooltip for collapsed state - Positioned relative to the button */}
            {collapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-red-600 text-white text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md">
                Emergency SOS
              </span>
            )}
          </button>
        </div>

        <hr className="border-white/20 mx-2 mb-2" />

        {/* Menu Items */}
        {/* overflow-visible allows tooltips to popup without clipping */}
        <ul className="list-none flex-1 p-2 space-y-1 overflow-visible">
          {items.map((item, idx) => (
            <li key={idx} className="group relative">
              <div
                className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300 relative
                  ${collapsed ? "justify-center" : "gap-2"}
                  ${
                    item.highlight
                      ? "bg-orange-500/30 border border-orange-400/50 animate-pulse hover:bg-orange-500/40"
                      : isActive(item.path)
                      ? "bg-white/20 font-bold"
                      : "hover:bg-white/10"
                  }
                `}
                onClick={() => handleNavigation(item)}
              >
                {/* Icon */}
                <span className={`flex-shrink-0 transition-transform duration-300 ${item.highlight ? "animate-bounce" : ""}`}>
                  {item.icon}
                </span>

                {/* Label - Using w-0 and hidden classes to strictly remove width when collapsed */}
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300
                    ${
                      collapsed
                        ? "w-0 opacity-0 hidden"
                        : "w-auto opacity-100 block ml-2"
                    }
                    ${item.highlight ? "font-semibold text-orange-200" : ""}`}
                >
                  {item.label}
                </span>
              </div>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 text-white text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md ${item.highlight ? "bg-orange-600" : "bg-green-950"}`}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Settings & Logout pinned at bottom */}
        <div className="p-2 space-y-2 flex-shrink-0 relative">
          {/* Settings */}
          <div
            className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300 hover:bg-white/10 group relative
              ${collapsed ? "justify-center" : "gap-2"}`}
            onClick={() => navigate("/patient/settings")}
          >
            <Settings size={25} className="flex-shrink-0" />
            {!collapsed && (
              <span className="whitespace-nowrap overflow-hidden">Settings</span>
            )}

            {collapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-green-950 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none shadow-md">
                Settings
              </span>
            )}
          </div>

          {/* Logout */}
          <div
            className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300 hover:bg-white/10 group relative
              ${collapsed ? "justify-center" : "gap-2"}`}
            onClick={handleLogout}
          >
            <LogOut size={25} className="flex-shrink-0" />
            {!collapsed && (
              <span className="whitespace-nowrap overflow-hidden">Log Out</span>
            )}

            {collapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-green-950 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none shadow-md">
                Log Out
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Hamburger + Dropdown */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="p-2 rounded-md bg-green-900 text-white shadow-md"
        >
          <Menu size={22} />
        </button>

        {mobileOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-green-900 text-white rounded-md shadow-xl p-4 space-y-3 border border-green-800 z-50">
            {/* Mobile Emergency Button */}
            <button
              onClick={handleEmergencyClick}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md mb-2 shadow-sm animate-pulse"
            >
              <AlertCircle size={20} />
              <span>EMERGENCY SOS</span>
            </button>
            
            {/* Menu Items */}
            <div className="max-h-[60vh] overflow-y-auto space-y-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 cursor-pointer px-2 py-3 rounded-md transition
                  ${
                    item.highlight
                      ? "bg-orange-500/30 border border-orange-400/50 font-semibold"
                      : isActive(item.path)
                      ? "bg-white/20 font-bold"
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => handleNavigation(item)}
                >
                  <span className={`scale-90 ${item.highlight ? "text-orange-300" : ""}`}>{item.icon}</span>
                  <span className={item.highlight ? "text-orange-200" : ""}>{item.label}</span>
                </div>
              ))}
            </div>

            <hr className="border-white/10" />

            {/* Settings and Logout */}
            <div
              className="flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md hover:bg-white/10"
              onClick={() => navigate("/patient/settings")}
            >
              <Settings size={20} />
              <span>Settings</span>
            </div>

            <div
              className="flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span>Log Out</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  ListPlus,
  PackageOpen,
  Menu,
  LogOut,
  Settings,
  FolderInput,
  Archive,
} from "lucide-react";
import logo from "../../assets/kalinga-logo-white.PNG";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function PatientSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      setCollapsed(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const items = [
    {
      label: "Dashboard",
      path: "/patient/dashboard",
      icon: <Home size={25} />,
    },
    {
      label: "Emergency SOS",
      path: "/patient/report-emergency",
      icon: <Archive size={25} />,
    },
    {
      label: "Appointments & Scheduling",
      path: "/patient/appointments",
      icon: <FolderInput size={25} />,
    },
    {
      label: "My Health Records",
      path: "/patient/health-records",
      icon: <ListPlus size={25} />,
    },
    {
      label: "Messages & Contact",
      path: "/patient/messages",
      icon: <PackageOpen size={25} />,
    },
  ];

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
      // Navigate anyway
      navigate("/login");
    } finally {
      setMobileOpen(false);
    }
  };

  const handleSettings = () => {
    navigate("/patient/settings");
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`h-screen bg-gradient-to-b from-green-950 to-green-600 text-white flex-col font-sans transition-[width] duration-500 ease-in-out hidden lg:flex
        ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* Top Section with Logo + Hamburger */}
        <div
          className={`flex items-center transition-all duration-300
          ${collapsed ? "justify-center h-16" : "justify-between h-16 px-3"}`}
        >
          {!collapsed && (
            <img
              src={logo}
              alt="Kalinga Logo"
              className="h-8 w-auto transition-all duration-300"
            />
          )}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="p-1 hover:bg-white/10 rounded-md"
          >
            <Menu size={30} />
          </button>
        </div>

        {/* Menu */}
        <ul className="list-none flex-1 p-2 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="group relative">
              <div
                className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300
                  ${collapsed ? "justify-center" : "gap-2"}
                  ${
                    isActive(item.path)
                      ? "bg-white/20 font-bold"
                      : "hover:bg-white/10"
                  }
                `}
                onClick={() => handleNavigation(item)}
              >
                {collapsed && (
                  <span className="transition-transform duration-300">
                    {item.icon}
                  </span>
                )}
                {!collapsed && (
                  <span
                    className={`transition-all duration-300 transform ${
                      collapsed
                        ? "opacity-0 -translate-x-2"
                        : "opacity-100 translate-x-0"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </div>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-green-950 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Settings & Logout pinned at bottom */}
        <div className="p-2 space-y-2">
          {/* Settings */}
          <div
            className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300 hover:bg-white/10
              ${collapsed ? "justify-center" : "gap-2"}`}
            onClick={() => navigate("/patient/settings")}
          >
            {collapsed ? <Settings size={25} /> : <span>Settings</span>}
          </div>

          {/* Logout */}
          <div
            className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300 hover:bg-white/10
              ${collapsed ? "justify-center" : "gap-2"}`}
            onClick={handleLogout}
          >
            {collapsed ? <LogOut size={25} /> : <span>Log Out</span>}
          </div>
        </div>
      </aside>

      {/* Mobile Hamburger + Dropdown */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="p-2 rounded-md bg-green-900 text-white"
        >
          <Menu size={22} />
        </button>

        {mobileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-green-900 text-white rounded-md shadow-lg p-4 space-y-3">
            {/* Menu Items */}
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md transition
                  ${
                    isActive(item.path)
                      ? "bg-white/20 font-bold"
                      : "hover:bg-white/10"
                  }`}
                onClick={() => handleNavigation(item)}
              >
                <span>{item.label}</span>
              </div>
            ))}
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

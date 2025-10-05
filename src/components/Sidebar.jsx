import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Building2,
  Cloud,
  Settings,
  Menu,
  Bell,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import logo from "../assets/kalinga-logo-white.PNG";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    { label: "Dashboard", path: "/dashboard", icon: <Home size={25} /> },
    {
      label: "Evacuation Centers",
      path: "/evacuation-center",
      icon: <Building2 size={25} />,
    },
    { label: "Weather", path: "/weather", icon: <Cloud size={25} /> },
    { label: "Messages", path: "/messages", icon: <MessageSquare size={25} /> },
    {
      label: "Notifications",
      path: "/notifications",
      icon: <Bell size={25} />,
    },
    { label: "Profile", path: "/profile", icon: <User size={25} /> },
    { label: "Settings", path: "/settings", icon: <Settings size={25} /> },
  ];

  const handleNavigation = (item) => {
    if (item.path) navigate(item.path);
    setMobileOpen(false); // close dropdown after navigation
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    navigate("/login");
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
            <span
              className={`font-bold text-xl transition-all duration-300 transform ${
                collapsed
                  ? "opacity-0 -translate-x-2"
                  : "opacity-100 translate-x-0"
              }`}
            >
              KALINGA
            </span>
          )}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="p-1 hover:bg-white/10 rounded-md"
          >
            <Menu size={30} />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex flex-col items-center py-4">
          <img
            src="https://i.pravatar.cc/100"
            alt="User Avatar"
            className="w-14 h-14 rounded-full border-2 border-white shadow-md transition-all duration-300"
          />
          <div
            className={`transition-all duration-300 overflow-hidden ${
              collapsed ? "max-h-0 opacity-0" : "max-h-16 opacity-100"
            }`}
          >
            <h2 className="mt-2 text-lg font-bold">Juan Dela Cruz</h2>
            <p className="text-sm text-white/70">Resident</p>
          </div>
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
                {/* Collapsed → show only icon */}
                {collapsed && (
                  <span className="transition-transform duration-300">
                    {item.icon}
                  </span>
                )}

                {/* Expanded → show only label */}
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

        {/* Logout pinned at bottom */}
        <div className="p-2">
          <div
            className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300 hover:bg-white/10
              ${collapsed ? "justify-center" : "gap-2"}`}
            onClick={handleLogout}
          >
            <LogOut size={25} />
            {!collapsed && <span>Log Out</span>}
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
            {/* User Profile inside dropdown */}
            <div className="flex items-center gap-3 border-b border-white/20 pb-3 mb-2">
              <img
                src="https://i.pravatar.cc/100"
                alt="User Avatar"
                className="w-10 h-10 rounded-full border-2 border-white shadow-md"
              />
              <div>
                <h2 className="text-sm font-bold">John Doe</h2>
                <p className="text-xs text-white/70">Admin</p>
              </div>
            </div>

            {/* Menu Items */}
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md transition
                  ${
                    isActive(item.path)
                      ? "bg-white/20 font-bold"
                      : "hover:bg-white/10"
                  }
                `}
                onClick={() => handleNavigation(item)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}

            {/* Logout button in mobile menu */}
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

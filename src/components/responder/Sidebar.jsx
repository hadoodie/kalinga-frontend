import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  FileText,
  AlertCircle,
  AlertTriangle,
  Activity,
  GraduationCap,
  BookOpen,
  Award,
  Menu,
  LogOut,
  Settings,
  User,
  MessageSquare,
} from "lucide-react";
import logo from "../../assets/kalinga-logo-white.PNG";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIncidents } from "../../context/IncidentContext";
import { useReverseGeocode } from "../../hooks/useReverseGeocode";

export default function ResponderSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const { incidents } = useIncidents();

  const activeAssignment = incidents.find((inc) => {
    const isAssigned = inc.assignments?.some(
      (a) => (a.responder_id || a.responder?.id) === user?.id
    );
    const isActive = !["resolved", "cancelled"].includes(inc.status);
    return isAssigned && isActive;
  });

  const { address: activeAddress } = useReverseGeocode(
    activeAssignment?.latitude,
    activeAssignment?.longitude
  );

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      setCollapsed(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Check if any training path is active
  useEffect(() => {
    const trainingPaths = [
      "/responder/online-training",
      "/responder/modules",
      "/responder/certifications",
    ];
    if (trainingPaths.some((path) => location.pathname === path)) {
      setTrainingOpen(true);
    }
  }, [location.pathname]);

  const items = [
    {
      label: "Emergency Console",
      path: "/responder/emergency-console",
      icon: <LayoutDashboard size={25} />,
    },
    {
      label: "Dashboard",
      path: "/responder/dashboard",
      icon: <Home size={25} />,
    },
    {
      label: "Incident Logs",
      path: "/responder/incident-logs",
      icon: <FileText size={25} />,
    },
    {
      label: "Triage System",
      path: "/responder/triage-system",
      icon: <Activity size={25} />,
    },
    {
      label: "Messages",
      path: "/responder/messages",
      icon: <MessageSquare size={25} />,
    },
  ];

  const trainingItems = [
    {
      label: "Online Training",
      path: "/responder/online-training",
      icon: <GraduationCap size={25} />,
    },
    {
      label: "Modules",
      path: "/responder/modules",
      icon: <BookOpen size={20} />,
      isSubmenu: true,
    },
    {
      label: "Certifications",
      path: "/responder/certifications",
      icon: <Award size={20} />,
      isSubmenu: true,
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
      navigate("/login");
    } finally {
      setMobileOpen(false);
    }
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

        {/* Active Assignment Quick Link */}
        {activeAssignment && (
          <div
            className={`mb-2 px-2 ${collapsed ? "flex justify-center" : ""}`}
          >
            <button
              onClick={() =>
                navigate(`/responder/response-mode/${activeAssignment.id}`)
              }
              className={`
                flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/20 text-white hover:bg-red-500/30 transition-all
                ${collapsed ? "p-2 justify-center" : "px-3 py-3 w-full"}
              `}
              title="Return to Active Response"
            >
              <div className="relative">
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <AlertCircle
                  size={collapsed ? 24 : 20}
                  className="text-red-200"
                />
              </div>
              {!collapsed && (
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-bold uppercase text-red-200 tracking-wider">
                    Active Response
                  </p>
                  <p
                    className="text-xs font-semibold truncate"
                    title={activeAddress || `Incident #${activeAssignment.id}`}
                  >
                    {activeAddress || `Incident #${activeAssignment.id}`}
                  </p>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Menu */}
        <ul className="list-none flex-1 p-2 space-y-1">
          {items.map((item, idx) => {
            const isEmergencyItem =
              item.path === "/responder/emergency-console";
            const active = isActive(item.path);
            const baseClasses =
              "flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300";
            const stateGap = collapsed ? "justify-center" : "gap-2";
            const stateBg = isEmergencyItem
              ? active
                ? "bg-red-800 text-white font-bold text-base py-3 my-2 border-t border-b border-red-700"
                : "bg-red-700 text-white font-bold text-base py-3 my-2 border-t border-b border-red-600"
              : active
              ? "bg-white/20 font-bold"
              : "hover:bg-white/10";

            return (
              <li key={idx} className="group relative">
                <div
                  className={`${baseClasses} ${stateGap} ${stateBg}`}
                  onClick={() => handleNavigation(item)}
                >
                  {collapsed && (
                    <span
                      className={`transition-transform duration-300 ${
                        isEmergencyItem ? "p-1 rounded-md bg-red-600/80" : ""
                      }`}
                    >
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
                      <span className="flex items-center">
                        {isEmergencyItem && (
                          <AlertTriangle
                            size={18}
                            className="mr-2 text-white"
                          />
                        )}
                        <span
                          className={
                            isEmergencyItem
                              ? "text-white text-base font-bold"
                              : ""
                          }
                        >
                          {item.label}
                        </span>
                      </span>
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
            );
          })}

          {/* Online Training Section */}
          <li className="group relative">
            <div
              className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300 ${
                collapsed ? "justify-center" : "gap-2"
              } ${
                trainingOpen ? "bg-white/20 font-bold" : "hover:bg-white/10"
              }`}
              onClick={() =>
                handleNavigation({ path: "/responder/online-training" })
              }
            >
              {collapsed && (
                <span className="transition-transform duration-300">
                  <GraduationCap size={25} />
                </span>
              )}
              {!collapsed && (
                <>
                  <span>Online Training</span>
                  <span
                    className={`ml-auto transition-transform duration-300 ${
                      trainingOpen ? "rotate-180" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTrainingOpen((prev) => !prev);
                    }}
                  >
                    ▼
                  </span>
                </>
              )}
            </div>

            {/* Tooltip when collapsed */}
            {collapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-green-950 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                Online Training
              </span>
            )}

            {/* Submenu - show when opened */}
            {!collapsed && trainingOpen && (
              <ul className="ml-4 mt-1 space-y-1">
                {trainingItems.slice(1).map((subItem, idx) => (
                  <li key={idx}>
                    <div
                      className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md transition-all duration-300 ${
                        isActive(subItem.path)
                          ? "bg-white/20 font-bold"
                          : "hover:bg-white/10"
                      }`}
                      onClick={() => handleNavigation(subItem)}
                    >
                      {subItem.icon}
                      <span>{subItem.label}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>

        {/* Settings & Logout pinned at bottom */}
        <div className="p-2 space-y-2">
          {/* Settings */}
          <div
            className={`flex items-center cursor-pointer px-2 py-2 rounded-md transition-all duration-300 hover:bg-white/10
              ${collapsed ? "justify-center" : "gap-2"}`}
            onClick={() => navigate("/responder/settings")}
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
          <div className="absolute right-0 mt-2 w-56 bg-green-900 text-white rounded-md shadow-lg p-4 space-y-3 max-h-[80vh] overflow-y-auto">
            {/* Main Menu Items */}
            {items.map((item, idx) => {
              const isEmergencyItem =
                item.path === "/responder/emergency-console";
              const active = isActive(item.path);
              const mobileBg = isEmergencyItem
                ? active
                  ? "bg-red-800 text-white font-bold text-base py-3 my-2 border-t border-b border-red-700"
                  : "bg-red-700 text-white font-bold text-base py-3 my-2 border-t border-b border-red-600"
                : active
                ? "bg-white/20 font-bold"
                : "hover:bg-white/10";

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md transition ${mobileBg}`}
                  onClick={() => handleNavigation(item)}
                >
                  {isEmergencyItem && (
                    <AlertTriangle size={16} className="mr-2 text-white" />
                  )}
                  <span
                    className={
                      isEmergencyItem ? "text-white text-base font-bold" : ""
                    }
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}

            {/* Online Training Expandable */}
            <div>
              <div
                className="flex items-center justify-between cursor-pointer px-2 py-2 rounded-md hover:bg-white/10"
                onClick={() => setTrainingOpen((prev) => !prev)}
              >
                <span>Online Training</span>
                <span
                  className={`transition-transform duration-300 ${
                    trainingOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              {trainingOpen && (
                <div className="ml-4 mt-1 space-y-2">
                  {trainingItems.slice(1).map((subItem, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md transition
                        ${
                          isActive(subItem.path)
                            ? "bg-white/20 font-bold"
                            : "hover:bg-white/10"
                        }`}
                      onClick={() => handleNavigation(subItem)}
                    >
                      <span>{subItem.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings and Logout */}
            <div
              className="flex items-center gap-2 cursor-pointer px-2 py-2 rounded-md hover:bg-white/10"
              onClick={() => navigate("/responder/settings")}
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

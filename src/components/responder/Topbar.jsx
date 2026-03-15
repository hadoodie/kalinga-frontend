import { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  UserCircle,
  AlertCircle,
  MapPin,
  FlaskConical,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/kalinga-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useIncidents } from "../../context/IncidentContext";
import { useReverseGeocode } from "../../hooks/useReverseGeocode";
import { useResponderDevMenu } from "../../context/ResponderDevMenuContext";

export default function ResponderTopbar({
  notifications = [
    "New incident reported in your area",
    "Triage training module available",
    "Emergency response team deployed",
  ],
}) {
  const { user, logout } = useAuth();
  const { incidents } = useIncidents();
  const capitalizeFirstLetter = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const logoTapTimesRef = useRef([]);
  const logoNavigateTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userName = user?.name || "Responder";
  const userRole = user?.role ? capitalizeFirstLetter(user.role) : "Responder";
  const userPic = user?.profilePicture || "https://i.pravatar.cc/100";
  const isResponseModeRoute = location.pathname.startsWith(
    "/responder/response-mode/",
  );
  const {
    showDevMenu,
    setShowDevMenu,
    showResponseModeTestPanel,
    setShowResponseModeTestPanel,
    enableResponderSimulation,
    setEnableResponderSimulation,
  } = useResponderDevMenu();

  const activeAssignment = Array.isArray(incidents)
    ? incidents.find((inc) => {
        const isAssigned = inc.assignments?.some(
          (a) => (a.responder_id || a.responder?.id) === user?.id,
        );
        const isActive = !["resolved", "cancelled"].includes(inc.status);
        return isAssigned && isActive;
      })
    : null;

  const { address: activeAddress } = useReverseGeocode(
    activeAssignment?.latitude,
    activeAssignment?.longitude,
  );

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoNavigateTimeoutRef.current) {
        clearTimeout(logoNavigateTimeoutRef.current);
      }
    };
  }, []);

  const handleLogoTap = (event) => {
    event.preventDefault();
    const now = Date.now();
    const recent = logoTapTimesRef.current.filter((time) => now - time <= 2000);
    recent.push(now);
    logoTapTimesRef.current = recent;

    if (recent.length >= 5) {
      if (logoNavigateTimeoutRef.current) {
        clearTimeout(logoNavigateTimeoutRef.current);
      }
      logoTapTimesRef.current = [];
      setShowDevMenu((prev) => !prev);
      return;
    }

    if (logoNavigateTimeoutRef.current) {
      clearTimeout(logoNavigateTimeoutRef.current);
    }

    logoNavigateTimeoutRef.current = setTimeout(() => {
      navigate("/responder/dashboard");
      logoTapTimesRef.current = [];
    }, 320);
  };

  return (
    <div className="flex flex-col bg-white p-3 shadow-md relative">
      {/* === Top Row === */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        {/* Logo */}
        <button
          type="button"
          onClick={handleLogoTap}
          aria-label="Kalinga logo"
          className="flex items-center space-x-2 text-xl font-bold text-primary"
        >
          <img src={logo} alt="Kalinga Logo" className="h-10 w-auto" />
          <span className="relative z-10">
            <span className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-950 bg-clip-text text-transparent">
              KALINGA
            </span>
          </span>
        </button>

        {/* === Right Side === */}
        <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Search Box */}
          <div className="flex flex-1 sm:flex-none items-center border border-[#004d25] rounded-full px-3 py-1.5 sm:px-4 sm:py-2 bg-[#f9f9f9] max-w-xs">
            <Search className="text-[#004d25] w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm sm:text-[14px] text-black placeholder:text-gray-500 w-full"
            />
          </div>

          {/* Notification Button + Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative text-[#004d25] w-10 h-10 flex items-center justify-center focus:outline-none"
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                setIsProfileOpen(false);
              }}
            >
              <Bell />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {/* Header with "See all" */}
                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
                  <span className="font-semibold text-sm text-gray-700">
                    Notifications
                  </span>
                  <button
                    onClick={() => {
                      navigate("/responder/dashboard");
                      setIsNotifOpen(false);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    See all
                  </button>
                </div>
                <ul className="text-left max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif, idx) => (
                      <li
                        key={idx}
                        className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                      >
                        {notif}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-sm text-gray-500">
                      No notifications
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Profile Button + Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              className="text-[#004d25] w-10 h-10 flex items-center justify-center focus:outline-none"
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsNotifOpen(false);
              }}
            >
              <UserCircle />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {/* User Info Section */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                  <img
                    src={userPic}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {userName}
                    </p>
                    <p className="text-left text-xs text-gray-500">
                      {userRole}
                    </p>
                  </div>
                </div>

                {/* Dropdown Menu */}
                <ul className="py-1 text-sm text-gray-700">
                  <li>
                    <button
                      onClick={() => {
                        navigate("/responder/profile");
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        navigate("/responder/grades");
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Grades
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        navigate("/responder/settings");
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleLogout()}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      Log out
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Active Incident Quick Access */}
      {activeAssignment && (
        <div className="mt-4 sm:mt-3">
          <button
            onClick={() =>
              navigate(`/responder/response-mode/${activeAssignment.id}`)
            }
            className="w-full flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2 sm:py-3 shadow-sm transition hover:bg-red-100"
          >
            <div className="flex items-center gap-2 sm:gap-3 text-left">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <AlertCircle />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Active Incident
                </span>
                <span className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {activeAddress || `Incident #${activeAssignment.id}`}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin size={14} />
                  <span className="line-clamp-1">
                    {activeAssignment.barangay || "Live response mode"}
                  </span>
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-red-700">Open</span>
          </button>
        </div>
      )}

      {showDevMenu && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Hidden Tools
                </p>
                <h2 className="text-lg font-black text-gray-900">
                  Responder Dev Menu
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Test-only controls are intentionally hidden from the mission
                  console.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDevMenu(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close responder dev menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setShowResponseModeTestPanel((previous) => !previous)
                }
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  showResponseModeTestPanel
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <FlaskConical className="h-4 w-4" />
                  Test Panel (Response Mode)
                </span>
                <span className="text-xs font-bold uppercase tracking-wide">
                  {showResponseModeTestPanel ? "On" : "Off"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEnableResponderSimulation((previous) => !previous)
                }
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  enableResponderSimulation
                    ? "border-blue-300 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="font-semibold">Simulate responder</span>
                <span className="text-xs font-bold uppercase tracking-wide">
                  {enableResponderSimulation ? "On" : "Off"}
                </span>
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              {isResponseModeRoute
                ? "You are in Response Mode. Toggle tools above to reveal the hidden Test screen and simulator controls."
                : "Open a Response Mode incident to use Test and simulation tools."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

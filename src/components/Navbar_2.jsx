import { useState, useRef, useEffect } from "react";
import { HashLink } from "react-router-hash-link";
import { Search, Bell, UserCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/kalinga-logo.png";
import { useAuth } from "../context/AuthContext";
import api from "../services/api"; 
import { formatDistanceToNow } from 'date-fns'; 

// Remove the notifications prop
export const NavbarB = () => {
  const { user, logout } = useAuth();
  const capitalizeFirstLetter = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Add state for notifications
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const userName = user?.name || null;
  const userRole = user?.role ? capitalizeFirstLetter(user.role) : null;
  const userPic = user?.profilePicture || "https://i.pravatar.cc/100";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Fetch notifications when the user logs in
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return; // Don't fetch if no user
      
      setIsLoading(true);
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data.slice(0, 5)); // Get 5 most recent
      } catch (error) {
        console.error("Failed to fetch navbar notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]); // Re-fetch when user changes (e.g., on login)

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

  return (
    <div className="flex flex-col bg-white p-3 shadow-md relative">
      {/* === Top Row === */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        {/* Logo */}
        <HashLink
          smooth
          to="/dashboard"
          className="flex items-center space-x-2 text-xl font-bold text-primary"
        >
          <img src={logo} alt="Kalinga Logo" className="h-10 w-auto" />
          <span className="relative z-10">
            <span className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-950 bg-clip-text text-transparent">
              KALINGA
            </span>
          </span>
        </HashLink>

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
              {/* Notification count */}
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
                  <span className="font-semibold text-sm text-gray-700">
                    Notifications
                  </span>
                  <button
                    onClick={() => navigate("/patient/notifications")}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    See all
                  </button>
                </div>
                {/* Dropdown list */}
                <ul className="text-left max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <li className="px-4 py-3 text-sm text-gray-500 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </li>
                  ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <li
                        key={notif.id}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      >
                        <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                        <p className="text-sm text-gray-600 truncate">{notif.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-sm text-gray-500 text-center">
                      No new notifications
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
                <ul className="py-1 text-sm text-gray-700">
                  <li>
                    <button
                      onClick={() => navigate("/patient/profile")}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/patient/settings")}
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
    </div>
  );
};
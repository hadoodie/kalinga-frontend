import React, { useState, useRef, useEffect } from "react";
import {
  FaBell,
  FaUserCircle,
  FaSearch,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaGraduationCap,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../../styles/topbar.css";

const Topbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Navigation handler
  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  // ✅ Logout handler
  const handleLogout = () => {
    // Clear any stored user session data
    localStorage.clear();
    sessionStorage.clear();

    alert("You have been logged out.");
    setMenuOpen(false);

    // Redirect to login or homepage
    navigate("/login"); // ← change to "/" if you want to go to homepage
  };

  return (
    <div className="topbar-container">
      <div className="topbar">
        <h2 className="welcome-text">Welcome Back, John!</h2>

        <div className="topbar-right">
          {/* Search Box */}
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search..." />
          </div>

          {/* Notifications */}
          <button className="icon-button">
            <FaBell />
          </button>

          {/* User Dropdown */}
          <div className="user-menu" ref={menuRef}>
            <button
              className="icon-button"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <FaUserCircle />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ul>
                    <li onClick={() => handleNavigate("/responder/profile")}>
                      <FaUser className="menu-icon" /> Profile
                    </li>
                    <li onClick={() => handleNavigate("/responder/settings")}>
                      <FaCog className="menu-icon" /> Settings
                    </li>
                    <li onClick={() => handleNavigate("/responder/grades")}>
                      <FaGraduationCap className="menu-icon" /> Grades
                    </li>
                    {/* ✅ Logout now actually logs the user out */}
                    <li className="logout" onClick={handleLogout}>
                      <FaSignOutAlt className="menu-icon" /> Logout
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;

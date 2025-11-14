import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import { getCsrfCookie } from "../services/api";
import { cleanupAuthStorage } from "../utils/storage";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Initialize CSRF protection and check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      // Get CSRF cookie first for security
      await getCsrfCookie();

      // Clean up any invalid localStorage data first
      cleanupAuthStorage();

      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken) {
        try {
          // First try to use cached user data (with validation)
          if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
            try {
              const parsedUser = JSON.parse(savedUser);
              // Validate it's actually an object with user data
              if (
                parsedUser &&
                typeof parsedUser === "object" &&
                parsedUser.id
              ) {
                setUser(parsedUser);
                setToken(savedToken);
                setLoading(false);

                // Then fetch fresh data in background
                try {
                  const userData = await authService.getCurrentUser();
                  setUser(userData);
                  localStorage.setItem("user", JSON.stringify(userData));
                } catch (bgError) {
                  // If background refresh fails, keep using cached data
                  // Only log out if it's explicitly a 401 Unauthorized (invalid token)
                  if (bgError.response?.status === 401) {
                    console.warn(
                      "Cached auth token rejected by API, clearing auth state"
                    );
                    cleanupAuthStorage();
                    setUser(null);
                    setToken(null);
                  } else {
                    console.log(
                      "Background user refresh failed (network issue), using cached data"
                    );
                  }
                }
                return; // Exit early if cached user worked
              }
            } catch (parseError) {
              console.warn("Failed to parse saved user data, will fetch fresh");
              // Clear invalid data
              localStorage.removeItem("user");
            }
          }

          // No valid cached user, fetch from API
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setToken(savedToken);
          localStorage.setItem("user", JSON.stringify(userData));
          setLoading(false);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          // Token is invalid, clear it
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for forced logout events triggered by the API layer
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleForcedLogout = () => {
      cleanupAuthStorage();
      setUser(null);
      setToken(null);
      setLoading(false);
    };

    window.addEventListener("auth:logout", handleForcedLogout);
    return () => {
      window.removeEventListener("auth:logout", handleForcedLogout);
    };
  }, []);

  // Keep session alive with periodic heartbeat
  useEffect(() => {
    if (!user || !token) return;

    // Ping server every 10 minutes to keep session active
    const keepAliveInterval = setInterval(async () => {
      try {
        await authService.getCurrentUser();
        console.log("Session keep-alive successful");
      } catch (error) {
        // If keep-alive fails, session might be expired
        // But don't force logout - let the API interceptor handle it
        console.warn("Session keep-alive failed:", error.message);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(keepAliveInterval);
  }, [user, token]);

  const login = async (credentials) => {
    try {
      // Ensure CSRF cookie is fresh before login
      await getCsrfCookie();

      const data = await authService.login(credentials);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

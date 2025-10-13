import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

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

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      if (savedToken) {
        try {
          // First try to use cached user data
          if (savedUser) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
            setLoading(false);
            
            // Then fetch fresh data in background
            try {
              const userData = await authService.getCurrentUser();
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
            } catch (bgError) {
              // If background refresh fails, keep using cached data
              console.log("Background user refresh failed, using cached data");
            }
          } else {
            // No cached user, fetch from API
            const userData = await authService.getCurrentUser();
            setUser(userData);
            setToken(savedToken);
            localStorage.setItem("user", JSON.stringify(userData));
            setLoading(false);
          }
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

  const login = async (credentials) => {
    try {
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

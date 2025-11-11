// src/services/authService.js
import api from "./api";

export const authService = {
  /**
   * Login user
   */
  async login(credentials) {
    const response = await api.post("/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Register new user
   */
  async register(userData) {
    const response = await api.post("/register", {
      ...userData,
      password_confirmation:
        userData.password_confirmation || userData.password,
    });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const response = await api.get("/me");
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data.user;
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    const response = await api.put("/profile", profileData);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
  },

  /**
   * Upload ID for verification
   */
  async verifyId(idType, idImage) {
    const formData = new FormData();
    formData.append("id_type", idType);
    formData.append("id_image", idImage);

    const response = await api.post("/verify-id", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
  },

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    const response = await api.post("/forgot-password", { email });
    return response.data;
  },

  /**
   * Get user from localStorage
   */
  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const user = this.getUser();
    return user?.role === role;
  },
};

export default authService;

// src/utils/storage.js
// Safe localStorage utilities with validation

/**
 * Safely get and parse JSON from localStorage
 * @param {string} key - The localStorage key
 * @returns {any} Parsed value or null if invalid
 */
export const getStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    
    // Check for invalid values
    if (!item || item === "undefined" || item === "null") {
      return null;
    }
    
    // Try to parse JSON
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    // Clean up invalid data
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Safely set JSON value in localStorage
 * @param {string} key - The localStorage key
 * @param {any} value - The value to store
 * @returns {boolean} Success status
 */
export const setStorageItem = (key, value) => {
  try {
    // Don't store null or undefined
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return false;
    }
    
    // Store as JSON string
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - The localStorage key
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage item "${key}":`, error);
  }
};

/**
 * Clean up invalid auth data from localStorage
 */
export const cleanupAuthStorage = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  // Remove invalid token
  if (token === "undefined" || token === "null" || !token) {
    localStorage.removeItem("token");
  }
  
  // Remove invalid user data
  if (user === "undefined" || user === "null" || !user) {
    localStorage.removeItem("user");
  } else {
    // Try to validate user JSON
    try {
      const parsedUser = JSON.parse(user);
      if (!parsedUser || typeof parsedUser !== "object" || !parsedUser.id) {
        localStorage.removeItem("user");
      }
    } catch {
      localStorage.removeItem("user");
    }
  }
};

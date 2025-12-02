import api from './api';

/**
 * Hospital Safety Index API Service
 * Handles all HSI-related API calls
 */

// Dashboard & Overview
export const getHsiDashboard = () => api.get('/hsi/dashboard');

export const getHospitalCompliance = (hospitalId) => 
  api.get(`/hsi/hospitals/${hospitalId}/compliance`);

export const simulateDisaster = (hospitalId, params = {}) => 
  api.post(`/hsi/hospitals/${hospitalId}/simulate-disaster`, params);

export const recalculateResilience = (hospitalId) => 
  api.post(`/hsi/hospitals/${hospitalId}/recalculate`);

// Disaster Mode
export const activateDisasterMode = (hospitalId, surgeMultiplier = 1.5) => 
  api.post(`/hsi/hospitals/${hospitalId}/disaster-mode/activate`, { surge_multiplier: surgeMultiplier });

export const deactivateDisasterMode = (hospitalId) => 
  api.post(`/hsi/hospitals/${hospitalId}/disaster-mode/deactivate`);

// Safety Assessments
export const getAssessments = (hospitalId, page = 1) => 
  api.get(`/hsi/hospitals/${hospitalId}/assessments`, { params: { page } });

export const createAssessment = (hospitalId, data) => 
  api.post(`/hsi/hospitals/${hospitalId}/assessments`, data);

export const getAssessment = (assessmentId) => 
  api.get(`/hsi/assessments/${assessmentId}`);

// Tanks
export const getTanks = (hospitalId) => 
  api.get(`/hsi/hospitals/${hospitalId}/tanks`);

export const createTank = (hospitalId, data) => 
  api.post(`/hsi/hospitals/${hospitalId}/tanks`, data);

export const updateTankLevel = (tankId, data) => 
  api.patch(`/hsi/tanks/${tankId}/level`, data);

export const refillTank = (tankId, data) => 
  api.post(`/hsi/tanks/${tankId}/refill`, data);

export const getTankHistory = (tankId, page = 1) => 
  api.get(`/hsi/tanks/${tankId}/history`, { params: { page } });

// Vendors
export const getVendors = (hospitalId) => 
  api.get(`/hsi/hospitals/${hospitalId}/vendors`);

export const createVendor = (hospitalId, data) => 
  api.post(`/hsi/hospitals/${hospitalId}/vendors`, data);

export const updateVendor = (vendorId, data) => 
  api.patch(`/hsi/vendors/${vendorId}`, data);

export const triggerVendor = (vendorId) => 
  api.post(`/hsi/vendors/${vendorId}/trigger`);

// Resilience Configs
export const getResilienceConfigs = (hospitalId) => 
  api.get(`/hsi/hospitals/${hospitalId}/resilience-configs`);

export const createResilienceConfig = (hospitalId, data) => 
  api.post(`/hsi/hospitals/${hospitalId}/resilience-configs`, data);

// Constants for HSI thresholds
export const HSI_CONSTANTS = {
  FUEL_MINIMUM_HOURS: 72,
  WATER_MINIMUM_HOURS: 72,
  OXYGEN_MINIMUM_HOURS: 360, // 15 days
  WATER_LITERS_PER_BED_DAY: 300,
  
  SAFETY_CATEGORIES: {
    A: { min: 66, label: 'Safe', color: 'green', description: 'Hospital likely to remain functional' },
    B: { min: 36, label: 'Intervention Needed', color: 'yellow', description: 'Lives not at immediate risk but may be damaged' },
    C: { min: 0, label: 'Urgent Action Required', color: 'red', description: 'High probability of not functioning' },
  },
  
  RESILIENCE_STATUS: {
    critical: { label: 'Critical', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    warning: { label: 'Warning', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    adequate: { label: 'Adequate', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    optimal: { label: 'Optimal', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  },
  
  TANK_TYPES: {
    water: { label: 'Water', icon: '💧' },
    fuel_diesel: { label: 'Diesel Fuel', icon: '⛽' },
    fuel_gasoline: { label: 'Gasoline', icon: '⛽' },
    lpg: { label: 'LPG', icon: '🔥' },
    oxygen: { label: 'Oxygen', icon: '🫁' },
    other: { label: 'Other', icon: '📦' },
  },
  
  RESOURCE_CATEGORIES: {
    fuel: 'Fuel (Diesel/Gasoline)',
    water: 'Water',
    oxygen: 'Oxygen',
    medical_gases: 'Medical Gases (O2, etc.)',
    medicines: 'Medicines',
    food: 'Food',
    medical_supplies: 'Medical Supplies',
    blood_products: 'Blood Products',
    ppe: 'PPE',
    other: 'Other',
  },
};

// Helper functions
export const getSafetyCategoryInfo = (category) => {
  return HSI_CONSTANTS.SAFETY_CATEGORIES[category] || HSI_CONSTANTS.SAFETY_CATEGORIES.C;
};

export const getResilienceStatusInfo = (status) => {
  return HSI_CONSTANTS.RESILIENCE_STATUS[status] || HSI_CONSTANTS.RESILIENCE_STATUS.critical;
};

export const formatSurvivalHours = (hours) => {
  if (hours >= 999999) return '∞';
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  return `${Math.round(hours)}h`;
};

export const getHsiComplianceColor = (percent) => {
  if (percent >= 100) return 'text-green-600';
  if (percent >= 75) return 'text-blue-600';
  if (percent >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export default {
  getHsiDashboard,
  getHospitalCompliance,
  simulateDisaster,
  recalculateResilience,
  activateDisasterMode,
  deactivateDisasterMode,
  getAssessments,
  createAssessment,
  getAssessment,
  getTanks,
  createTank,
  updateTankLevel,
  refillTank,
  getTankHistory,
  getVendors,
  createVendor,
  updateVendor,
  triggerVendor,
  getResilienceConfigs,
  createResilienceConfig,
  HSI_CONSTANTS,
  getSafetyCategoryInfo,
  getResilienceStatusInfo,
  formatSurvivalHours,
  getHsiComplianceColor,
};

// src/services/maintenanceCalendarService.js
import { mockAssetService } from './mockAssetService';

// FIX: Remove process.env usage
const USE_MOCK_DATA = true;

export const maintenanceCalendarService = {
  // Get calendar data with enhanced formatting and asset linking
  getCalendarData: async (filters = {}) => {
    if (USE_MOCK_DATA) {
      // Get maintenance data with full details (enhanced structure)
      const maintenanceData = await mockAssetService.getMaintenanceData({ detail: 'full' });
      
      // Get all assets to link with maintenance items
      const allAssets = await mockAssetService.getAssets();
      
      return transformMaintenanceForCalendar(maintenanceData, allAssets);
    } else {
      // TODO: Real API call
      console.log('Would call real API with filters:', filters);
      const maintenanceData = await mockAssetService.getMaintenanceData({ detail: 'full' });
      const allAssets = await mockAssetService.getAssets();
      return transformMaintenanceForCalendar(maintenanceData, allAssets);
    }
  },

  // Reschedule maintenance with conflict checking
  rescheduleMaintenance: async (maintenanceId, newDate, options = {}) => {
    if (USE_MOCK_DATA) {
      // For mock data, we need to update the maintenance record
      // Since we don't have direct update method, we'll simulate it
      console.log('Mock reschedule:', maintenanceId, newDate);
      return { 
        id: maintenanceId, 
        scheduledDate: newDate,
        success: true 
      };
    } else {
      // TODO: Real API call with conflict detection
      console.log('Would reschedule via API:', maintenanceId, newDate, options);
      return { 
        id: maintenanceId, 
        scheduledDate: newDate,
        success: true 
      };
    }
  },

  // Quick status update
  updateMaintenanceStatus: async (maintenanceId, status, notes = '') => {
    if (USE_MOCK_DATA) {
      // For mock data, simulate status update
      console.log('Mock status update:', maintenanceId, status);
      return { 
        id: maintenanceId, 
        status: status,
        notes: notes,
        success: true 
      };
    } else {
      // TODO: Real API call
      console.log('Would update status via API:', maintenanceId, status);
      return { 
        id: maintenanceId, 
        status: status,
        notes: notes,
        success: true 
      };
    }
  }
};

// FIXED VERSION - Update the transformMaintenanceForCalendar function:
const transformMaintenanceForCalendar = (maintenanceData, allAssets) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create a map for quick asset lookup
  const assetMap = {};
  allAssets.forEach(asset => {
    assetMap[asset.id] = asset;
  });

  // Helper function to enrich maintenance items with asset data
  const enrichMaintenanceItems = (items) => {
    return items.map(item => {
      const asset = assetMap[item.assetId];
      const scheduledDate = new Date(item.scheduledDate);
      const isOverdue = scheduledDate < today && item.status !== 'completed';
      
      return {
        ...item,
        assetType: asset?.type || 'Unknown',
        assetName: asset?.type || item.assetId,
        assetLocation: asset?.location || 'Unknown Location',
        assetCategory: asset?.category || 'Unknown Category',
        assetCondition: asset?.condition || 'Unknown',
        isOverdue: isOverdue,
        priority: item.priority || 'medium'
      };
    });
  };

  // Separate overdue from upcoming properly
  const allUpcoming = maintenanceData.upcoming || [];
  const allCompleted = maintenanceData.completed || [];
  
  const overdueItems = allUpcoming.filter(item => {
    const scheduledDate = new Date(item.scheduledDate);
    return scheduledDate < today && item.status !== 'completed';
  });
  
  const trueUpcoming = allUpcoming.filter(item => {
    const scheduledDate = new Date(item.scheduledDate);
    return scheduledDate >= today || item.status === 'completed';
  });

  return {
    upcoming: enrichMaintenanceItems(trueUpcoming),
    overdue: enrichMaintenanceItems(overdueItems),
    completed: enrichMaintenanceItems(allCompleted)
  };
};

// Asset type icons mapping
export const assetTypeIcons = {
  'Ambulance': '🚑',
  'Fire Truck': '🚒',
  'Generator': '⚡',
  'Rescue Boat': '🚤',
  'Mobile Command': '📡',
  'Water Purifier': '💧',
  'ATV': '🏍️',
  'Field Hospital': '🏥',
  'Defibrillator': '💓',
  'Medical Supplies': '🩺',
  'Fire Engine': '🚒',
  'Rescue Truck': '🚛',
  'Hazmat Unit': '☣️',
  'Power Distribution': '🔌',
  'Patrol Boat': '🛥️',
  'Satellite Trailer': '📡',
  'Radio Repeater': '📻',
  'UTV': '🛵',
  'Water Tanker': '🚛',
  'Portable Ventilator': '🫁',
  'Mobile Kitchen': '🍳',
  'Fuel Truck': '⛽',
  'Light Tower': '💡',
  'Decontamination Unit': '🧼',
  'Ambulance Bus': '🚌',
  'Air Compressor': '💨',
  'Mobile Laboratory': '🔬',
  'Search & Rescue Truck': '🔍',
  'Thermal Camera': '📷',
  'Command Trailer': '🎛️',
  'Helicopter': '🚁',
  'Drone': '🛸',
  'Mobile Workshop': '🛠️',
  'Patient Transport': '♿',
  'Oxygen Concentrator': '💨',
  'Shelter System': '⛺',
  'Utility Truck': '🚚',
  'Water Pump': '💦',
  'Mobile Morgue': '⚰️',
  'Incident Response': '🚨',
  'Gas Detector': '📊',
  'Mobile Pharmacy': '💊',
  'Equipment': '⚙️',
  'Unknown': '❓'
};

// Priority colors mapping
export const priorityColors = {
  'high': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' },
  'medium': { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' },
  'low': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' }
};
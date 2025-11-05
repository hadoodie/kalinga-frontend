import api from './api';

const resourceCalendarService = {
  // Get calendar events with filters
  getCalendarEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.location) params.append('location', filters.location);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.movementType) params.append('movement_type', filters.movementType);
    
    const response = await api.get(`/resources/calendar/events?${params}`);
    return response.data;
  },

  // Get events for specific date
  getDateEvents: async (date) => {
    const response = await api.get(`/resources/calendar/events/${date}`);
    return response.data;
  },

  // Get resource history
  getResourceHistory: async (resourceId) => {
    const response = await api.get(`/resources/${resourceId}/history`);
    return response.data;
  },

  // Get all stock movements
  getStockMovements: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.resourceId) params.append('resource_id', filters.resourceId);
    if (filters.movementType) params.append('movement_type', filters.movementType);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    
    const response = await api.get(`/resources/stock-movements?${params}`);
    return response.data;
  }
};

export default resourceCalendarService;
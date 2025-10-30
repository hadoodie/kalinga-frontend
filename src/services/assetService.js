import api from './api';

const assetService = {
  getRegistry: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    
    return api.get(`/assets/registry?${params.toString()}`);
  },

  getMetrics: () => api.get('/assets/registry/metrics'),
  
  getById: (id) => api.get(`/assets/registry/${id}`),
  
  getByCategory: (category) => api.get(`/assets/registry/category/${category}`),
  
  getByStatus: (status) => api.get(`/assets/registry/status/${encodeURIComponent(status)}`)
};

export default assetService;
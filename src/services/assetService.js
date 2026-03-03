// src/services/assetService.js
// EXCLUSIVE FOR AssetTable.jsx + Asset Registry Suite
// 100% aligned with your screenshot #7 and SYSTEM ARCHITECTURE.txt

import api from './api';

const assetService = {

  // ==================================================================
  // 1. CORE ASSET CRUD (AssetTable.jsx rows + header)
  // ==================================================================

  /**
   * Get all assets with filters
   * Used by: AssetTable.jsx main table
   * Supports: ?status=available&capabilities=temperature_control&category=Refrigerated
   */
  getAssets: async (filters = {}) => {
    const response = await api.get('/assets', { params: filters });
    return response.data; // array of assets with capabilities JSONB
  },

  /**
   * Get single asset details
   * Used by: "View Details" button → AssetDetailPage.jsx
   */
  getAssetById: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  /**
   * Create new asset
   * Used by: "Add Asset" primary button → AddAssetDrawer / AddAssetPage.jsx
   */
  createAsset: async (assetData) => {
    const response = await api.post('/assets', assetData);
    return response.data; // newly created asset with ID
  },

  /**
   * Update existing asset
   * Used by: "Edit" icon on row → edit modal
   */
  updateAsset: async (id, assetData) => {
    const response = await api.put(`/assets/${id}`, assetData);
    return response.data;
  },

  /**
   * Delete asset (soft or hard — depends on backend)
   * Used by: Delete action (if implemented)
   */
  deleteAsset: async (id) => {
    await api.delete(`/assets/${id}`);
  },

  // ==================================================================
  // 2. LOGISTICS ASSIGNMENT (Phase 3)
  // ==================================================================

  /**
   * Assign asset to an allocation
   * Used by: "Assign to Allocation" primary button on Asset row
   * When: asset.status === 'available'
   * Triggers: LogisticsAssignment.jsx modal
   */
  assignAssetToAllocation: async (allocationId, assetId, responderId = null) => {
    const response = await api.post(`/allocations/${allocationId}/assign`, {
      asset_id: assetId,
      responder_id: responderId
    });
    return response.data; // allocation status → logistics_assigned
  },

  // ==================================================================
  // 3. MAINTENANCE INTEGRATION (Mark Maintenance button)
  // ==================================================================

  /**
   * Quick schedule routine maintenance
   * Used by: "Mark Maintenance" secondary button on Asset row
   * Auto-sets: +7 days, priority=medium, description="Routine Preventive Maintenance"
   */
  scheduleRoutineMaintenance: async (assetId) => {
    const response = await api.post('/maintenance', {
      asset_id: assetId,
      scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Routine Preventive Maintenance',
      priority: 'medium'
    });
    return response.data;
  },

  // ==================================================================
  // 4. CAPABILITY FILTERING (Filter Capabilities button)
  // ==================================================================

  /**
   * Filter assets by handling_class capabilities
   * Used by: "Filter Capabilities" dropdown in AssetTable header
   * Example: capabilities=temperature_control → matches assets.capabilities @> '{"temperature_control": true}'
   */
  getAssetsByCapability: async (capability) => {
    const response = await api.get('/assets', {
      params: { capabilities: capability } // GIN index used on backend
    });
    return response.data;
  },

  // Bonus: Combined filter (status + capability)
  getAvailableColdChainAssets: async () => {
    return await assetService.getAssets({
      status: 'available',
      capabilities: 'temperature_control'
    });
  }
};

export default assetService;
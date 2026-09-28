import api from './api';

export const assetService = {
  getAssets: async (params = {}) => {
    const response = await api.get('/assets', { params });
    return response.data;
  },

  getAssetById: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  createAsset: async (data) => {
    const response = await api.post('/assets', data);
    return response.data;
  },

  updateAsset: async (id, data) => {
    const response = await api.put(`/assets/${id}`, data);
    return response.data;
  },

  deleteAsset: async (id) => {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },

  getAssetHistory: async (id) => {
    const response = await api.get(`/assets/${id}/history`);
    return response.data;
  },

  transferAsset: async (id, transferData) => {
    const response = await api.post(`/assets/${id}/transfer`, transferData);
    return response.data;
  },

  retireAsset: async (id, retireData) => {
    const response = await api.post(`/assets/${id}/retire`, retireData);
    return response.data;
  },

  disposeAsset: async (id, disposeData) => {
    const response = await api.post(`/assets/${id}/dispose`, disposeData);
    return response.data;
  },

  getAssetQR: async (id) => {
    const response = await api.get(`/assets/${id}/qr`);
    return response.data;
  },

  importCSV: async (rows) => {
    const response = await api.post('/assets/import/csv', { rows });
    return response.data;
  },

  exportCSVUrl: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return `/api/assets/export/csv?${searchParams.toString()}`;
  },
};

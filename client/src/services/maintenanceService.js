import api from './api';

export const maintenanceService = {
  getTickets: async (params = {}) => {
    const response = await api.get('/maintenance', { params });
    return response.data;
  },

  getTicketById: async (id) => {
    const response = await api.get(`/maintenance/${id}`);
    return response.data;
  },

  createTicket: async (data) => {
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  updateTicket: async (id, data) => {
    const response = await api.put(`/maintenance/${id}`, data);
    return response.data;
  },

  addComment: async (id, comment) => {
    const response = await api.post(`/maintenance/${id}/comments`, { comment });
    return response.data;
  },

  deleteTicket: async (id) => {
    const response = await api.delete(`/maintenance/${id}`);
    return response.data;
  },
};

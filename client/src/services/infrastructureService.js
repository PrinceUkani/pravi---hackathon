import api from './api';

export const locationService = {
  getLocations: async () => {
    const res = await api.get('/locations');
    return res.data;
  },
  createLocation: async (data) => {
    const res = await api.post('/locations', data);
    return res.data;
  },
  updateLocation: async (id, data) => {
    const res = await api.put(`/locations/${id}`, data);
    return res.data;
  },
  deleteLocation: async (id) => {
    const res = await api.delete(`/locations/${id}`);
    return res.data;
  },
};

export const departmentService = {
  getDepartments: async () => {
    const res = await api.get('/departments');
    return res.data;
  },
  createDepartment: async (data) => {
    const res = await api.post('/departments', data);
    return res.data;
  },
  updateDepartment: async (id, data) => {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
  },
  deleteDepartment: async (id) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },
};

export const vendorService = {
  getVendors: async () => {
    const res = await api.get('/vendors');
    return res.data;
  },
  createVendor: async (data) => {
    const res = await api.post('/vendors', data);
    return res.data;
  },
  updateVendor: async (id, data) => {
    const res = await api.put(`/vendors/${id}`, data);
    return res.data;
  },
  deleteVendor: async (id) => {
    const res = await api.delete(`/vendors/${id}`);
    return res.data;
  },
};

export const categoryService = {
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
  },
};

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },
};

export const reportService = {
  getAssetReport: async () => {
    const res = await api.get('/reports/assets');
    return res.data;
  },
  getWarrantyReport: async () => {
    const res = await api.get('/reports/warranty');
    return res.data;
  },
  getMaintenanceReport: async () => {
    const res = await api.get('/reports/maintenance');
    return res.data;
  },
  getHealthReport: async () => {
    const res = await api.get('/reports/health');
    return res.data;
  },
};

export const auditService = {
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  },
};

export const userService = {
  getUsers: async () => {
    const res = await api.get('/users');
    return res.data;
  },
  createUser: async (data) => {
    const res = await api.post('/users', data);
    return res.data;
  },
  updateUser: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};

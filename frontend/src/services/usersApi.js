// web admin: src/services/usersApi.js
import api from './api';

export const usersApi = {
  list: (params = {}) => api.get('/users', { params }),
  stats: () => api.get('/users/stats'),
  byRole: (role) => api.get(`/users/role/${role}`),
  create: (body) => api.post('/users', body),
  get: (id) => api.get(`/users/${id}`),
  update: (id, body) => api.put(`/users/${id}`, body),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  updateStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  remove: (id) => api.delete(`/users/${id}`),
};
